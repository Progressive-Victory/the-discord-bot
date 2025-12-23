import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  inlineCode,
  InteractionContextType,
  InteractionReplyOptions,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  SlashCommandStringOption,
} from "discord.js";
import { ChatInputCommand } from "../../Classes/index.js";
import { viewWarningEmbed } from "../../features/moderation/embeds.js";
import {
  dateDiffInDays,
  WARN_MAX_CHAR,
} from "../../features/moderation/index.js";
import { warnModal } from "../../features/moderation/modals.js";
import {
  WarnButtonsPrefixes,
  WarnModalPrefixes,
} from "../../features/moderation/types.js";
import { Warn } from "../../models/Warn.js";
import { apiConnService } from "../../util/api/ApiConnService.js";
import { AddSplitCustomId, isGuildMember } from "../../util/index.js";
// import { localize } from "../../i18n.js";

export const ns = "moderation";
const idOptions = new SlashCommandStringOption()
  .setName("id")
  .setDescription("Record Id")
  .setMaxLength(8)
  .setRequired(true);

/**
 * The `warn` mod command allows an admin to issue a warning to a guild member. It exposes
 * the following subcommands:
 * <ul>
 *     <li>`create` - create a warning for the specified guild member for the </li>
 *     <li>`update` - update a warning</li>
 *     <li>`remove` - remove a warning</li>
 *     <li>`view` - view warnings, optionally filtering by the recipient, issuer, or the time scope</li>
 * </ul>
 */
export const warn = new ChatInputCommand({
  builder: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Moderation commands")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
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
        .setName("update")
        .setDescription("Update Warning")
        .addStringOption(idOptions.setRequired(true)),
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName("remove")
        .setDescription("Remove warn")
        .addStringOption(idOptions.setRequired(true))
        .addBooleanOption((option) =>
          option
            .setName("delete")
            .setDescription("To delete the record")
            .setRequired(false),
        ),
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName("view")
        .setDescription("View warnings")
        /*.addStringOption(
          idOptions
            .setDescription(
              "Search by Record Id. Overrides other search options",
            )
            .setRequired(false),
        )*/
        .addUserOption((option) =>
          option
            .setName("recipient")
            .setDescription("Filter by the member who received the warning")
            .setRequired(false),
        )
        .addUserOption((option) =>
          option
            .setName("issuer")
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
        ),
    ),
  execute: async (interaction) => {
    const subcommand = interaction.options.getSubcommand(true);

    switch (subcommand) {
      case "create":
        chatAdd(interaction);
        break;
      case "update":
        update(interaction);
        break;
      case "remove":
        remove(interaction);
        break;
      case "view":
        viewWarning(interaction);
        break;
      default:
        throw Error("Unexpected Warn subcommand");
    }

    return undefined;
  },
});

/**
 * Send modal to add warning to user
 * @param interaction - command interaction from user
 */
function chatAdd(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getMember("member");
  if (!isGuildMember(target)) return;
  const chatDuration = interaction.options.getInteger("duration") ?? undefined;
  const chatReason = interaction.options.getString("reason") ?? undefined;
  if (target == interaction.member) {
    interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "You can not warn your self",
    });
    return;
  } else if (target.user.bot) {
    interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "You can not issue a warning to a bot",
    });
    return;
  }

  const modal = warnModal(
    AddSplitCustomId(WarnModalPrefixes.createWarning, target.id),
    "Create Warning",
    chatReason,
    chatDuration,
  );

  interaction.showModal(modal);
}

/**
 * view warning(s)
 * @param interaction - command interaction from user
 */
async function viewWarning(interaction: ChatInputCommandInteraction) {
  const mod = interaction.options.getUser("issuer");
  const target = interaction.options.getUser("recipient");
  const monthsAgo = interaction.options.getInteger("scope") ?? 0;
  //const id = interaction.options.getString("id");
  //const filter: FilterQuery<WarningRecord> = {};
  const timeWindowDate = new Date(Date.now() - monthsAgo * 2592000000);
  const url = new URL(process.env.API_HOST_ADDR + "/discord/warns");
  if (mod) url.searchParams.set("mod_discord_id", mod.id);
  if (target) url.searchParams.set("tgt_discord_id", target.id);
  if (monthsAgo > 0)
    url.searchParams.set("time_window", timeWindowDate.toISOString());
  const res = await apiConnService.sendRequest(url, "GET");
  const data = await res.json();
  console.log(data);
  data.length = 20;
  const memes = data.map(
    (entry: {
      id: number;
      userWarneddDiscordId: string;
      moderatorDiscordId: string;
      reason: string;
      createdAtUtc: Date;
      expiresAtUtc: Date;
    }) => {
      return entry.reason;
    },
  );
  console.log(memes);
  const memes2 = memes.toString().substring(0, 1999);
  interaction.reply(memes2);
}

/*if (id) {
    const record = await Warn.findById(id);
    if (record) {
      const embeds = await viewWarningEmbeds([record], true);
      const actionRow = new ActionRowBuilder<ButtonBuilder>();
      if (record.expireAt > new Date()) {
        actionRow.addComponents(updateWarnById(record));
      }

      actionRow.addComponents(modViewWarningHistory(record.target.discordId));

      interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds,
        components: [actionRow],
      });
      return;
    } else if (!mod && !target && monthsAgo === -1) {
      interaction.reply({
        flags: MessageFlags.Ephemeral,
        content:
          "No search record found. Please let an admin know if you see this message",
      });
      return;
    }
  }

  let expireAfter: Date | undefined = undefined;

  if (monthsAgo === -1) {
    expireAfter = new Date();
    filter.expireAt = { $gte: expireAfter };
  } else if (monthsAgo > 0) {
    expireAfter = new Date();
    expireAfter.setMonth(-monthsAgo);
    filter.expireAt = { $gte: expireAfter };
  }

  const searchRecord = await WarningSearch.create({
    guildId: interaction.guild?.id,
    searcher: {
      discordId: interaction.user.id,
      username: interaction.user.username,
    },
    targetDiscordId: target?.id,
    moderatorDiscordId: mod?.id,
    expireAfter,
    pageStart: 0,
  });

  const reply: InteractionReplyOptions = await warnSearch(
    searchRecord,
    true,
    undefined,
    true,
  );
  reply.flags = MessageFlags.Ephemeral;

  interaction.reply(reply);
}*/

/**
 * Update a warning
 * @param interaction - command interaction from user
 */
async function update(interaction: ChatInputCommandInteraction) {
  const warnId = interaction.options.getString("id", true);
  const record = await Warn.findById(warnId);

  if (!record) {
    interaction.reply({
      content: "Warning could not be found",
      flags: MessageFlags.Ephemeral,
    });
  } else {
    interaction.showModal(
      warnModal(
        AddSplitCustomId(WarnModalPrefixes.updateById, warnId),
        "Update Warning",
        record.reason,
        dateDiffInDays(new Date(), record.expireAt),
      ),
    );
  }
}

/**
 * Remove a warning
 * @param interaction - command interaction from user
 */
async function remove(interaction: ChatInputCommandInteraction) {
  const warnId = interaction.options.getString("id", true);
  const record = await Warn.findById(warnId);
  const del = interaction.options.getBoolean("delete") ?? false;
  const reply: InteractionReplyOptions = { flags: MessageFlags.Ephemeral };
  if (!record) {
    reply.content = "Warn could not be found. Check your the warn id";
    interaction.reply(reply);
    return;
  }
  const embed = await viewWarningEmbed(record, true);
  if (!embed) {
    reply.content = "An Error occurred. Please contact an admin";
    interaction.reply(reply);
    return;
  }

  reply.embeds = [embed];

  const cancelButton: ButtonBuilder = new ButtonBuilder()
    .setLabel("Cancel")
    .setStyle(ButtonStyle.Success);
  const approveButton: ButtonBuilder = new ButtonBuilder().setStyle(
    ButtonStyle.Danger,
  );

  if (del) {
    reply.content = `Are you sure you want to delete warning: ${inlineCode(warnId)}`;

    cancelButton.setCustomId(
      AddSplitCustomId(WarnButtonsPrefixes.deleteWarnNo, warnId),
    );
    approveButton
      .setLabel("Delete")
      .setCustomId(AddSplitCustomId(WarnButtonsPrefixes.deleteWarnYes, warnId));
  } else {
    reply.content = `Are you sure you want to end warning: ${inlineCode(warnId)}`;

    cancelButton.setCustomId(
      AddSplitCustomId(WarnButtonsPrefixes.removeWarnNo, warnId),
    );
    approveButton
      .setLabel("End")
      .setCustomId(AddSplitCustomId(WarnButtonsPrefixes.removeWarnYes, warnId));
  }

  reply.components = [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      cancelButton,
      approveButton,
    ),
  ];

  interaction.reply(reply);
}
