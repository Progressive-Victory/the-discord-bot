//stub file
import { ChatInputCommandInteraction } from "discord.js";
import { scheduledMessages } from "./create-message.js";
export async function listScheduledMessages(
  interaction: ChatInputCommandInteraction,
) {
  await interaction.reply({
    content: [
      "Currently Scheduled Messages:",
      ...scheduledMessages
        .values()
        .map((msg) => `- \`${msg.id}\` (${msg.cronExpression})`),
        // Here's where a message preview would go
    ].join("\n\n"),
  });
  return;
}
