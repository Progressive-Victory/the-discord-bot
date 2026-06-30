import {
  bold,
  ChatInputCommandInteraction,
  codeBlock,
  MessageFlags,
  unorderedList,
} from "discord.js";
import { scheduledMessages } from "../../util/schedule/state.js";
export async function listScheduledMessages(
  trigger: ChatInputCommandInteraction,
) {
  if (scheduledMessages.size === 0) {
    await trigger.reply({
      content: "There are no scheduled messages.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const messageList = unorderedList(
    scheduledMessages
      .values()
      .toArray()
      .map(
        (msg) =>
          `${bold(msg.id)} (${msg.pattern})\n${codeBlock(msg.payload.content ?? "Unknown")}`,
      ),
  );
  console.debug(messageList);
  await trigger.reply({
    content: [
      "Currently Scheduled Messages:",
      messageList,
      // TODO: Here's where a (better) message preview would go
    ].join("\n"),
    flags: MessageFlags.Ephemeral,
  });
}
