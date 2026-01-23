import z from "zod";

export const zDiscordEventAttendee = z.object({
  id: z.number(),
  userDiscordId: z.string().nonempty(),
  eventId: z.number(),
  dateAttendedUtc: z.coerce.date(),
  isJoin: z.boolean(),
});

export type IDiscordEventAttendee = z.infer<typeof zDiscordEventAttendee>;
