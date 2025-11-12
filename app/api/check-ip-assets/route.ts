import { NextRequest, NextResponse } from "next/server";

const IDP_CHECK = new Map<string, { status: number; body: any; ts: number }>();

export async function POST(request: NextRequest) {
  try {
    const idempotencyKey = request.headers.get("Idempotency-Key") || undefined;
    
    if (idempotencyKey && IDP_CHECK.has(idempotencyKey)) {
      const cached = IDP_CHECK.get(idempotencyKey)!;
      if (Date.now() - cached.ts < 60_000) {
        return NextResponse.json(
          { ok: true, ...cached.body },
          { status: cached.status }
        );
      } else {
        IDP_CHECK.delete(idempotencyKey);
      }
    }

    const body = await request.json();
    const { address } = body;

    if (!address || typeof address !== "string") {
      return NextResponse.json(
        {
          ok: false,
          error: "address_required",
          message: "Address is required",
        },
        { status: 400 }
      );
    }

    const trimmedAddress = address.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmedAddress)) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_address",
          message: "Invalid Ethereum address format",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.STORY_API_KEY;
    if (!apiKey) {
      console.error("STORY_API_KEY environment variable not configured");
      return NextResponse.json(
        {
          ok: false,
          error: "server_config_missing",
          message: "Server configuration error: STORY_API_KEY not set",
        },
        { status: 500 }
      );
    }

    let allAssets: any[] = [];
    let offset = 0;
    let hasMore = true;
    const limit = 100;
    const maxIterations = 10;
    let iterations = 0;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      while (hasMore && iterations < maxIterations) {
        iterations += 1;

        try {
          const response = await fetch(
            "https://api.storyapis.com/api/v4/assets",
            {
              method: "POST",
              headers: {
                "X-Api-Key": apiKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                where: {
                  ownerAddress: trimmedAddress,
                },
                pagination: {
                  limit,
                  offset,
                },
              }),
              signal: controller.signal,
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error(
              `Story API Error: ${response.status} - ${errorText}`,
              {
                address: trimmedAddress,
                offset,
                iteration: iterations,
              }
            );

            let errorDetail = errorText;
            try {
              const errorJson = JSON.parse(errorText);
              errorDetail = errorJson.message || errorJson.error || errorText;
            } catch {
              // Keep the raw text if not JSON
            }

            clearTimeout(timeoutId);
            return NextResponse.json(
              {
                ok: false,
                error: `story_api_error`,
                details: errorDetail,
                status: response.status,
              },
              { status: response.status }
            );
          }

          const data = await response.json();

          if (!data) {
            console.error("Empty response from Story API", {
              address: trimmedAddress,
              offset,
              iteration: iterations,
            });
            break;
          }

          const assets = Array.isArray(data) ? data : data?.data || [];

          if (!Array.isArray(assets)) {
            console.warn("Unexpected response format from Story API", {
              address: trimmedAddress,
              offset,
              iteration: iterations,
              dataKeys: Object.keys(data || {}),
              dataType: typeof data,
            });
            break;
          }

          const validAssets = assets.filter((asset: any) => {
            if (!asset || typeof asset !== "object") {
              console.warn("Invalid asset object", { asset });
              return false;
            }
            return true;
          });

          allAssets = allAssets.concat(validAssets);

          const pagination = data?.pagination;
          hasMore = pagination?.hasMore === true && validAssets.length > 0;
          offset += limit;

          if (validAssets.length < limit) {
            hasMore = false;
          }
        } catch (fetchError: any) {
          if (fetchError.name === "AbortError") {
            console.error("Story API request timed out", {
              address: trimmedAddress,
              offset,
              iteration: iterations,
            });
            break;
          }
          throw fetchError;
        }
      }

      clearTimeout(timeoutId);

      const responseBody = {
        assets: allAssets,
        count: allAssets.length,
      };

      if (idempotencyKey) {
        IDP_CHECK.set(idempotencyKey, {
          status: 200,
          body: responseBody,
          ts: Date.now(),
        });
      }

      return NextResponse.json({ ok: true, ...responseBody });
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error: any) {
    console.error("[Check IP Assets] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
