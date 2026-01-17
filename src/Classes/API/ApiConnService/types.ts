import { Snowflake } from "discord.js";
import { Readable } from "node:stream";

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
export interface APIWarn {
  id: number;
  userWarnedDiscordId: Snowflake;
  moderatorDiscordId: Snowflake;
  reason: string;
  createdAtUtc: string;
  expiresAtUtc: string;
  updatedAtUtc: string;
}
export interface APIWarnPage {
  page: number;
  limit: number;
  count: number;
  data: APIWarn[];
}
