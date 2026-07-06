import { ChatInputCommandInteraction, codeBlock } from "discord.js";

import { replyEphemeral } from "@/util/delaysend/helpers.js";
import { scheduledMessages } from "../../util/delaysend/state.js";
export async function deleteScheduledMessage(
  command: ChatInputCommandInteraction,
) {
  const id: string = command.options.getString("id") ?? "";
  if (!id) return;

  const message = scheduledMessages.get(id);
  if (!message) {
    await replyEphemeral(command, "Message not found.");
    console.debug(scheduledMessages);
    return;
  }

  message.task.stop();
  await replyEphemeral(
    command,
    "Message " +
      codeBlock(message.payload.content ?? "(Unknown)") +
      " Unscheduled.",
  );
  scheduledMessages.delete(id);
}
