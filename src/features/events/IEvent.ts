import z from "zod";
import { zAttendee } from "./IAttendee.js";

export const zEvent = z.object({
  id: z.coerce.number(),
  discordId: z.string().nonempty(),
  channelId: z.string().nonempty(),
  name: z.string().nonempty(),
  description: z.string().optional(),
  status: z.coerce.number(),
  recurrent: z.coerce.boolean(),
  userCount: z.coerce.number().optional(),
  thumbnailUrl: z.string().nonempty(),
  createdAtUtc: z.coerce.date(),
  creatorDiscordId: z.string().nonempty(),
  scheduledStartUtc: z.coerce.date(),
  startedAtUtc: z.coerce.date().optional(),
  scheduledEndUtc: z.coerce.date().optional(),
  endedAtUtc: z.coerce.date().optional(),
  attendees: z.array(zAttendee).optional(),
});

export type IEvent = z.infer<typeof zEvent>;
