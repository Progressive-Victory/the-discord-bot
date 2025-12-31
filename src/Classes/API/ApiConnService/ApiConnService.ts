import {
  ApiConnServiceOptions,
  InternalRequest,
  RequestData,
  RequestMethod,
  ResponseLike,
  RouteLike,
} from "./types.js";
import { parseResponse } from "./utils.js";

export class ApiConnService {
  jwt: string | null = null;

  host: string;

  constructor(options: ApiConnServiceOptions) {
    this.host = options.host;
  }

  async auth(token: string) {
    console.log("Bot " + token);

    await fetch(`${this.host}/auth`, {
      //process.env.API_HOST_ADDR
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        discordToken: "Bot " + token,
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw Error("Can't fucking connect to API dawg");
        const { accessToken } = await res.json();
        this.jwt = accessToken;
      })
      .catch(console.error);
  }

  async request(options: InternalRequest, rtrnRaw?: boolean): Promise<unknown> {
    if (!this.jwt) throw Error("run auth function");
    // console.log(this.host, options.fullRoute, options.query?.toString());
    const url = new URL(this.host + options.fullRoute);
    options.query?.forEach((val: string, key: string) => {
      url.searchParams.append(key, val);
    });
    const res = await fetch(url, {
      method: options.method,
      body: options.body,
      headers: {
        ...options.headers,
        Authorization: "Bot " + this.jwt,
      },
    });
    if (res.status === 401 && options.attempt && options.attempt > 2) {
      this.jwt = null;
      options.attempt++;
      return this.request(options) as Promise<ResponseLike>;
    }

    return rtrnRaw ? res : parseResponse(res);
  }

  /**
   * Runs a get request from the api
   *
   * @param fullRoute - The full route to query
   * @param options - Optional request options
   */
  public async get(
    fullRoute: RouteLike,
    options: RequestData = {},
    rtrnRaw?: boolean,
  ) {
    return this.request(
      { ...options, fullRoute, method: RequestMethod.Get },
      rtrnRaw,
    );
  }

  /**
   * Runs a delete request from the api
   *
   * @param fullRoute - The full route to query
   * @param options - Optional request options
   */
  public async delete(
    fullRoute: RouteLike,
    options: RequestData = {},
    rtrnRaw?: boolean,
  ) {
    return this.request(
      {
        ...options,
        fullRoute,
        method: RequestMethod.Delete,
      },
      rtrnRaw,
    );
  }

  /**
   * Runs a post request from the api
   *
   * @param fullRoute - The full route to query
   * @param options - Optional request options
   */
  public async post(
    fullRoute: RouteLike,
    options: RequestData = {},
    rtrnRaw?: boolean,
  ) {
    return this.request(
      { ...options, fullRoute, method: RequestMethod.Post },
      rtrnRaw,
    );
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
  public async patch(
    fullRoute: RouteLike,
    options: RequestData = {},
    rtrnRaw?: boolean,
  ) {
    return this.request(
      { ...options, fullRoute, method: RequestMethod.Patch },
      rtrnRaw,
    );
  }
}
