import { Interaction } from "@/Classes/Interaction";
import { sendTeamPing } from "@/features/team/ping";
import { ModalSubmitInteraction } from "discord.js";

/**
 * `teamPing` is a modal interaction that allows team leads to confirm and submit a ping.
 */
export const teamPing = new Interaction<ModalSubmitInteraction>({
  customIdPrefix: "tp",
  run: async (interaction) => {
    const { customId, client, fields } = interaction;
    const splitOn = client.splitCustomIdOn;
    if (!splitOn) return;

    const args = customId.split(splitOn);
    const teamRoleId = args[1];
    const legacyOption = args[2] === "true";

    if (!teamRoleId) return;

    const title = fields.getTextInputValue("title");
    const message = fields.getTextInputValue("message");

    await sendTeamPing(interaction, teamRoleId, title, message, legacyOption);
  },
});
