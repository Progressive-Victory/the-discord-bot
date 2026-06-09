import { ChatInputCommand } from "@/Classes";
import { lead } from "@/features/schedule";
import {
  messageMaxLength,
  titleMaxLength,
} from "@/features/schedule/constants";
import { localize } from "@/i18n";
import {
  ApplicationCommandOptionType,
  InteractionContextType,
  PermissionFlagsBits,
} from "discord.js";

const ns = "schedule";

export default new ChatInputCommand()
  .setBuilder((builder) =>
    builder
      .setName("schedule")
      .setDescription("Commands for scheduling messages")
      .setNameLocalizations(
        localize.discordLocalizationRecord("schedule-name", ns),
      )
      .setDescriptionLocalizations(
        localize.discordLocalizationRecord("schedule-description", ns),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.MentionEveryone)
      .setContexts(InteractionContextType.Guild)
      .addSubcommand((subcommand) =>
        subcommand
          .setName("create")
          .setDescription("Create a new scheduled message")
          .setNameLocalizations(
            localize.discordLocalizationRecord("schedule-create-name", ns),
          )
          .setDescriptionLocalizations(
            localize.discordLocalizationRecord(
              "schedule-create-description",
              ns,
            ),
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
          )
          .addStringOption((cronExpression) =>
            cronExpression
              .setName("cron")
              .setDescription("Cron expression for scheduling") // This is *not* permanent. but Conversion logic hasn't been done yet
              .setRequired(false),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("list")
          .setDescription("List all scheduled messages") // I'd want it to list scheduled *in that channel*, but we'll see
          .setNameLocalizations(
            localize.discordLocalizationRecord("schedule-list-name", ns),
          )
          .setDescriptionLocalizations(
            localize.discordLocalizationRecord("schedule-list-description", ns),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("delete")
          .setDescription("Delete a scheduled message")
          .setNameLocalizations(
            localize.discordLocalizationRecord("schedule-delete-name", ns),
          )
          .setDescriptionLocalizations(
            localize.discordLocalizationRecord(
              "schedule-delete-description",
              ns,
            ),
          )
          .addStringOption((id) =>
            id
              .setName("id")
              .setDescription("ID of the message to delete")
              .setRequired(true),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("recurring")
          .setDescription("Create a new scheduled message that repeats") // This wasn't requested, but we're (mis)using cron for the normal scheduling. Let us at least allow it to serve it's usual purpose
          .setNameLocalizations(
            localize.discordLocalizationRecord("schedule-recurring-name", ns),
          )
          .setDescriptionLocalizations(
            localize.discordLocalizationRecord(
              "schedule-recurring-description",
              ns,
            ),
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
          )
          .addStringOption((cronExpression) =>
            cronExpression
              .setName("cron")
              .setDescription("Cron expression for scheduling") // This is *not* permanent. but Conversion logic hasn't been done yet
              .setRequired(false),
          ),
      ),
  )
  .setAutocomplete(async (interaction) => {
    const focus = interaction.options.getFocused(true);
    if (
      focus.type !== ApplicationCommandOptionType.String &&
      focus.name !== "state"
    ) {
      await interaction.respond([]);
      return;
    }
  })
  .setExecute(lead);
