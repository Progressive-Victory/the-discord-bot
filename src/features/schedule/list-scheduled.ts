//stub file
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { scheduledMessages } from "../../util/schedule/state.js";
export async function listScheduledMessages(
  interaction: ChatInputCommandInteraction,
) {
  if (scheduledMessages.size === 0) {
    await interaction.reply({
      content: "There are no scheduled messages.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  await interaction.reply({
    content: [
      "Currently Scheduled Messages:",
      ...scheduledMessages
        .values()
        .map(
          (msg) =>
            `- \`${msg.id}\` (${msg.pattern}) \`\`\`${msg.payload.content}\`\`\``,
        ),
      // TODO: Here's where a message preview would go
    ].join("\n\n"),
    flags: MessageFlags.Ephemeral,
  });
}
