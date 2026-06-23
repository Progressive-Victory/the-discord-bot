import { ChatInputCommand } from "@/Classes";
import { lead } from "@/features/schedule";
import { messageMaxLength, titleMaxLength } from "@/util/schedule/constants";
import {
  InteractionContextType,
  PermissionFlagsBits,
} from "discord.js";

export default new ChatInputCommand()
  .setBuilder((builder) =>
    builder
      .setName("schedule")
      .setDescription("Commands for scheduling messages")
      .setDefaultMemberPermissions(PermissionFlagsBits.MentionEveryone)
      .setContexts(InteractionContextType.Guild)
      .addSubcommand((subcommand) =>
        subcommand
          .setName("create")
          .setDescription("Create a new scheduled message")
          .addStringOption((when) =>
            when
              .setName("when")
              .setDescription(
                "When the message should be sent. Allows natural input (ex: Friday at 4, Today at 13:00UTC)",
              )
              .setMaxLength(messageMaxLength)
              .setRequired(true),
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
          .setName("create-cron") //I've changed my mind i don't see a reason to get rid of this
          .setDescription(
            "Create a new scheduled message using an OCPS cron expression. Fragile",
          )
          .addStringOption((cronExpression) =>
            cronExpression
              .setName("cron")
              .setDescription(
                "Cron expression for scheduling. 5-7 field format <https://croner.56k.guru/usage/pattern/>",
              )
              .setRequired(true),
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
          .addIntegerOption((runs) =>
            runs
              .setName("runs")
              .setDescription(
                "Number of times this is allowed to run. Leave blank for unlimited.",
              )
              .setRequired(false),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("list")
          .setDescription("List all scheduled messages") // I'd want it to list scheduled *in that channel*, but we'll see
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("delete")
          .setDescription("Delete a scheduled message")
          .addStringOption((id) =>
            id
              .setName("id")
              .setDescription("ID of the message to delete")
              .setRequired(true),
          ),
      ),
  )
  .setExecute(lead);
