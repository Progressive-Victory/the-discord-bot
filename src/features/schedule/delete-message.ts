//Is nor actually working.
import { ChatInputCommandInteraction } from "discord.js";

import { replyEphemeral } from "@/util/schedule/helpers.js";
import { scheduledMessages } from "../../util/schedule/state.js";
export async function deleteScheduledMessage(
  interaction: ChatInputCommandInteraction,
) {
  const id: string = interaction.options.getString("id") ?? "";
  if (!id) return;

  const message = scheduledMessages.get(id);
  if (!message) {
    await replyEphemeral(interaction, "Message not found.");
    console.debug(scheduledMessages);
    return;
  }

  message.task.stop();
  await replyEphemeral(
    interaction,
    "Message ```" + message.payload.content + "``` Unscheduled.",
  );
  scheduledMessages.delete(id);
}
