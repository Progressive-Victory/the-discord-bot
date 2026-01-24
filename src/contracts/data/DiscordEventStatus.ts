import z from "zod";

export enum DiscordEventStatus {
  Scheduled = 1,
  Active = 2,
  Completed = 3,
  Cancelled = 4,
}

export const zDiscordEventStatus = z.enum(DiscordEventStatus);
