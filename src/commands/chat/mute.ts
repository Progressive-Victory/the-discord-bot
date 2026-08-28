import { ChatInputCommand } from "@/Classes";
import { MuteType } from "@/contracts/data";
import { guildMemberVoiceUpdate } from "@/events/guild_member";
import { getGuildChannel } from "@/util";
import { muteEmbed } from "@/features/mute";
import { fetchSetting } from "@/util/api/fetchSettings";
import {
  ContainerBuilder,
  EmbedBuilder,
  Guild,
  GuildMember,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  PermissionsBitField,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SlashCommandBuilder,
  subtext,
  TextDisplayBuilder,
  time,
  TimestampStyles,
  ChannelType,
  Client,
  GatewayIntentBits,
} from "discord.js";

const MUTE_COLOR = 0x7c018c;

const durationText = {
  "3": "3 mins",
  "10": "10 mins",
  "30": "30 mins",
  "60": "1 hour",
  "360": "6 hours",
  "1440": "1 Day",
};

type dTime = "3" | "10" | "30" | "60" | "360" | "1440";

/**
 * The `mute` chat command allows users with the appropriate permissions
 * to mute guild members for a specified reason and duration. The command will also
 * log the mute and send a notification to a voice channel that the user has been muted.
 */
export const mute = new ChatInputCommand({
  builder: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Commands for muting users")
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
    .setContexts(InteractionContextType.Guild)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Which user would you like to mute?")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("duration")
        .setDescription("How long should this user be muted?")
        .setRequired(true)
        .addChoices(
          { name: "1 min", value: 1 },
          { name: "3 min", value: 3 },
          { name: "10 min", value: 10 },
          { name: "30 min", value: 30 },
          { name: "1 hr", value: 60 },
          { name: "6 hr", value: 60 * 6 },
          { name: "1 day", value: 60 * 24 },
        ),
    )
    .addIntegerOption((option) =>
      option
        .setName("mute_type")
        .setDescription("What should this user be muted from?")
        .setRequired(true)
        .addChoices(
          { name: "Chat", value: MuteType.Chat },
          { name: "Voice Channel", value: MuteType.Voice },
          { name: "Both", value: MuteType.Both },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Why are you muting this user for this long?")
        .setMinLength(1)
        .setMaxLength(300)
        .setRequired(true),
    ),
  execute: async (interaction) => {
    let guild: Guild;
    if (interaction.inCachedGuild()) guild = interaction.guild;
    else if (interaction.inRawGuild())
      guild = await interaction.client.guilds.fetch(interaction.guildId);
    else return;

    //who are we muting
    let targetMember = interaction.options.getMember("user");
    if (!(targetMember instanceof GuildMember)) {
      targetMember = await guild.members.fetch(
        interaction.options.getUser("user", true),
      );
    }

    // check that target is not a admin or bot
    if (
      targetMember.user.bot ||
      targetMember.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      void interaction.reply({
        content: `${targetMember.toString()} bots and admins can not be server muted`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Muting member
    let mutingMember = interaction.member;
    if (!(mutingMember instanceof GuildMember)) {
      mutingMember = await guild.members.fetch(interaction.user);
    }

    // and for how long
    const durationMinutes = interaction.options.getInteger("duration", true);
    const reason = interaction.options.getString("reason", true);
    const endDate = new Date(new Date().getTime() + durationMinutes * 60000);

    // Message to be sent to channels
    const mute_type = interaction.options.getInteger("mute_type", true);
    const timeout_map = new Map();

    // TODO: below code needs testing, likely cause of issue #303 since there is no Timeout Channel in the Simple Server

    const res = await fetchSetting("timeout_log_channel_id");
    const timeoutLogChannelId = res.data;
    if (!timeoutLogChannelId) return;

    const timeoutChannel = await getGuildChannel(
      targetMember.guild,
      timeoutLogChannelId,
    );

    switch (mute_type) {
      case MuteType.Chat: {
        chatMute(
          targetMember,
          mutingMember,
          durationMinutes,
          reason,
          guild,
          mute_type,
        );
        logMessage(
          targetMember,
          mutingMember,
          durationMinutes,
          reason,
          timeoutChannel,
          mute_type,
        );
        break;
      }

      case MuteType.Voice: {
        voiceMute(
          targetMember,
          mutingMember,
          durationMinutes,
          reason,
          mute_type,
          interaction,
          timeout_map,
        );
        logMessage(
          targetMember,
          mutingMember,
          durationMinutes,
          reason,
          timeoutChannel,
          mute_type,
        );
        break;
      }

      default: {
        voiceMute(
          targetMember,
          mutingMember,
          durationMinutes,
          reason,
          MuteType.Voice,
          interaction,
          timeout_map,
        );
        logMessage(
          targetMember,
          mutingMember,
          durationMinutes,
          reason,
          timeoutChannel,
          MuteType.Voice,
        );

        chatMute(
          targetMember,
          mutingMember,
          durationMinutes,
          reason,
          guild,
          MuteType.Chat,
        );
        logMessage(
          targetMember,
          mutingMember,
          durationMinutes,
          reason,
          timeoutChannel,
          MuteType.Chat,
        );

        break;
      }
    }

    interaction.client.on("voiceStateUpdate", (oldState, newState) => {
      console.log("VoiceStateUpdate");
      const cur_time = Date.now();
      const member = newState.member ?? oldState.member;
      if (!member || !timeout_map.has(member.id)) return;
      const start_time = timeout_map.get(member.id)[1];
      const duration_ms = durationMinutes * 60000;

      // User joined VC
      if (!oldState.channelId && newState.channelId) {
        // User was voice muted outside of VC, needs to be muted if under timeout still
        if (!member.voice.serverMute && cur_time - duration_ms < start_time) {
          member.edit({ mute: true });
          setTimeout(() => {
            member.edit({ mute: false });
          }, duration_ms);
        }

        // Should unmute user here
        if (cur_time - duration_ms > start_time) {
          const unmute_bool = member.edit({ mute: false });
          if (unmute_bool) {
            timeout_map.delete(member.id);
          }
        }
      }
    });

    interaction.reply({
      content: `${targetMember.toString()} has been server muted. They will be unmuted ${time(endDate, TimestampStyles.RelativeTime)}`,
      flags: MessageFlags.Ephemeral,
    });
  },
});

async function voiceMute(
  targetMember: GuildMember,
  mutingMember: GuildMember,
  durationMinutes: number,
  reason: string,
  type: Enum,
  interaction: any,
  timeout_map: Map,
) {
  const start_time = Date.now();
  timeout_map.set(targetMember.id, [durationMinutes, start_time]);
  if (!targetMember.voice.channel) {
    return;
  }
  await targetMember.edit({ mute: true });
  setTimeout(() => {
    if (!targetMember.voice.channel) {
      return;
    }
    targetMember.edit({ mute: false });
    timeout_map.delete(targetMember.id);
  }, durationMinutes * 60000);

  vcMessage(targetMember, mutingMember, durationMinutes, reason, type);
}

async function chatMute(
  targetMember: GuildMember,
  mutingMember: GuildMember,
  durationMinutes: number,
  reason: string,
  guild: Guild,
  type: Enum,
) {
  const active_channel = await getActiveChannel(targetMember, guild);
  const chat_mute_role = targetMember.guild.roles.cache.find(
    (role) => role.name === "Chat Muted",
  );

  await targetMember.roles.add(chat_mute_role);

  setTimeout(() => {
    if (targetMember.roles.cache.some((role) => role.name === "Chat Muted")) {
      targetMember.roles.remove(chat_mute_role);
    }
  }, durationMinutes * 60000);

  if (active_channel != null) {
    logMessage(
      targetMember,
      mutingMember,
      durationMinutes,
      reason,
      active_channel,
      type,
    );
  }
}

async function getActiveChannel(
  targetMember: GuildMember,
  guild: Guild,
): Promise<TextChannel | null> {
  const timeInterval = 15 * 60 * 1000;
  const cutoff = Date.now() - timeInterval;
  const msgAmount = 5;
  const userId = targetMember.id;

  const textChannels = guild.channels.cache.filter(
    (ch): ch is TextChannel => ch.type === ChannelType.GuildText,
  );

  const channel_map = new Map<TextChannel, number>();

  await Promise.all(
    textChannels.map(async (ch) => {
      let messages: Collection<string, any>;
      try {
        messages = await ch.messages.fetch({ limit: 100 });
      } catch (err) {
        return;
      }

      let count = 0;
      messages.forEach((m) => {
        if (m.author.id === userId && m.createdTimestamp >= cutoff) {
          count++;
        }
      });

      if (count > 0) {
        channel_map.set(ch, count);
      }
    }),
  );

  if (channel_map.size === 0) {
    return null;
  }

  const [maxChannel, maxCount] = [...channel_map.entries()].reduce(
    (best, entry) => (entry[1] > best[1] ? entry : best),
  );

  return maxCount >= msgAmount ? maxChannel : null;
}

/**
 * log the mute in specified logging server
 * @param targetMember - The member who was muted
 * @param mutingMember - The member who muted targetMember
 * @param durationMinutes - number representing the number minutes targetMember is muted for
 * @param reason - Why the targetMember was muted
 */
async function logMessage(
  targetMember: GuildMember,
  mutingMember: GuildMember,
  durationMinutes: number,
  reason: string,
  targetChannel: TextChannel,
  type: string,
) {
  // check if log channel is set
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + durationMinutes * 60000);

  const embed = muteEmbed(
    targetMember,
    mutingMember,
    createdAt,
    expiresAt,
    reason,
    type,
  );

  targetChannel.send({ embeds: [embed] });
}

// /**
//  * send a dm to the user informing them of why they were muted
//  * @param interaction - command interaction from user
//  * @param mutedMember
//  * @param durationMinutes
//  */
// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// function dmNotification(mutedMember:GuildMember, durationMinutes:number ){
// 	const mutedMember = mutedMember.guild.iconURL({forceStatic: true}) ?? undefined
// 	const endDate = new Date(new Date().getTime() + durationMinutes*60000)
// 	mutedMember.send({embeds:[getMuteNotificationEmbed(botIcon,`You were muted`, durationMinutes, durationHours, durationDays)]})
// }

/**
 * send a notification to the voice chat for the current voice server
 * @param targetMember - The member who was muted
 * @param mutingMember - The member who muted targetMember
 * @param durationMinutes - number representing the number minutes targetMember is muted for
 * @param reason -  reason why member is muted
 */
function vcMessage(
  targetMember: GuildMember,
  mutingMember: GuildMember,
  durationMinutes: number,
  reason: string,
  type: string,
) {
  // check if member is connected to channel
  if (!targetMember.voice.channel) return;

  const channel = targetMember.voice.channel;
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + durationMinutes * 60000);

  const embed = muteEmbed(
    targetMember,
    mutingMember,
    createdAt,
    expiresAt,
    reason,
    type,
  );

  channel.send({ embeds: [embed] });
}
