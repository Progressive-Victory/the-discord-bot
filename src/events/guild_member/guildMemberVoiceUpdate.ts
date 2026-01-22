import {
  SettingsResponse,
  zSettingsResponse,
} from "@/contracts/responses/SettingsResponse.js";
import {
  channelMention,
  ColorResolvable,
  Colors,
  EmbedBuilder,
  Events,
  GuildMember,
  GuildScheduledEventStatus,
  inlineCode,
} from "discord.js";
import { Routes } from "../../Classes/API/ApiConnService/routes.js";
import Event from "../../Classes/Event.js";
import { apiConnService } from "../../util/api/pvapi.js";
import { markAttendance } from "../../util/events/markAttendance.js";
import { getGuildChannel } from "../../util/index.js";

/**
 * `guildMemberVoiceUpdate` handles the {@link Events.VoiceStateUpdate} {@link Event}.
 * If an audit logging channel is configured for voice chat leave/join events, a message is sent there.
 */
export const guildMemberVoiceUpdate = new Event({
  name: Events.VoiceStateUpdate,
  execute: async (oldState, newState) => {
    // console.log(oldState.toJSON(), newState.toJSON())

    let guild = newState.guild;
    if (!guild) guild = oldState.guild;
    const member =
      newState.member === null
        ? await guild.members.fetch(newState.id).catch(console.error)
        : newState.member;
    if (!member) return;
    const events = await guild.scheduledEvents.fetch();
    const oldChannelEv = events.find(
      (x) =>
        x.channelId === oldState.channelId &&
        x.status === GuildScheduledEventStatus.Active,
    );
    const newChannelEv = events.find(
      (x) =>
        x.channelId === newState.channelId &&
        x.status === GuildScheduledEventStatus.Active,
    );

    const newStateChannelMention = channelMention(
      newState.channelId ?? "error",
    );
    const oldStateChannelMention = channelMention(
      oldState.channelId ?? "error",
    );

    let embed: EmbedBuilder;

    if (oldState.channelId === newState.channelId) {
      if (newState.channelId && oldState.suppress !== newState.suppress) {
        if (!newState.suppress) {
          embed = vcLogEmbed(
            member,
            "Speaking on Stage",
            `${member}${inlineCode(member.displayName)} is now speaking on ${newStateChannelMention}`,
            Colors.Orange,
          );
        } else {
          embed = vcLogEmbed(
            member,
            "Left Stage",
            `${member}${inlineCode(member.displayName)} returned to audience in ${newStateChannelMention}`,
            Colors.Blue,
          );
        }
      } else return;
    } else {
      if (oldState.channelId === null && newState.channelId !== null) {
        if (newChannelEv) await markAttendance(newChannelEv, member, true);
        embed = vcLogEmbed(
          member,
          "Joined Voice Channel",
          `${member}${inlineCode(member.displayName)} joined ${newStateChannelMention}`,
          Colors.Green,
        );
      } else if (oldState.channelId !== null && newState.channelId === null) {
        if (oldChannelEv) await markAttendance(oldChannelEv, member, false);
        embed = vcLogEmbed(
          member,
          "Left Voice Channel",
          `${member}${inlineCode(member.displayName)} left ${oldStateChannelMention}`,
          Colors.Red,
        );
      } else {
        if (oldState.channelId && oldChannelEv)
          await markAttendance(oldChannelEv, member, false);
        if (newState.channelId && newChannelEv)
          await markAttendance(newChannelEv, member, true);
        embed = vcLogEmbed(
          member,
          "Switched Voice Channel",
          `${member}${inlineCode(member.displayName)} switched from ${oldStateChannelMention} to ${newStateChannelMention}`,
          Colors.Blue,
        );
      }
    }

    const res = await apiConnService.get<SettingsResponse>(
      Routes.setting("voice_updates_log_channel_id"),
      zSettingsResponse,
    );

    console.log("res", res);

    const loggingChannelId = res.data;

    // check that logging channel exists in guild
    const loggingChannel = await getGuildChannel(guild, loggingChannelId);
    if (!loggingChannel?.isSendable()) return;

    console.log("sending vc update");

    loggingChannel.send({ embeds: [embed] });
  },
});

/**
 * Create embed for log
 * @param member - Member changing state
 * @param title - Title for the embed
 * @param description - description for the embed
 * @param color - Color for the embed
 * @returns embed builder
 */
function vcLogEmbed(
  member: GuildMember,
  title: string,
  description: string,
  color: ColorResolvable,
) {
  const icon = member.user.displayAvatarURL({ forceStatic: true });
  return new EmbedBuilder()
    .setAuthor({ iconURL: icon, name: title })
    .setDescription(description)
    .setTimestamp()
    .setFooter({ text: `User ID: ${member.id}` })
    .setColor(color);
}

/**
 *
 * @param channelId
 * @param member
 */
