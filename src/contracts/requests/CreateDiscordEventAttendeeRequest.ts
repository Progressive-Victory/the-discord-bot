import z from "zod";

export const zCreateDiscordEventAttendeeRequest = z.object({
  userDiscordId: z.string().nonempty(),
  dateAttendedUtc: z.coerce.date(),
  isJoin: z.boolean(),
});

export type CreateDiscordEventAttendeeRequest = z.infer<
  typeof zCreateDiscordEventAttendeeRequest
>;
