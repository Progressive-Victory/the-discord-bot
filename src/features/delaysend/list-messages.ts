import {
  bold,
  ChatInputCommandInteraction,
  codeBlock,
  MessageFlags,
  unorderedList,
} from "discord.js";
import { scheduledMessages } from "../../util/delaysend/state.js";
export async function listScheduledMessages(
  command: ChatInputCommandInteraction,
) {
  if (scheduledMessages.size === 0) {
    await command.reply({
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
          `${bold(msg.id)} (${msg.pattern})\n${codeBlock(msg.payload.components?.join(", ") ?? "Unknown")}`,
      ),
  );
  console.debug(messageList);
  await command.reply({
    content: [
      "Currently Scheduled Messages:",
      messageList,
      // TODO: Here's where a (better) message preview would go
    ].join("\n"),
    flags: MessageFlags.Ephemeral,
  });
}
