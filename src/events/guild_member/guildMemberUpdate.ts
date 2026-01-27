import {
  ActionRowBuilder,
  ButtonBuilder,
  ContainerBuilder,
  EmbedBuilder,
  Events,
  GuildMemberFlags,
  heading,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder,
  time,
  TimestampStyles,
} from "discord.js";

import Event from "@/Classes/Event";
import { welcomeButton, welcomeColors } from "@/features/welcome";
import { getGuildChannel } from "@/util";
import { fetchSetting } from "@/util/api/fetchSettings";
import { footer } from "@/util/components";

/**
 * `guildMemberUpdate` handles the {@link Events.GuildMemberUpdate} {@link Event}. There are two cases:
 * <ul>
 *     <li>If an audit logging channel is configured for member joins, then a message is sent there
 *     once a new member accepts the terms. If the member has rejoined the server, that will be
 *     noted in the audit log.</li>
 *     <li>If the member update is triggered by a nickname change, the audit log is instead sent to
 *     the nickname update audit logging channel.</li>
 * </ul>
 */
export const guildMemberUpdate = new Event({
  name: Events.GuildMemberUpdate,
  execute: async (oldMember, newMember) => {
    if (oldMember.pending && oldMember.pending !== newMember.pending) {
      const { guild } = newMember;
      const res = await fetchSetting("welcome_channel_id");

      const joinChannelId = res.data;

      // check that Join channel exists in guild
      const joinChannel = await getGuildChannel(guild, joinChannelId);
      if (!joinChannel?.isSendable()) return;

      const joinedAt = newMember.joinedAt ? newMember.joinedAt : new Date();

      const text = [
        heading("Member Joined"),
        `${newMember.toString()} ${newMember.user.username}`,
        `Joined: ${time(joinedAt, TimestampStyles.RelativeTime)}`,
      ];
      if (newMember.flags.has(GuildMemberFlags.DidRejoin))
        text.push("Member previously has joined the server");

      const display = new TextDisplayBuilder().setContent(text.join("\n"));

      const avatarURL = newMember.displayAvatarURL({ forceStatic: true });
      const thumbnail = new ThumbnailBuilder()
        .setURL(avatarURL)
        .setDescription(`Display Avatar for ${newMember.user.username}`);

      const section = new SectionBuilder()
        .addTextDisplayComponents(display)
        .setThumbnailAccessory(thumbnail);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        welcomeButton,
      );

      const container = new ContainerBuilder()
        .addSectionComponents(section)
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setDivider(true)
            .setSpacing(SeparatorSpacingSize.Small),
        )
        .addTextDisplayComponents(footer(newMember.id))
        .addActionRowComponents(row)
        .setAccentColor(welcomeColors.Unwelcomed);

      joinChannel.send({
        flags: MessageFlags.IsComponentsV2,
        components: [container],
      });

      if (oldMember.nickname !== newMember.nickname) {
        const { guild } = newMember;
        const res = await fetchSetting("nickname_updates_log_channel_id");

        const nicknameUpdatesChannelId = res.data;

        const nicknameLogChannel = await getGuildChannel(
          guild,
          nicknameUpdatesChannelId,
        ).catch(console.error);
        if (!nicknameLogChannel?.isSendable()) return;

        const title = `Nickname Changed`;
        const description = `${newMember} ${newMember.user.username} changed their nickname from ${oldMember.nickname ?? oldMember.displayName} to ${newMember.nickname ?? newMember.displayName}`;
        const avatarURL = newMember.displayAvatarURL({ forceStatic: true });
        const embed = new EmbedBuilder()
          .setAuthor({ iconURL: avatarURL, name: title })
          .setDescription(description)
          .setTimestamp()
          .setFooter({ text: `User ID: ${newMember.user.id}` })
          .setColor("#2AC9FF");
        nicknameLogChannel.send({ embeds: [embed] });
      }
    }
  },
});
