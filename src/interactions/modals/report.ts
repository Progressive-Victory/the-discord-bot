import { Routes } from "@/Classes/API/ApiConnService/routes";
import { Interaction } from "@/Classes/Interaction";
import {
  SettingsResponse,
  zSettingsResponse,
} from "@/contracts/responses/SettingsResponse";
import { getAuthorOptions } from "@/features/moderation/embeds";
import {
  messageReportColor,
  reportModalPrefix,
  userReportColor,
} from "@/features/report";
import { getGuildChannel, getMember } from "@/util";
import { apiConnService } from "@/util/api/pvapi";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  GuildMember,
  inlineCode,
  MessageFlags,
  ModalSubmitInteraction,
} from "discord.js";

/**
 * `userReport` is a modal interaction which allows users to report other users. It:
 * <ul>
 *     <li>Sends an audit log to the report audit logging channel if one exists</li>
 *     <li>Notifies the reporter that their report has been received</li>
 * </ul>
 */
export const userReport = new Interaction<ModalSubmitInteraction>({
  customIdPrefix: reportModalPrefix.userReport,

  run: async (interaction) => {
    if (!interaction.inGuild()) return;

    const { guild, customId, client, member } = interaction;

    const targetId = customId.split(client.splitCustomIdOn!)[1];
    if (!guild) return;
    const target = await getMember(guild, targetId);

    if (!target) return;

    const reporter =
      member instanceof GuildMember
        ? member
        : await getMember(guild, member.user.id);
    if (!reporter) return;

    const res = await apiConnService.get<SettingsResponse>(
      Routes.setting("report_log_channel_id"),
      zSettingsResponse,
    );

    const logChannelId = res.data;
    const comment = interaction.fields.getTextInputValue("comment");

    if (logChannelId) {
      const logChannel = await getGuildChannel(guild, logChannelId);
      if (!logChannel?.isSendable()) return;
      logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("User Report")
            .setDescription(`${target} was reported by ${interaction.member}`)
            .setFields({
              name: "Comment",
              value: comment.length === 0 ? "No comment provided" : comment,
            })
            .setAuthor(getAuthorOptions(target))
            .setColor(userReportColor),
        ],
      });
    }

    interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Your report has been received and will be reviewed. Thank you",
    });
  },
});

/**
 * `userReport` is a modal interaction which allows users to report messages. It:
 * <ul>
 *     <li>Sends an audit log to the report audit logging channel if one exists</li>
 *     <li>Notifies the reporter that their report has been received</li>
 * </ul>
 */
export const messageReport = new Interaction<ModalSubmitInteraction>({
  customIdPrefix: reportModalPrefix.messageReport,

  run: async (interaction) => {
    if (!interaction.inGuild()) return;

    const { guild, customId, client, member } = interaction;

    const channelId = customId.split(client.splitCustomIdOn!)[1];
    if (!guild) return;

    const channel = await getGuildChannel(guild, channelId);
    if (!channel?.isSendable()) return;

    const messageId = customId.split(client.splitCustomIdOn!)[2];
    const message =
      channel.messages.cache.get(messageId) ??
      (await channel.messages.fetch(messageId)) ??
      undefined;
    if (!message) return;

    const author =
      message.member ?? (await getMember(guild, message.author.id));

    if (!author) return;

    const reporter =
      member instanceof GuildMember
        ? member
        : await getMember(guild, member.user.id);

    if (!reporter) return;

    const res = await apiConnService.get<SettingsResponse>(
      Routes.setting("report_log_channel_id"),
      zSettingsResponse,
    );

    const logChannelId = res.data;
    const comment = interaction.fields.getTextInputValue("comment");

    if (logChannelId) {
      const logChannel = await getGuildChannel(guild, logChannelId);
      if (!logChannel?.isSendable()) return;
      const embed = new EmbedBuilder()
        .setTitle("Message Report")
        .setDescription(
          `${author}'s message was reported by ${interaction.member}`,
        )
        .setAuthor(getAuthorOptions(author))
        .setColor(messageReportColor);

      if (message.content.length > 0) {
        embed.addFields({
          name: "Message Content",
          value: message.content,
        });
      }
      if (message.attachments.size > 0) {
        embed.addFields({
          name: "attachments",
          value: `Message has ${inlineCode(message.attachments.size.toString())} attachments`,
        });
      }

      embed.addFields({
        name: "Comment",
        value: comment.length === 0 ? "No comment provided" : comment,
      });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setURL(message.url)
          .setLabel("Jump to Message"),
      );

      logChannel.send({
        embeds: [embed],
        components: [row],
      });
    }

    interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Your report has been received and will be reviewed. Thank you",
    });
  },
});
