import z from "zod";
import { zDiscordEventStatus } from "../data";

export const zCreateDiscordEventRequest = z.object({
  discordId: z.string().nonempty(),
  channelId: z.string().nonempty(),
  name: z.string().nonempty(),
  description: z.string().nullable(),
  status: zDiscordEventStatus.nullable(),
  recurrent: z.boolean(),
  userCount: z.number().nullable(),
  thumbnailUrl: z.string().nonempty(),
  createdAtUtc: z.coerce.date(),
  creatorDiscordId: z.string().nonempty(),
  scheduledStartUtc: z.coerce.date(),
  startedAtUtc: z.coerce.date().nullable(),
  scheduledEndUtc: z.coerce.date().nullable(),
  endedAtUtc: z.coerce.date().nullable(),
});

export type CreateDiscordEventRequest = z.infer<
  typeof zCreateDiscordEventRequest
>;
