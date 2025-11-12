export const PINATA_GATEWAY = process.env.PINATA_GATEWAY;

export async function fetchParentIpDetails(
  childIpId: string,
  apiKey: string
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
      }
    );

    if (!response.ok) {
      console.warn(
        `Failed to fetch parent details for ${childIpId}: ${response.status}`
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

export function convertIpfsUriToHttp(uri: string): string {
  if (!uri) return uri;

  const PUBLIC_GATEWAY = "dweb.link";

  if (uri.startsWith("ipfs://")) {
    const cid = uri.replace("ipfs://", "");
    return `https://${PUBLIC_GATEWAY}/ipfs/${cid}`;
  }

  if (uri.includes("ipfs.io/ipfs/")) {
    const cid = uri.split("/ipfs/")[1];
    return `https://${PUBLIC_GATEWAY}/ipfs/${cid}`;
  }

  if (uri.includes("mypinata.cloud")) {
    return uri;
  }

  if (uri.includes("/ipfs/") && !uri.includes(PUBLIC_GATEWAY)) {
    const cid = uri.split("/ipfs/")[1];
    return `https://${PUBLIC_GATEWAY}/ipfs/${cid}`;
  }

  return uri;
}

export async function fetchIpaMetadata(ipaMetadataUri: string): Promise<any> {
  if (!ipaMetadataUri) return null;

  try {
    let url = ipaMetadataUri;

    if (url.startsWith("ipfs://")) {
      const cid = url.replace("ipfs://", "");
      url = PINATA_GATEWAY
        ? `https://${PINATA_GATEWAY}/ipfs/${cid}`
        : `https://ipfs.io/ipfs/${cid}`;
    }

    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      console.warn(
        `Failed to fetch IPA metadata from ${url}: ${response.status}`
      );
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn(`Error fetching IPA metadata from ${ipaMetadataUri}:`, error);
    return null;
  }
}
