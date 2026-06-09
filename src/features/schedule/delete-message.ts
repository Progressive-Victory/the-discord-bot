//Is nor actually working.
import { ChatInputCommandInteraction } from "discord.js";
import cron from "node-cron";
import { scheduledMessages } from "./create-message.js";
export async function deleteScheduledMessage(
  interaction: ChatInputCommandInteraction,
) {
  const id: string = interaction.options.getString("id") ?? "";
  if (!id) return;

  const message = scheduledMessages.get(id);
  if (!message) {
    await interaction.reply({ content: "Message not found." });
    return;
  }

  cron.getTask(id)?.destroy();
  console.log(cron.getTasks().entries);
  scheduledMessages.delete(id);
  await interaction.reply({ content: "Message Unscheduled." });
  return;
}
