import { Interaction } from "@/Classes";
import { banUserModal } from "@/features/moderation/ban";
import { ModalSubmitInteraction } from "discord.js";

export const banUser = new Interaction<ModalSubmitInteraction>({
  customIdPrefix: "ban",
  run: async (interaction: ModalSubmitInteraction) => {
    if (!interaction.inCachedGuild()) return;
    await banUserModal(interaction);
  },
});
