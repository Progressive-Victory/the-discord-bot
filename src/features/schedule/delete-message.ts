import { ChatInputCommandInteraction } from "discord.js";

import { replyEphemeral } from "@/util/schedule/helpers.js";
import { scheduledMessages } from "../../util/schedule/state.js";
export async function deleteScheduledMessage(
  trigger: ChatInputCommandInteraction,
) {
  const id: string = trigger.options.getString("id") ?? "";
  if (!id) return;

  const message = scheduledMessages.get(id);
  if (!message) {
    await replyEphemeral(trigger, "Message not found.");
    console.debug(scheduledMessages);
    return;
  }

  message.task.stop();
  await replyEphemeral(
    trigger,
    "Message ```" + message.payload.content + "``` Unscheduled.",
  );
  scheduledMessages.delete(id);
}
