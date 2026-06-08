import { ChatInputCommandInteraction } from "discord.js";
import { createScheduledMessage } from "./create-message";
import { listScheduledMessages } from "./list-scheduled";
import { deleteScheduledMessage } from "./delete-message";
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
    default:
      throw Error("No Subcommand");
  }
}

/**
 * Responds to autocomplete requests by providing suggestions based on the interaction options.
 * @param interaction - The autocomplete interaction object.
 * @returns The interaction response.
 */
export async function autoComplete(): Promise<void> {
  //  interaction: AutocompleteInteraction,
  /* stolen from state file. to be used to help with date */
}

// Export the lead and autoComplete functions as properties of the exported object.
export default {
  lead,
  autoComplete,
};
