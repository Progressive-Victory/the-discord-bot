import z, { ZodType } from "zod";

/**
 * Converts the response to usable data
 *
 * @param res - The fetch response
 */
export async function parseResponse<R = void>(res: Response, schema?: ZodType) {
  if (!res.body) return;
  const data = (await res.json()) as unknown;

  if (!schema) return data as R;
  return z.parse(schema, data) as R;
}
