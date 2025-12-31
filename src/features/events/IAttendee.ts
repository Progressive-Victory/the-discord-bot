import z from "zod";

export const zAttendee = z.object({
  id: z.coerce.number(),
  userDiscordId: z.string().nonempty(),
  eventId: z.coerce.number(),
  dateAttendedUtc: z.coerce.date(),
  isJoin: z.coerce.boolean(),
});

export type IAttendee = z.infer<typeof zAttendee>;
