import z from "zod";

export const zDiscordStateRole = z.object({
  stateAbbreviation: z.string().nonempty(),
  stateName: z.string().nonempty(),
  memberRoleId: z.string().nonempty(),
  memberChannelId: z.string().nonempty(),
  teamRoleId: z.string().nonempty(),
  teamChannelId: z.string().nonempty(),
});

export type IDiscordStateRole = z.infer<typeof zDiscordStateRole>;
