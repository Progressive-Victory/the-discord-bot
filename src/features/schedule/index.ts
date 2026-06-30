import { ChatInputCommandInteraction } from "discord.js";
import { createCronMessage } from "./create-cron-message";
import { createScheduledMessage } from "./create-message";
import { deleteScheduledMessage } from "./delete-message";
import { listScheduledMessages } from "./list-scheduled";
/**
 * Executes the lead command based on the subcommand and subcommand group provided in the interaction options.
 * @param trigger - The chat input command interaction object.
 * @returns Interaction from subcommand
 */
export async function lead(trigger: ChatInputCommandInteraction) {
  const subcommand = trigger.options.getSubcommand(true);
  switch (subcommand) {
    case "create":
      return createScheduledMessage(trigger);
    case "list":
      return listScheduledMessages(trigger);
    case "delete":
      return deleteScheduledMessage(trigger);
    case "create-cron":
      return createCronMessage(
        trigger,
        trigger.options.getInteger("runs") ?? undefined,
      );
    // TODO: Undo/reschedule command to fix a previously sent message that the bot misinterpreted (ideally doesn't lose the payload)

    default:
      throw new Error("No Subcommand");
  }
}

export default { lead };
