class ApiConnService {
  jwt: string | null = null;

  auth = async (): Promise<void> => {
    try {
      console.log("Bot " + process.env.DISCORD_TOKEN);
      const res = await fetch(`${process.env.API_HOST_ADDR}/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          discordToken: "Bot " + process.env.DISCORD_TOKEN,
        }),
      });

      if (res.status === 200) {
        const { accessToken } = await res.json();
        this.jwt = accessToken;
      } else {
        throw Error("Can't fucking connect to API dawg");
      }
    } catch (error) {
      console.error(error);
    }
  };

  sendRequest = async (
    url: string | URL,
    method: string,
    headers?: HeadersInit,
    body?: BodyInit,
    attempt: number = 0,
  ): Promise<Response> => {
    if (!this.jwt) await this.auth();

    const res = await fetch(url, {
      method,
      body: body ?? undefined,
      headers: {
        ...headers,
        Authorization: this.jwt ? "Bot " + this.jwt : "",
      },
    });

    if (res.status === 401 && attempt < 2) {
      this.jwt = null;
      return this.sendRequest(url, method, headers, body, attempt + 1);
    } else {
      return res;
    }
  };
}

export const apiConnService = new ApiConnService();
