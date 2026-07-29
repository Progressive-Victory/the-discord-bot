import { ChatInputCommand } from "@/Classes";
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
          { name: "1 min", value: 1 }, // For testing
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
          { name: "Chat", value: 1 },
          { name: "Voice Channel", value: 2 },
          { name: "Both", value: 3 },
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

    if (!targetMember.voice.channel) {
      interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "User is not in a vc.",
      });
      return;
    }

    // and for how long
    const durationMinutes = interaction.options.getInteger("duration", true);
    const reason = interaction.options.getString("reason", true);
    const endDate = new Date(new Date().getTime() + durationMinutes * 60000);

    // Message to be sent to channels
    const mute_type = interaction.options.getInteger("mute_type", true);

    // Chat Mute
    if (mute_type == 1) {
      chatMute(targetMember, mutingMember, durationMinutes, reason);
    }

    // VC Mute
    else if (mute_type == 2) {
      muteUser(targetMember, durationMinutes, reason);
      vcMessage(targetMember, mutingMember, durationMinutes, reason);
    }

    // Both Mute
    else if (mute_type == 3) {
      muteUser(targetMember, durationMinutes, reason);
      vcMessage(targetMember, mutingMember, durationMinutes, reason);
      chatMute(targetMember, mutingMember, durationMinutes, reason);
    }

    // NOTE: Calling Logs causes the bot to crash with a Guild UnOwned Error
    //vcMessage(targetMember, mutingMember, durationMinutes);
    //logMessage(targetMember, mutingMember, durationMinutes, reason);

    interaction.reply({
      content: `${targetMember.toString()} has been server muted. They will be unmuted ${time(endDate, TimestampStyles.RelativeTime)}`,
      flags: MessageFlags.Ephemeral,
    });
  },
});

async function muteUser(targetMember, durationMinutes, reason) {
  targetMember.voice.setMute(true, reason);
  setTimeout(() => {
    if (targetMember.voice.serverMute)
      targetMember.voice.setMute(false, "Mute Time Elapsed");
  }, durationMinutes * 60000);
}

async function chatMute(
  targetMember: GuildMember,
  mutingMember: GuildMember,
  durationMinutes: number,
  reason: string,
) {
  const active_channel = await getActiveChannel(targetMember);

  const chat_mute_role = targetMember.guild.roles.cache.find(
    (role) => role.name === "Chat Muted",
  );

  await targetMember.roles.add(chat_mute_role);

  if (active_channel != null) {
    await logMessage(
      targetMember,
      mutingMember,
      durationMinutes,
      reason,
      active_channel,
    );
  }
}

async function getActiveChannel(
  targetMember: GuildMember,
): Promise<TextChannel | null> {
  const timeInterval = 15 * 60 * 1000;
  const cutoff = Date.now() - timeInterval;
  const msgAmount = 5;
  const userId = targetMember.id;

  const guild = await client.guilds.fetch(guildId);

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
) {
  // check if member is connected to channel
  const channel = targetMember.voice.channel;
  if (!channel) return;
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + durationMinutes * 60000);

  const embed = muteEmbed(
    targetMember,
    mutingMember,
    createdAt,
    expiresAt,
    reason,
  );

  channel.send({ embeds: [embed] });
}
