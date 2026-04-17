import { ChatInputCommand } from "@/Classes";
import { banUserChatCommand } from "@/features/moderation/ban";
import {
  ApplicationIntegrationType,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { create } from "./create";
import { view } from "./view";

const minBanReason = 20;
const maxBanReason = 1500;
const deleteMessagesChoices = [
  { name: "Don't Delete Any", value: 0 },
  { name: "Previous Hour", value: 60 * 60 },
  { name: "Previous 6 Hours", value: 6 * 60 * 60 },
  { name: "Previous 12 Hours", value: 12 * 60 * 60 },
  { name: "Previous 24 Hours", value: 24 * 60 * 60 },
  { name: "Previous 3 Days", value: 3 * 24 * 60 * 60 },
  { name: "Previous 7 Days", value: 7 * 24 * 60 * 60 },
];

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
    .setName("moderation")
    .setDescription("Moderation commands")
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setDefaultMemberPermissions(
      PermissionFlagsBits.KickMembers | PermissionFlagsBits.BanMembers,
    )
    .addSubcommandGroup((warn) =>
      warn
        .addSubcommand((subCommand) =>
          subCommand
            .setName("create")
            .setDescription("Add warning to a member")

            .addUserOption((option) =>
              option
                .setName("member")
                .setDescription("The member that will receive the warning"),
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
    )
    .addSubcommand((ban) =>
      ban
        .setName("ban")
        .setDescription("Ban Member")
        .addUserOption((target) =>
          target
            .setName("user")
            .setDescription("User to be banned")
            .setRequired(true),
        )
        .addStringOption((reason) =>
          reason
            .setName("reason")
            .setDescription("Reason to ban the user")
            .setRequired(false)
            .setMinLength(minBanReason)
            .setMaxLength(maxBanReason),
        )
        .addNumberOption((deleteMessage) =>
          deleteMessage
            .setName("delete_messages")
            .setDescription("Remove messages from baned user up to 7 days")
            .setRequired(true)
            .setChoices(deleteMessagesChoices),
        ),
    ),
  execute: async (interaction) => {
    const subcommand = interaction.options.getSubcommand(true);

    switch (subcommand) {
      case "create":
        create(interaction);
        break;
      case "view":
        view(interaction);
        break;
      case "ban":
        banUserChatCommand(
          interaction,
          minBanReason,
          maxBanReason,
          deleteMessagesChoices,
        );
        break;
      default:
        throw Error("Unexpected Warn subcommand");
    }
  },
});
