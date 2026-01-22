import {
  DiscordAPIError,
  Events,
  GuildMember,
  inlineCode,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import { Routes } from "../../Classes/API/ApiConnService/routes.js";
import { ChatInputCommand } from "../../Classes/index.js";
import { timeoutEmbed } from "../../features/timeout.js";
import { localize } from "../../i18n.js";
import { apiConnService } from "../../util/api/pvapi.js";
import { getGuildChannel, isGuildMember } from "../../util/index.js";

export const ns = "timeout";

const durationText = {
  "60": "60 secs",
  "300": "5 mins",
  "600": "10 mins",
  "1800": "30 mins",
  "3600": "1 hour",
  "7200": "2 hours",
  "21600": "6 hours",
  "43200": "12 hours",
  "86400": "1 Day",
  "259200": "3 Days",
  "604800": "1 week",
};
type durationValue =
  | "60"
  | "300"
  | "600"
  | "1800"
  | "3600"
  | "7200"
  | "21600"
  | "43200"
  | "86400"
  | "259200"
  | "604800";

/**
 * The `timeout` mod command allows moderators to time out a member for a specified duration
 */
export const timeout = new ChatInputCommand()
  .setBuilder((builder) =>
    builder
      .setName("timeout")
      .setDescription("Custom Timeout Command")
      // .setNameLocalizations(localize.discordLocalizationRecord('name', ns))
      // .setNameLocalizations(localize.discordLocalizationRecord('description', ns))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .setContexts(InteractionContextType.Guild)
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("The user to timeout")
          // .setNameLocalizations(localize.discordLocalizationRecord('option_member_name', ns))
          // .setNameLocalizations(localize.discordLocalizationRecord('option_member_description', ns))
          .setRequired(true),
      )
      .addNumberOption((option) =>
        option
          .setName("duration")
          .setDescription("How long the member should be timed out for")
          // .setNameLocalizations(localize.discordLocalizationRecord('option_duration_name', ns))
          // .setNameLocalizations(localize.discordLocalizationRecord('option_duration_description', ns))
          .setRequired(true)
          .setChoices(
            { name: "60 secs", value: 60 },
            { name: "5 mins", value: 300 },
            { name: "10 mins", value: 600 },
            { name: "30 mins", value: 1800 },
            { name: "1 hour", value: 3600 },
            { name: "2 hours", value: 7200 },
            { name: "6 hours", value: 21600 },
            { name: "12 hours", value: 43200 },
            { name: "1 Day", value: 86400 },
            { name: "3 Days", value: 259200 },
            { name: "1 week", value: 604800 },
          ),
      )
      .addStringOption((option) =>
        option
          .setName("reason")
          .setDescription("The reason for timing them out")
          // .setNameLocalizations(localize.discordLocalizationRecord('option_reason_name', ns))
          // .setNameLocalizations(localize.discordLocalizationRecord('option_reason_description', ns))
          .setRequired(false),
      ),
  )
  .setExecute(async (interaction) => {
    const { options, locale, user, guild, member } = interaction;

    let target = options.getMember("user");

    if (!isGuildMember(target)) {
      interaction.client.emit(
        Events.Error,
        Error(
          "received APIInteractionDataResolvedGuildMember when expecting guild member",
        ),
      );
      return interaction.reply({
        content: localize.t("reply_error", ns, locale),
        flags: MessageFlags.Ephemeral,
      });
    }

    const reason = options.getString("reason", false) ?? "No reason given";
    const duration = options.getNumber("duration", true);
    // const endNumber = Math.floor(new Date().getTime() / 1000) + duration;
    interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      target = await target.timeout(
        duration * 1000,
        `Member was timed out by ${user.username} for ${reason}`,
      );
    } catch (error) {
      if (!(error instanceof DiscordAPIError)) throw error;
      await interaction.editReply({
        content: `Command could not be completed because: ${inlineCode(error.message)}`,
      });
      return;
    }

    interaction.editReply({
      content: localize.t("reply_timeout", ns, locale, {
        member: target.toString(),
        endDate: durationText[duration.toString() as durationValue],
      }),
    });

    const timeoutLogChannelId = (await apiConnService.get(
      Routes.setting("timeout_log_channel_id"),
    )) as string;
    if (timeoutLogChannelId || !guild) return;

    const timeoutChannel = await getGuildChannel(guild, timeoutLogChannelId);

    if (!timeoutChannel?.isSendable() || !(member instanceof GuildMember))
      return;

    const embed = timeoutEmbed(
      target,
      member,
      new Date(),
      target.communicationDisabledUntil!,
      reason,
    );

    timeoutChannel.send({ embeds: [embed] });
  });
