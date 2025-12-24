import { ResponseLike } from "./types.js";

/**
 * Converts the response to usable data
 *
 * @param res - The fetch response
 */
export async function parseResponse(res: ResponseLike): Promise<unknown> {
  if (res.headers.get("Content-Type")?.startsWith("application/json")) {
    return res.json();
  }

  return res.arrayBuffer();
}
