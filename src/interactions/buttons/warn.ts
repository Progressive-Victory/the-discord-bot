import {
  ActionRow,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  InteractionReplyOptions,
  MessageFlags,
  Snowflake,
} from "discord.js";
import { Interaction } from "../../Classes/index.js";
import { appealDmSubmitted } from "../../features/moderation/buttons.js";
import { dateDiffInDays } from "../../features/moderation/index.js";
import { warnModal } from "../../features/moderation/modals.js";
import {
  WarnButtonsPrefixes,
  WarnModalPrefixes,
} from "../../features/moderation/types.js";
import { warnSearch } from "../../features/moderation/warnSearch.js";
import { GuildSetting } from "../../models/Setting.js";
import { Warn } from "../../models/Warn.js";
import { WarningSearch } from "../../models/WarnSearch.js";
import { AddSplitCustomId, getGuildChannel } from "../../util/index.js";

// button to move warn view left
export const warnViewLeft = new Interaction<ButtonInteraction>({
  customIdPrefix: WarnButtonsPrefixes.viewWarningsLeft,
  run: async (interaction: ButtonInteraction) => {
    const { customId, client } = interaction;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_id, searchId] = customId.split(client.splitCustomIdOn!);

    interaction.update(
      await warnSearch(searchId, interaction.inGuild() ? true : false, false),
    );
  },
});

// button to move warn view right
export const warnViewRight = new Interaction<ButtonInteraction>({
  customIdPrefix: WarnButtonsPrefixes.viewWarningsRight,
  run: async (interaction: ButtonInteraction) => {
    const { customId, client } = interaction;

    const searchId = customId.split(client.splitCustomIdOn!)[1];

    interaction.update(
      await warnSearch(searchId, interaction.inGuild() ? true : false, true),
    );
  },
});

export const updateById = new Interaction<ButtonInteraction>({
  customIdPrefix: WarnButtonsPrefixes.updateWarnById,
  run: async (interaction: ButtonInteraction) => {
    const { customId, client } = interaction;

    const warnId = customId.split(client.splitCustomIdOn!)[1];

    // check that warning exists
    const record = await Warn.findById(warnId);
    if (!record) {
      interaction.update({
        content: "Warning does not exist",
        embeds: [],
      });
      return;
    }

    const modal = warnModal(
      AddSplitCustomId(WarnModalPrefixes.updateById, warnId),
      "Update Warning",
      record.reason,
      dateDiffInDays(new Date(), record.expireAt),
    );

    interaction.showModal(modal);
  },
});

export const warnViewUser = new Interaction<ButtonInteraction>({
  customIdPrefix: WarnButtonsPrefixes.modViewWarningHistory,
  run: async (interaction: ButtonInteraction) => {
    const { user, customId } = interaction;
    const args = customId.split(interaction.client.splitCustomIdOn!);
    const targetId = args[1];
    let guildId: Snowflake;

    // console.log(interaction)
    if (interaction.inGuild()) {
      guildId = interaction.guildId;
    } else {
      guildId = args[2];
    }

    const search = await WarningSearch.create({
      guildId,
      searcher: {
        discordId: user.id,
        username: user.username,
      },
      targetDiscordId: targetId,
    });

    const reply: InteractionReplyOptions = await warnSearch(
      search,
      true,
      undefined,
      true,
    );

    reply.flags = MessageFlags.Ephemeral;

    interaction.reply(reply);
  },
});

export const banAppeal = new Interaction<ButtonInteraction>({
  customIdPrefix: WarnButtonsPrefixes.appealWarn,
  run: async (interaction: ButtonInteraction) => {
    const warning = await Warn.findById(
      interaction.customId.split(interaction.client.splitCustomIdOn!)[1],
    );

    if (!warning) {
      interaction.update({
        content: "This warning does not exist",
        embeds: [],
        components: [],
      });
      return;
    }

    const guild =
      interaction.client.guilds.cache.get(warning?.guildId) ??
      (await interaction.client.guilds
        .fetch(warning?.guildId)
        .catch(console.error));

    if (!guild) {
      return interaction.reply("guild does not exist");
    }

    const setting = await GuildSetting.findOne({ guildId: warning?.guildId });
    if (!setting?.warn.appealChannelId) {
      throw Error("Missing channel warn.appealChannelId");
    }

    const channel = await getGuildChannel(guild, setting.warn.appealChannelId);

    if (!channel?.isSendable()) {
      throw Error("warn.appealChannelId is not sendable, how did you get here");
    }
    if (interaction.message.flags.has(MessageFlags.IsComponentsV2)) return;
    const messageComponents = interaction.message.components[0];
    if (!(messageComponents instanceof ActionRow)) return;
    const actionRow = new ActionRowBuilder<ButtonBuilder>(messageComponents);
    actionRow.components[0] = appealDmSubmitted();

    interaction.update({
      components: [actionRow],
    });
  },
});
