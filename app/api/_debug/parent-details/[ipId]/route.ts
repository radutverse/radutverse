import { NextRequest, NextResponse } from "next/server";
import { fetchParentIpDetails } from "@/lib/api/shared";

export async function GET(
  request: NextRequest,
  { params }: { params: { ipId: string } }
) {
  try {
    const { ipId } = params;
    const apiKey = process.env.STORY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "API key not configured",
        },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.storyapis.com/api/v4/assets", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        where: {
          ipIds: [ipId],
        },
        pagination: {
          limit: 1,
          offset: 0,
        },
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `API returned ${response.status}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const asset = data?.data?.[0];

    let parentIpDetails = null;
    if (asset?.parentsCount && asset.parentsCount > 0) {
      parentIpDetails = await fetchParentIpDetails(ipId, apiKey);
    }

    return NextResponse.json({
      ok: true,
      ipId,
      status: response.status,
      asset: asset,
      parentsCount: asset?.parentsCount,
      parentIpDetails: parentIpDetails,
      message: "Asset details with parent IP information",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to fetch asset details",
      },
      { status: 500 }
    );
  }
}
