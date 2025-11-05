import { RequestHandler } from "express";

export const handleResolveOwnerDomain: RequestHandler = async (req, res) => {
  try {
    const { ownerAddress } = req.body;

    if (!ownerAddress || typeof ownerAddress !== "string") {
      return res.status(400).json({
        ok: false,
        error: "owner_address_required",
        message: "Owner address is required",
      });
    }

    const trimmedAddress = ownerAddress.trim().toLowerCase();

    // Validate Ethereum address format
    if (!/^0x[a-f0-9]{40}$/.test(trimmedAddress)) {
      return res.status(400).json({
        ok: false,
        error: "invalid_address_format",
        message: "Invalid Ethereum address format",
      });
    }

    console.log("[Resolve Owner Domain] Looking up domain for:", trimmedAddress);

    try {
      // Call Blockscout API to get all domains for an address
      // Chain ID 1514 is Story Protocol Testnet
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
          // No domains found for this address is valid
          return res.json({
            ok: true,
            ownerAddress: trimmedAddress,
            domain: null,
            domains: [],
            message: "No domains registered for this address",
          });
        }

        return res.status(response.status).json({
          ok: false,
          error: "blockscout_api_error",
          message: `Failed to resolve owner domain: ${response.status}`,
        });
      }

      const data = await response.json();

      console.log("[Resolve Owner Domain] Raw API response:", {
        ownerAddress: trimmedAddress,
        responseKeys: Object.keys(data),
        dataType: typeof data.data,
        dataIsArray: Array.isArray(data.data),
        rawData: JSON.stringify(data).substring(0, 500),
      });

      // data.data should contain an array of domain objects
      // Each domain object typically has: name, expiry_date, etc.
      const domains = Array.isArray(data.data) ? data.data : [];

      // Get the primary domain (first active one, or just the first one)
      const primaryDomain = domains.length > 0 ? domains[0].name : null;

      console.log("[Resolve Owner Domain] Found domains:", {
        ownerAddress: trimmedAddress,
        domainCount: domains.length,
        primaryDomain,
        firstDomain: domains[0],
      });

      res.json({
        ok: true,
        ownerAddress: trimmedAddress,
        domain: primaryDomain,
        domains: domains.map((d: any) => ({
          name: d.name,
          expiryDate: d.expiry_date,
        })),
        message: primaryDomain
          ? `Found domain: ${primaryDomain}`
          : "No domains registered for this address",
      });
    } catch (fetchError: any) {
      if (fetchError.name === "AbortError") {
        console.error("[Resolve Owner Domain] Request timeout");
        return res.status(504).json({
          ok: false,
          error: "timeout",
          message: "Blockscout API is responding slowly. Please try again.",
        });
      }

      // If we can't reach Blockscout, return a response indicating no domain found
      // This allows the UI to continue functioning
      console.warn(
        "[Resolve Owner Domain] Fetch error:",
        fetchError?.message,
      );
      return res.json({
        ok: true,
        ownerAddress: trimmedAddress,
        domain: null,
        domains: [],
        message: "Unable to check for domains at this time",
      });
    }
  } catch (error: any) {
    console.error("[Resolve Owner Domain] Error:", error);
    res.status(500).json({
      ok: false,
      error: error?.message || "Internal server error",
      details:
        process.env.NODE_ENV !== "production"
          ? error?.stack
          : "An unexpected error occurred",
    });
  }
};
