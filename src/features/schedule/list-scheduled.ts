import {
  ChatInputCommandInteraction,
  codeBlock,
  bold,
  MessageFlags,
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
  await trigger.reply({
    content: [
      "Currently Scheduled Messages:",
      ...scheduledMessages
        .values()
        .map(
          (msg) =>
            `${bold(msg.id)} (${msg.pattern}) ${codeBlock(msg.payload.content ?? "Unknown")}`,
        ),
      // TODO: Here's where a (better) message preview would go
    ].join("\n\n"),
    flags: MessageFlags.Ephemeral,
  });
}
