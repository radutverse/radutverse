import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ownerAddress } = body;

    if (!ownerAddress || typeof ownerAddress !== "string") {
      return NextResponse.json(
        {
          ok: false,
          error: "owner_address_required",
          message: "Owner address is required",
        },
        { status: 400 },
      );
    }

    const trimmedAddress = ownerAddress.trim().toLowerCase();

    if (!/^0x[a-f0-9]{40}$/.test(trimmedAddress)) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_address_format",
          message: "Invalid Ethereum address format",
        },
        { status: 400 },
      );
    }

    console.log(
      "[Resolve Owner Domain] Looking up domain for:",
      trimmedAddress,
    );

    try {
      const response = await fetch(
        `https://bens.services.blockscout.com/api/v1/1514/addresses/${encodeURIComponent(trimmedAddress)}`,
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
          `[Resolve Owner Domain] Blockscout API error: ${response.status}`,
        );

        if (response.status === 404) {
          return NextResponse.json({
            ok: true,
            ownerAddress: trimmedAddress,
            domain: null,
            domains: [],
            message: "No domains registered for this address",
          });
        }

        return NextResponse.json(
          {
            ok: false,
            error: "blockscout_api_error",
            message: `Failed to resolve owner domain: ${response.status}`,
          },
          { status: response.status },
        );
      }

      const data = await response.json();

      console.log("[Resolve Owner Domain] Raw API response:", {
        ownerAddress: trimmedAddress,
        responseKeys: Object.keys(data),
        hasDomain: !!data.domain,
        domainName: data.domain?.name,
        resolvedDomainsCount: data.resolved_domains_count,
      });

      const domain = data.domain;
      const domainName = domain?.name || null;
      const expiryDate = domain?.expiry_date || null;

      console.log("[Resolve Owner Domain] Found domain:", {
        ownerAddress: trimmedAddress,
        domainName,
        expiryDate,
      });

      return NextResponse.json({
        ok: true,
        ownerAddress: trimmedAddress,
        domain: domainName,
        domains: domainName
          ? [{ name: domainName, expiryDate: expiryDate }]
          : [],
        message: domainName
          ? `Found domain: ${domainName}`
          : "No domains registered for this address",
      });
    } catch (fetchError: any) {
      if (fetchError.name === "AbortError") {
        console.error("[Resolve Owner Domain] Request timeout");
        return NextResponse.json(
          {
            ok: false,
            error: "timeout",
            message: "Blockscout API is responding slowly. Please try again.",
          },
          { status: 504 },
        );
      }

      console.error("[Resolve Owner Domain] Fetch error:", fetchError?.message);
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
    console.error("[Resolve Owner Domain] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}
