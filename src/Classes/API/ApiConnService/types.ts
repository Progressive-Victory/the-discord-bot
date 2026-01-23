import { Readable } from "node:stream";
import z from "zod";

export interface ApiConnServiceOptions {
  host: string;
}

export interface RequestData {
  body?: BodyInit | undefined;
  /**
   * Additional headers to add to this request
   */
  headers?: Record<string, string>;
  /**
   * Query string parameters to append to the called endpoint
   */
  query?: URLSearchParams;
  /**
   * The signal to abort the queue entry or the REST call, where applicable
   */
  signal?: AbortSignal | undefined;

  attempt?: number;
}

export type RouteLike = `/${string}`;

/**
 * Possible API methods to be used when doing requests
 */
export enum RequestMethod {
  Delete = "DELETE",
  Get = "GET",
  Patch = "PATCH",
  Post = "POST",
  Put = "PUT",
}

/**
 * Internal request options
 */
export interface InternalRequest extends RequestData {
  fullRoute: RouteLike;
  method: RequestMethod;
}

export interface ResponseLike extends Pick<
  Response,
  | "arrayBuffer"
  | "bodyUsed"
  | "headers"
  | "json"
  | "ok"
  | "status"
  | "statusText"
  | "text"
> {
  body: Readable | ReadableStream | null;
}

export const zAPIWarn = z.object({
  id: z.number(),
  userWarnedDiscordId: z.string(),
  moderatorDiscordId: z.string(),
  reason: z.string(),
  createdAtUtc: z.string(),
  expiresAtUtc: z.string(),
  updatedAtUtc: z.string(),
});

export type APIWarn = z.infer<typeof zAPIWarn>;

export const zAPIWarnPage = z.object({
  page: z.number(),
  limit: z.number(),
  count: z.number(),
  data: z.array(zAPIWarn),
});

export type APIWarnPage = z.infer<typeof zAPIWarnPage>;
