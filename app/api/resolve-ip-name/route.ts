import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ipName } = body;

    if (!ipName || typeof ipName !== "string") {
      return NextResponse.json(
        {
          ok: false,
          error: "ip_name_required",
          message: "IP name is required",
        },
        { status: 400 },
      );
    }

    const trimmedName = ipName.trim();

    if (!trimmedName.endsWith(".ip")) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_ip_name",
          message: "Must be a valid .ip name (e.g., myname.ip)",
        },
        { status: 400 },
      );
    }

    console.log("[Resolve IP Name] Resolving:", trimmedName);

    try {
      const response = await fetch(
        `https://bens.services.blockscout.com/api/v1/1514/domains/${encodeURIComponent(trimmedName)}?only_active=true`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(5000),
        },
      );

      if (!response.ok) {
        console.warn(
          `[Resolve IP Name] Blockscout API error: ${response.status}`,
        );

        if (response.status === 404) {
          return NextResponse.json(
            {
              ok: false,
              error: "ip_name_not_found",
              message: `IP name "${trimmedName}" not found or not registered`,
            },
            { status: 404 },
          );
        }

        return NextResponse.json(
          {
            ok: false,
            error: "blockscout_api_error",
            message: `Failed to resolve IP name: ${response.status}`,
          },
          { status: response.status },
        );
      }

      const data = await response.json();

      if (!data.resolved_address?.hash) {
        return NextResponse.json(
          {
            ok: false,
            error: "resolution_failed",
            message: `Could not resolve "${trimmedName}" to an address`,
          },
          { status: 404 },
        );
      }

      const resolvedAddress = data.resolved_address.hash;

      console.log("[Resolve IP Name] Resolved to:", {
        ipName: trimmedName,
        address: resolvedAddress,
      });

      return NextResponse.json({
        ok: true,
        ipName: trimmedName,
        address: resolvedAddress,
      });
    } catch (fetchError: any) {
      if (fetchError.name === "AbortError") {
        console.error("[Resolve IP Name] Request timeout");
        return NextResponse.json(
          {
            ok: false,
            error: "timeout",
            message: "Blockscout API is responding slowly. Please try again.",
          },
          { status: 504 },
        );
      }

      console.error("[Resolve IP Name] Fetch error:", fetchError?.message);
      return NextResponse.json(
        {
          ok: false,
          error: "network_error",
          message: fetchError?.message || "Unable to connect to Blockscout API",
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("[Resolve IP Name] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Internal server error",
        details:
          process.env.NODE_ENV !== "production"
            ? error?.stack
            : "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
}
