import { ZodType } from "zod";
import {
  InternalRequest,
  RequestData,
  RequestMethod,
  RouteLike,
} from "./types";
import { parseResponse } from "./utils";

export class ApiConnService {
  jwt: string | null = null;
  host: string | null = null;

  init(host: string) {
    this.host ??= host;
  }

  async auth(token: string) {
    const res = await fetch(`${this.host}/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        discordToken: "Bot " + token,
      }),
    });
    if (!res.ok) console.error(Error("Can't fucking connect to API dawg"));
    const { accessToken } = await res.json();
    this.jwt = accessToken;
  }

  async request<R = void>(
    options: InternalRequest,
    schema?: ZodType,
  ): Promise<R | void> {
    const doFetch = async (options: InternalRequest) => {
      if (!this.jwt) await this.auth(process.env.PV_DISCORD_TOKEN!);
      // console.log(this.host, options.fullRoute, options.query?.toString());
      const url = new URL(this.host + options.fullRoute);
      options.query?.forEach((val: string, key: string) => {
        url.searchParams.append(key, val);
      });
      return await fetch(url, {
        method: options.method,
        body: options.body,
        headers: {
          ...options.headers,
          Authorization: "Bot " + this.jwt,
        },
      });
    };

    let res = await doFetch(options);

    console.log("Res1:", res);

    if (res.status === 401) {
      this.jwt = null;
      res = await doFetch(options);
    }

    console.log("Res2:", res);

    if (!res.ok) {
      console.error(
        Error(
          `API threw exception: ${res.status} ${res.statusText}${res.body ? "\n" + (await res.text()) : ""}`,
        ),
      );
      return;
    }

    return parseResponse<R>(res, schema);
  }

  /**
   * Runs a get request from the api
   *
   * @param fullRoute - The full route to query
   * @param options - Optional request options
   */
  public async get<R>(
    fullRoute: RouteLike,
    schema: ZodType,
    options: RequestData = {},
  ): Promise<R> {
    return (await this.request<R>(
      {
        ...options,
        fullRoute,
        method: RequestMethod.Get,
      },
      schema,
    )) as R;
  }

  /**
   * Runs a delete request from the api
   *
   * @param fullRoute - The full route to query
   * @param options - Optional request options
   */
  public async delete(fullRoute: RouteLike, options: RequestData = {}) {
    return this.request({
      ...options,
      fullRoute,
      method: RequestMethod.Delete,
    });
  }

  /**
   * Runs a post request from the api
   *
   * @param fullRoute - The full route to query
   * @param options - Optional request options
   */
  public async post<R = void>(
    fullRoute: RouteLike,
    options: RequestData = {},
    schema?: ZodType,
  ) {
    return (await this.request<R>(
      { ...options, fullRoute, method: RequestMethod.Post },
      schema,
    )) as R;
  }

  /**
   * Runs a put request from the api
   *
   * @param fullRoute - The full route to query
   * @param options - Optional request options
   */
  public async put(fullRoute: RouteLike, options: RequestData = {}) {
    return this.request({ ...options, fullRoute, method: RequestMethod.Put });
  }

  /**
   * Runs a patch request from the api
   *
   * @param fullRoute - The full route to query
   * @param options - Optional request options
   */
  public async patch(fullRoute: RouteLike, options: RequestData = {}) {
    return this.request({ ...options, fullRoute, method: RequestMethod.Patch });
  }
}
