import { NextRequest, NextResponse } from "next/server";
import { fetchParentIpDetails, convertIpfsUriToHttp, fetchIpaMetadata } from "@/lib/api/shared";

const IDP_SEARCH = new Map<string, { status: number; body: any; ts: number }>();

export async function POST(request: NextRequest) {
  try {
    const idempotencyKey = request.headers.get("Idempotency-Key") || undefined;

    if (idempotencyKey && IDP_SEARCH.has(idempotencyKey)) {
      const cached = IDP_SEARCH.get(idempotencyKey)!;
      if (Date.now() - cached.ts < 60_000) {
        return NextResponse.json(
          { ok: true, ...cached.body },
          { status: cached.status }
        );
      } else {
        IDP_SEARCH.delete(idempotencyKey);
      }
    }

    const body = await request.json();
    const { query, mediaType } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        {
          ok: false,
          error: "query_required",
          message: "Search query is required",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.STORY_API_KEY;
    if (!apiKey) {
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
    const limit = 50;
    const maxIterations = 10;
    let iterations = 0;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

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
                  titleContains: query,
                  ...(mediaType && { mediaType }),
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
            clearTimeout(timeoutId);
            return NextResponse.json(
              {
                ok: false,
                error: "story_api_error",
                status: response.status,
              },
              { status: response.status }
            );
          }

          const data = await response.json();
          const assets = Array.isArray(data) ? data : data?.data || [];

          if (!Array.isArray(assets)) {
            break;
          }

          const validAssets = assets.filter((asset: any) => asset && typeof asset === "object");
          allAssets = allAssets.concat(validAssets);

          const pagination = data?.pagination;
          hasMore = pagination?.hasMore === true && validAssets.length > 0;
          offset += limit;

          if (validAssets.length < limit) {
            hasMore = false;
          }
        } catch (fetchError: any) {
          if (fetchError.name === "AbortError") {
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
        IDP_SEARCH.set(idempotencyKey, {
          status: 200,
          body: responseBody,
          ts: Date.now(),
        });
      }

      return NextResponse.json({ ok: true, ...responseBody });
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error: any) {
    console.error("[Search IP Assets] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
