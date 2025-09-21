import {
  ApplicationCommandOptionType,
  InteractionContextType,
  PermissionFlagsBits,
} from "discord.js";
import { ChatInputCommand } from "../../Classes/index.js";
import {
  messageMaxLength,
  titleMaxLength,
} from "../../features/state/constants.js";
import { lead } from "../../features/state/index.js";
import { localize } from "../../i18n.js";
import { states } from "../../util/states/types.js";

export const ns = "state";

/**
 * The `state` command allows state leads to perform various actions:
 * <ul>
 *     <li>Ping a state role</li>
 *     <li>Export users with a state role to a CSV</li>
 * </ul>
 */
export default new ChatInputCommand()
  .setBuilder((builder) =>
    builder
      .setName("state")
      .setDescription("Commands for state leads to help manage their state")
      .setNameLocalizations(
        localize.discordLocalizationRecord("state-name", ns),
      )
      .setDescriptionLocalizations(
        localize.discordLocalizationRecord("state-description", ns),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.MentionEveryone)
      .setContexts(InteractionContextType.Guild)
      .addSubcommand((subcommand) =>
        subcommand
          .setName("ping")
          .setDescription("Ping State Role")
          .setNameLocalizations(
            localize.discordLocalizationRecord("ping-name", ns),
          )
          .setDescriptionLocalizations(
            localize.discordLocalizationRecord("ping-description", ns),
          )
          .addStringOption((option) =>
            option
              .setName("state")
              .setDescription("abbreviation of the state to ping")
              .setRequired(true)
              .setAutocomplete(true),
          )
          .addBooleanOption((legacy) =>
            legacy
              .setName("usecomponents")
              .setDescription("send message using components V2")
              .setRequired(false),
          )
          .addStringOption((title) =>
            title
              .setName("title")
              .setDescription("Title of announcement")
              .setMaxLength(titleMaxLength)
              .setRequired(false),
          )
          .addStringOption((message) =>
            message
              .setName("message")
              .setDescription("Text to send in message")
              .setMaxLength(messageMaxLength)
              .setRequired(false),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("members")
          .setDescription(
            "Exports a list of the users with a role to a csv file",
          )
          .setNameLocalizations(
            localize.discordLocalizationRecord("member-list-name", ns),
          )
          .setDescriptionLocalizations(
            localize.discordLocalizationRecord("member-list-description", ns),
          )
          .addRoleOption((option) =>
            option
              .setName("role")
              .setDescription("The role from which to get list")
              .setNameLocalizations(
                localize.discordLocalizationRecord(
                  "member-list-role-option-name",
                  ns,
                ),
              )
              .setDescriptionLocalizations(
                localize.discordLocalizationRecord(
                  "member-list-role-option-description",
                  ns,
                ),
              )
              .setRequired(true),
          ),
      ),
  )
  .setAutocomplete((interaction) => {
    const focus = interaction.options.getFocused(true);
    if (
      focus.type !== ApplicationCommandOptionType.String &&
      focus.name !== "state"
    ) {
      interaction.respond([]);
      return;
    }

    const choices = states
      .filter(
        (s) =>
          s.name
            .toLowerCase()
            .startsWith(focus.value.replace("\n", "").toLowerCase()) ||
          s.abbreviation.startsWith(focus.value.toLowerCase()),
      )
      .slice(0, 14)
      .map((state) => ({
        name: state.name,
        value: state.abbreviation,
      }));

    interaction.respond(choices).catch(console.error);
  })
  .setExecute(lead);
