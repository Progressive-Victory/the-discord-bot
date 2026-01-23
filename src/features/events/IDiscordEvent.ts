import z from "zod";
import { zDiscordEventStatus } from "./DiscordEventStatus.js";
import { zDiscordEventAttendee } from "./IDiscordEventAttendee.js";

export const zDiscordEvent = z.object({
  id: z.number(),
  discordId: z.string(),
  channelId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: zDiscordEventStatus.nullable(),
  recurrent: z.boolean(),
  userCount: z.number().nullable(),
  thumbnailUrl: z.string(),
  createdAtUtc: z.coerce.date(),
  creatorDiscordId: z.string(),
  scheduledStartUtc: z.coerce.date(),
  startedAtUtc: z.coerce.date().nullable(),
  scheduledEndUtc: z.coerce.date().nullable(),
  endedAtUtc: z.coerce.date().nullable(),
  attendees: z.array(zDiscordEventAttendee).optional(),
});

export type IDiscordEvent = z.infer<typeof zDiscordEvent>;
