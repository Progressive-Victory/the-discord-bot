import {
  SettingsResponse,
  zSettingsResponse,
} from "@/contracts/responses/SettingsResponse.js";
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
import { Routes } from "../../Classes/API/ApiConnService/routes.js";
import { ChatInputCommand } from "../../Classes/index.js";
import { apiConnService } from "../../util/api/pvapi.js";
import { getGuildChannel } from "../../util/index.js";

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
          { name: "3 min", value: 3 },
          { name: "10 min", value: 10 },
          { name: "30 min", value: 30 },
          { name: "1 hr", value: 60 },
          { name: "6 hr", value: 60 * 6 },
          { name: "1 day", value: 60 * 24 },
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

    if (!targetMember.voice.channel)
      return interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "User is not in a vc.",
      });

    // and for how long
    const durationMinutes = interaction.options.getInteger("duration", true);
    const reason = interaction.options.getString("reason", true);

    // set mute to true
    targetMember.voice.setMute(true, reason);

    // set timeout to revert mute
    setTimeout(() => {
      if (targetMember.voice.serverMute)
        targetMember.voice.setMute(false, "Mute Time Elapsed");
    }, durationMinutes * 60000);

    const endDate = new Date(new Date().getTime() + durationMinutes * 60000);

    // Message to be sent to channels
    vcMessage(targetMember, mutingMember, durationMinutes);
    logMessage(targetMember, mutingMember, durationMinutes, reason);

    interaction.reply({
      content: `${targetMember.toString()} has been server muted. They will be unmuted ${time(endDate, TimestampStyles.RelativeTime)}`,
      flags: MessageFlags.Ephemeral,
    });
  },
});

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
) {
  // check if log channel is set
  const res = await apiConnService.get<SettingsResponse>(
    Routes.setting("timeout_log_channel_id"),
    zSettingsResponse,
  );

  const timeoutLogChannelId = res.data;
  if (timeoutLogChannelId) return;

  // check that channel is real
  const timeoutChannel = await getGuildChannel(
    targetMember.guild,
    timeoutLogChannelId,
  );
  if (!timeoutChannel?.isSendable()) return;

  const title = "User Muted";
  const description = `${targetMember.toString()} was muted by ${mutingMember.toString()}`;
  const avatarURL = targetMember.displayAvatarURL({ forceStatic: true });

  const embed = new EmbedBuilder()
    .setAuthor({ iconURL: avatarURL, name: title })
    .setDescription(description)
    .addFields(
      { name: "Duration", value: `${durationMinutes} minutes` },
      { name: "Reason", value: reason },
    )
    .setTimestamp()
    .setFooter({ text: `User ID: ${targetMember.id}` })
    .setColor(MUTE_COLOR);

  // send to channel
  timeoutChannel.send({ embeds: [embed] });
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
 */
function vcMessage(
  targetMember: GuildMember,
  mutingMember: GuildMember,
  durationMinutes: number,
) {
  // check if member is connected to channel
  const channel = targetMember.voice.channel;
  if (!channel) return;

  const text = new TextDisplayBuilder().setContent(
    [
      `${targetMember.toString()} was muted for ${durationText[durationMinutes.toString() as dTime]}`,
    ].join("\n"),
  );
  const separator = new SeparatorBuilder()
    .setDivider(true)
    .setSpacing(SeparatorSpacingSize.Small);
  const footer = new TextDisplayBuilder().setContent(
    subtext(`User ID: ${targetMember.id}`),
  );

  const container = new ContainerBuilder()
    .addTextDisplayComponents(text)
    .addSeparatorComponents(separator)
    .addTextDisplayComponents(footer)
    .setAccentColor(MUTE_COLOR);

  channel.send({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  });
}
