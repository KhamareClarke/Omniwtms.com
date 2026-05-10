export const GHL_API_VERSION = "2021-07-28";

export function ghlBaseUrl(): string {
  return (process.env.GHL_API_BASE_URL?.trim() || "https://services.leadconnectorhq.com").replace(/\/$/, "");
}

export async function ghlRequest(
  apiKey: string,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${ghlBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: GHL_API_VERSION,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string>),
    },
  });
}
