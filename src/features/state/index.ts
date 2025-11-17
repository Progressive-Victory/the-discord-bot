import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
} from "discord.js";
import { isGuildMember } from "../../util/index.js";
import { getStatesFromMember } from "../../util/states/index.js";
import { memberList } from "./member-list.js";
import ping from "./ping.js";

/**
 * Executes the lead command based on the subcommand and subcommand group provided in the interaction options.
 * @param interaction - The chat input command interaction object.
 * @returns Interaction from subcommand
 */
export async function lead(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand(true);
  // const subcommandGroup = interaction.options.getSubcommandGroup();

  switch (subcommand) {
    case "ping":
      return ping(interaction);
    case "members":
      return memberList(interaction);
    default:
      throw Error("No Subcommand");
  }

  // Throw an error if the subcommand or subcommand group is not recognized.
}

/**
 * Responds to autocomplete requests by providing suggestions based on the interaction options.
 * @param interaction - The autocomplete interaction object.
 * @returns The interaction response.
 */
export function autoComplete(
  interaction: AutocompleteInteraction,
): Promise<void> {
  const { member, options, guild } = interaction;
  const focusedOption = options.getFocused(true);
  if (
    isGuildMember(member) &&
    focusedOption.name === "state" &&
    guild != null
  ) {
    const choices = getStatesFromMember(member);
    if (!choices) {
      return interaction.respond([]);
    }
    // Filter the choices based on the focused option.
    const filtered = choices
      .filter((choice) =>
        choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()),
      )
      .map((choice) => ({
        name: choice.name,
        value:
          guild.roles.cache.findKey(
            (r) => r.name.toLowerCase() === choice.abbreviation,
          ) ?? "",
      }))
      .slice(0, 14);

    // Respond with the filtered choices as an interaction response.
    return interaction.respond(filtered);
  }

  return interaction.respond([]);
}

// Export the lead and autoComplete functions as properties of the exported object.
export default {
  lead,
  autoComplete,
};
