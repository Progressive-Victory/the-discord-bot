import z from "zod";

export const zSettingsResponse = z.object({
  data: z.string().nonempty(),
});

export type SettingsResponse = z.infer<typeof zSettingsResponse>;
