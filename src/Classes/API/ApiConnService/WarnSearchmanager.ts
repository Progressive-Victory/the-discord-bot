import { DiscordSnowflake } from "@sapphire/snowflake";
import { Collection, GuildMember, Snowflake } from "discord.js";
import { Warn } from "../Warn.js";
import { ApiConnService } from "./ApiConnService.js";
import { Routes } from "./routes.js";
import { APIWarn, APIWarnPage } from "./types.js";

export enum WarnSortOption {
  Descending = "desc",
  Ascending = "asc",
}
export interface FetchWarnOptions {
  moderatorId?: Snowflake;
  targetId?: Snowflake;
  monthsAgo?: number;
  limit?: number;
  sort?: WarnSortOption;
  page?: number;
}

interface CreateWarnOptions {
  moderatorId: Snowflake;
  targetId: Snowflake;
  reason: string;
  expires: Date;
}

export class WarnSearch {
  private lastRead = new Date();
  readonly currentPageWarns = new Collection<string, APIWarn>();
  private count: number | null = null;
  constructor(
    readonly id: Snowflake,
    readonly member: GuildMember,
    readonly client: ApiConnService,
    private options: FetchWarnOptions,
  ) {}

  get guild() {
    return this.member.guild;
  }
  get page() {
    return this.options.page;
  }

  get limit() {
    return this.options.limit;
  }

  toQuery() {
    const query = new URLSearchParams();
    if (this.options.moderatorId)
      query.set("mod_discord_id", this.options.moderatorId);
    if (this.options.targetId)
      query.set("tgt_discord_id", this.options.targetId);
    if (this.options.monthsAgo) {
      const timeWindowDate = new Date(
        Date.now() - Math.abs(this.options.monthsAgo) * 2_592_000_000,
      );
      query.set("time_window", timeWindowDate.toISOString());
    }
    query.set("sort", this.options.sort ?? WarnSortOption.Descending);
    query.set("limit", this.options.limit?.toString() ?? String(3));
    query.set("page", this.options.page?.toString() ?? "0");
    return query;
  }

  async fetchPage() {
    // console.log(this.toQuery());
    const page = (await this.client.get(Routes.discordWarns, {
      query: this.toQuery(),
    })) as APIWarnPage;

    this.currentPageWarns.clear();
    // console.log(this.toQuery(), page);
    page.data.forEach((warn) =>
      this.currentPageWarns.set(warn.id.toString(), warn),
    );

    this.options.page ??= page.page;
    this.lastRead = new Date();
    this.count = page.count;
    this.options.limit = page.limit;
    return page;
  }
  async fetchNextPage() {
    this.options.page!++;
    return this.fetchPage();
  }

  async fetchLastPage() {
    this.options.page!--;
    return this.fetchPage();
  }

  get lastQuery() {
    return this.lastRead;
  }

  get totalWarns() {
    return this.count;
  }
}
export class WarnSearchManager {
  public cache = new Collection<Snowflake, WarnSearch>();

  constructor(readonly client: ApiConnService) {}

  newSearch(member: GuildMember, options: FetchWarnOptions) {
    const id = DiscordSnowflake.generate().toString();
    const warn = new WarnSearch(id, member, this.client, options);
    this.cache.set(id, warn);
    this.sweep();
    return warn;
  }

  private async sweep() {
    this.cache.forEach((search) => {
      const now = new Date();
      now.setMinutes(now.getMinutes() - 30);
      if (search.lastQuery <= now) {
        this.cache.delete(search.id);
      }
    });
  }

  async createWarn(options: CreateWarnOptions) {
    const res = (await this.client.post(Routes.discordWarns, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mod_discord_id: options.moderatorId,
        tgt_discord_id: options.targetId,
        reason: options.reason,
        expires_at_utc: options.expires.toISOString(),
      }),
    })) as { id: number };

    // console.log(res);

    const now = new Date().toISOString();
    return new Warn(this.client, {
      id: res.id,
      moderatorDiscordId: options.moderatorId,
      userWarnedDiscordId: options.targetId,
      reason: options.reason,
      expiresAtUtc: options.expires.toISOString(),
      createdAtUtc: now,
      updatedAtUtc: now,
    });
  }
}
