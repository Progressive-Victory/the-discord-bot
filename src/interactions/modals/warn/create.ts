import {
  ActionRowBuilder,
  ButtonBuilder,
  MessageFlags,
  ModalSubmitInteraction,
} from "discord.js";
import { Interaction } from "../../../Classes/Interaction.js";
import {
  modViewWarningHistory,
  userViewWarnHistory,
} from "../../../features/moderation/buttons.js";
import {
  newWarningDmEmbed,
  newWarningLogEmbed,
  newWarnModEmbed,
} from "../../../features/moderation/embeds.js";
import { WarnModalPrefixes } from "../../../features/moderation/types.js";
import { GuildSetting } from "../../../models/Setting.js";
import { Warn } from "../../../models/Warn.js";
import { getGuildChannel, isGuildMember } from "../../../util/index.js";

/**
 * `warnCreate` is a modal interaction which allows mods to send warnings to guild members. It:
 * <ul>
 *     <li>Persists the warnings for a user in MongoDB</li>
 *     <li>Sends the warned user a notification</li>
 *     <li>Notifies the mod that the warning has been issued</li>
 *     <li>If there is a channel for warning audit logs, logs the event</li>
 * </ul>
 */
export const warnCreate = new Interaction<ModalSubmitInteraction>({
  customIdPrefix: WarnModalPrefixes.createWarning,
  run: async (interaction: ModalSubmitInteraction) => {
    const { customId, client, guild, guildId, member, fields } = interaction;
    const targetId = customId.split(client.splitCustomIdOn!)[1];

    const numberRegex: RegExp = /^\d{1,3}$/is;
    const target = guild?.members.cache.get(targetId);
    const mod = member;
    if (!(target && isGuildMember(mod))) return;

    const reason = fields.getTextInputValue("reason");
    const modalDuration = fields.getTextInputValue("duration");
    let duration: number | undefined;
    if (!numberRegex.test(modalDuration)) {
      duration = undefined;
    } else {
      duration = Number(modalDuration);
    }

    const record = await Warn.createWarning(target, mod, reason, duration);
    const count = await Warn.countDocuments({
      "target.discordId": target.id,
      expireAt: { $gte: new Date() },
    });
    const setting = await GuildSetting.findOne({ guildId });

    const userActionRow = new ActionRowBuilder<ButtonBuilder>();

    // TODO: Appeal System to notify head mod
    // if (setting?.warn.appealChannelId) {
    // 	userActionRow.addComponents(appealWarn(record))
    // }

    userActionRow.addComponents(
      userViewWarnHistory(target.id, guild!).setLabel("View Your History"),
    );

    target.send({
      embeds: [newWarningDmEmbed(record, count, guild!)],
      components: [],
    });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      modViewWarningHistory(targetId),
    );

    interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [newWarnModEmbed(record, mod, target)],
      components: [row],
    });

    if (setting?.warn.logChannelId) {
      const channel = await getGuildChannel(guild!, setting?.warn.logChannelId);
      if (channel?.isSendable()) {
        channel.send({
          embeds: [newWarningLogEmbed(record, mod, target)],
          components: [row],
        });
      }
    }
  },
});
