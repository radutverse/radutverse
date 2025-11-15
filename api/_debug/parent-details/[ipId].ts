import "dotenv/config";
import { setCorsHeaders, handleOptions } from "../../utils/middleware";

async function fetchParentIpDetails(
  childIpId: string,
  apiKey: string,
): Promise<any> {
  try {
    const response = await fetch(
      "https://api.storyapis.com/api/v4/assets/edges",
      {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          where: {
            childIpId: childIpId,
          },
          pagination: {
            limit: 100,
            offset: 0,
          },
        }),
      },
    );

    if (!response.ok) {
      console.warn(
        `Failed to fetch parent details for ${childIpId}: ${response.status}`,
      );
      return null;
    }

    const data = await response.json();
    if (!Array.isArray(data.data) || data.data.length === 0) {
      return null;
    }

    const edges = data.data;
    return {
      parentIpIds: edges.map((edge: any) => edge.parentIpId),
      licenseTermsIds: edges.map((edge: any) => edge.licenseTermsId),
      licenseTemplates: edges.map((edge: any) => edge.licenseTemplate),
      edges: edges,
    };
  } catch (error) {
    console.warn(`Error fetching parent details for ${childIpId}:`, error);
    return null;
  }
}

export default async function handler(req: any, res: any) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return handleOptions(res);
  }

  if (req.method === "GET") {
    try {
      const { ipId } = req.query;
      const apiKey = process.env.STORY_API_KEY;

      if (!apiKey) {
        return res.status(500).json({
          ok: false,
          error: "API key not configured",
        });
      }

      const ipIdStr = Array.isArray(ipId) ? ipId[0] : ipId;

      const response = await fetch("https://api.storyapis.com/api/v4/assets", {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          where: {
            ipIds: [ipIdStr],
          },
          pagination: {
            limit: 1,
            offset: 0,
          },
        }),
      });

      if (!response.ok) {
        return res.status(response.status).json({
          ok: false,
          error: `API returned ${response.status}`,
        });
      }

      const data = await response.json();
      const asset = data?.data?.[0];

      let parentIpDetails = null;
      if (asset?.parentsCount && asset.parentsCount > 0) {
        parentIpDetails = await fetchParentIpDetails(ipIdStr as string, apiKey);
      }

      return res.json({
        ok: true,
        ipId: ipIdStr,
        status: response.status,
        asset: asset,
        parentsCount: asset?.parentsCount,
        parentIpDetails: parentIpDetails,
        message: "Asset details with parent IP information",
      });
    } catch (error: any) {
      res.status(500).json({
        ok: false,
        error: error?.message || "Failed to fetch asset details",
      });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
}
