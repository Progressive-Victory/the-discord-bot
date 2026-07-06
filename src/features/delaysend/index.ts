import { ChatInputCommandInteraction } from "discord.js";
import { createCronMessage } from "./create-cron-message";
import { createDelayedMessage } from "./create-message";
import { deleteScheduledMessage } from "./delete-message";
import { listScheduledMessages } from "./list-messages";
/**
 * Executes the lead command based on the subcommand and subcommand group provided in the interaction options.
 * @param command - The chat input command interaction object.
 * @returns Interaction from subcommand
 */
export async function lead(command: ChatInputCommandInteraction) {
  const subcommand = command.options.getSubcommand(true);
  switch (subcommand) {
    case "create":
      return createDelayedMessage(command);
    case "list":
      return listScheduledMessages(command);
    case "delete":
      return deleteScheduledMessage(command);
    case "create-cron":
      return createCronMessage(
        command,
        command.options.getInteger("runs") ?? undefined,
      );
    // TODO: Undo/reschedule command to fix a previously sent message that the bot misinterpreted (ideally doesn't lose the payload)

    default:
      throw new Error("No Subcommand");
  }
}

export default { lead };
