import {
  channelMention,
  ColorResolvable,
  Colors,
  EmbedBuilder,
  Events,
  GuildMember,
  inlineCode,
} from "discord.js";
import Event from "../../Classes/Event.js";
import {
  IScheduledEvent,
  ScheduledEvent,
} from "../../models/ScheduledEvent.js";
import { GuildSetting } from "../../models/Setting.js";
import { getGuildChannel } from "../../util/index.js";
import dbConnect from "../../util/libmongo.js";

/**
 * `guildMemberVoiceUpdate` handles the {@link Events.VoiceStateUpdate} {@link Event}.
 * If an audit logging channel is configured for voice chat leave/join events, a message is sent there.
 */
export const guildMemberVoiceUpdate = new Event({
  name: Events.VoiceStateUpdate,
  execute: async (oldState, newState) => {
    // console.log(oldState.toJSON(), newState.toJSON())

    const { guild } = newState;
    const member =
      newState.member === null
        ? await guild.members.fetch(newState.id).catch(console.error)
        : newState.member;
    if (!member) return;

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
        markAttendance(newState.channelId, member);
        embed = vcLogEmbed(
          member,
          "Joined Voice Channel",
          `${member}${inlineCode(member.displayName)} joined ${newStateChannelMention}`,
          Colors.Green,
        );
      } else if (oldState.channelId !== null && newState.channelId === null) {
        embed = vcLogEmbed(
          member,
          "Left Voice Channel",
          `${member}${inlineCode(member.displayName)} left ${oldStateChannelMention}`,
          Colors.Red,
        );
      } else {
        embed = vcLogEmbed(
          member,
          "Switched Voice Channel",
          `${member}${inlineCode(member.displayName)} switched from ${oldStateChannelMention} to ${newStateChannelMention}`,
          Colors.Blue,
        );
        if (newState.channelId) markAttendance(newState.channelId, member);
      }
    }

    const settings = await GuildSetting.findOne({ guildId: guild.id });
    // check that logging channel ID is set
    const loggingChannelId = settings?.logging.voiceUpdatesChannelId;
    if (!loggingChannelId) return;

    // check that logging channel exists in guild
    const loggingChannel = await getGuildChannel(guild, loggingChannelId);
    if (!loggingChannel?.isSendable()) return;

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
async function markAttendance(channelId: string, member: GuildMember) {
  try {
    console.log("Marking Attendance");
    await dbConnect();
    const res: IScheduledEvent = (await ScheduledEvent.findOne({
      channelId: channelId,
      status: 2,
    })
      .sort({ _id: -1 })
      .exec()) as IScheduledEvent;
    if (!res) return;
    if (res.attendees.find((x) => x === member.id)) return;
    res.attendees.push(member.id);
    await res.save();
  } catch (e) {
    console.error(e);
  }
}
