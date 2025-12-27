import {
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { ChatInputCommand } from "../../../Classes/index.js";
import { WARN_MAX_CHAR } from "../../../features/moderation/index.js";
// import { create } from "./create.js";
import { view } from "./view.js";

/**
 * The `warn` mod command allows an admin to issue a warning to a guild member. It exposes
 * the following subcommands:
 * <ul>
 *     <li>`create` - create a warning for the specified guild member for the </li>
 *     <li>`view` - view warnings, optionally filtering by the recipient, issuer, or the time scope</li>
 * </ul>
 */
export const warn = new ChatInputCommand({
  builder: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Moderation commands")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(
      PermissionFlagsBits.KickMembers | PermissionFlagsBits.BanMembers,
    )

    .addSubcommand((subCommand) =>
      subCommand
        .setName("create")
        .setDescription("Add warning to a member")

        .addUserOption((option) =>
          option
            .setName("member")
            .setDescription("The member that will receive the warning")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("Add reason for the warning")
            .setMaxLength(WARN_MAX_CHAR)
            .setRequired(false),
        )
        .addIntegerOption((option) =>
          option
            .setName("duration")
            .setDescription("Number of days, the warning till end of the warn")
            .setMinValue(0)
            .setMaxValue(999)
            .setRequired(false),
        ),
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName("view")
        .setDescription("View warnings")

        .addUserOption((option) =>
          option
            .setName("recipient")
            .setDescription("Filter by the member who received the warning")
            .setRequired(false),
        )
        .addUserOption((option) =>
          option
            .setName("moderator")
            .setDescription("Filter by the member who issued the warning")
            .setRequired(false),
        )
        .addIntegerOption((option) =>
          option
            .setName("scope")
            .setDescription(
              "Filter warnings by date issued in the last x months",
            )
            .addChoices(
              { name: "All", value: 0 },
              { name: "3 Months", value: 3 },
              { name: "6 Months", value: 6 },
              { name: "9 Months", value: 9 },
              { name: "1 year", value: 12 },
            )
            .setRequired(false),
        )
        .addStringOption((option) =>
          option
            .setName("order")
            .setDescription("The order in which warns are displayed")
            .setChoices(
              { name: "Ascending", value: "asc" },
              { name: "Descending", value: "desc" },
            )
            .setRequired(false),
        ),
    ),
  execute: async (interaction) => {
    const subcommand = interaction.options.getSubcommand(true);

    switch (subcommand) {
      case "create":
        // create(interaction);
        break;
      case "view":
        view(interaction);
        break;
      default:
        throw Error("Unexpected Warn subcommand");
    }
  },
});
