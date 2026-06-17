import { ChatInputCommandInteraction } from "discord.js";
import { createCronMessage } from "./create-cron-message";
import { createScheduledMessage } from "./create-message";
import { deleteScheduledMessage } from "./delete-message";
import { listScheduledMessages } from "./list-scheduled";
/**
 * Executes the lead command based on the subcommand and subcommand group provided in the interaction options.
 * @param interaction - The chat input command interaction object.
 * @returns Interaction from subcommand
 */
export async function lead(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand(true);
  switch (subcommand) {
    case "create":
      return createScheduledMessage(interaction);
    case "list":
      return listScheduledMessages(interaction);
    case "delete":
      return deleteScheduledMessage(interaction);
    case "create-cron":
      return createCronMessage(
        interaction,
        interaction.options.getInteger("runs") ?? undefined,
      );
    // TODO: Undo/reschedule command to fix a previously sent message that the bot misinterpreted (ideally doesn't lose the payload)

    default:
      throw new Error("No Subcommand");
  }
}

// Export the lead and autoComplete functions as properties of the exported object.
export default {
  lead,
};
