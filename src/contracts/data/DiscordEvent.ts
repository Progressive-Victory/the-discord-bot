import z from "zod";
import { zDiscordEventAttendee } from "./DiscordEventAttendee";
import { zDiscordEventStatus } from "./DiscordEventStatus";

export const zDiscordEvent = z.object({
  id: z.number(),
  discordId: z.string().nonempty(),
  channelId: z.string().nonempty(),
  name: z.string().nonempty(),
  description: z.string().nullable(),
  status: zDiscordEventStatus.nullable(),
  recurrent: z.boolean(),
  userCount: z.number().nullable(),
  thumbnailUrl: z.string().nonempty().nullable(),
  createdAtUtc: z.coerce.date(),
  creatorDiscordId: z.string().nonempty(),
  scheduledStartUtc: z.coerce.date(),
  startedAtUtc: z.coerce.date().nullable(),
  scheduledEndUtc: z.coerce.date().nullable(),
  endedAtUtc: z.coerce.date().nullable(),
  attendees: z.array(zDiscordEventAttendee).optional(),
});

export type DiscordEvent = z.infer<typeof zDiscordEvent>;
