import {
  APIMessageTopLevelComponent,
  ChatInputCommandInteraction,
  JSONEncodable,
  MessageFlags,
  GuildMember,
  User,
  ContainerBuilder,
  resolveColor,
  calculateUserDefaultAvatarIndex,
  heading,
  subtext,
  inlineCode,
  time,
  bold,
  userMention,
  TimestampStyles,
  SeparatorSpacingSize,
  HeadingLevel,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from "discord.js";
import { Routes } from "../../../Classes/API/ApiConnService/routes.js";
import { APIWarnPage } from "../../../Classes/API/ApiConnService/types.js";
import { viewPageRow } from "../../../features/moderation/warn-render.js";
import { apiConnService } from "../../../util/api/pvapi.js";
import { Warn } from "../../../Classes/API/Warn.js";
import { WarnEmbedColor } from "../../../features/moderation/types.js";

export async function view(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
    // withResponse: true,
  });
  if (!interaction.inCachedGuild()) return;

  const mod = interaction.options.getUser("moderator");
  const target = interaction.options.getUser("recipient");
  const monthsAgo = interaction.options.getInteger("scope") ?? 0;
  const order = interaction.options.getString("order") ?? "desc";

  const timeWindowDate = new Date(Date.now() - monthsAgo * 2592000000);
  const query = new URLSearchParams();

  if (mod) query.set("mod_discord_id", mod.id);
  if (target) query.set("tgt_discord_id", target.id);
  if (monthsAgo > 0) query.set("time_window", timeWindowDate.toISOString());
  query.set("sort", order);
  query.set("limit", String(3));

  const page = (await apiConnService.get(Routes.discordWarns, {
    query,
  })) as APIWarnPage;

  // console.log(page);
  const components: JSONEncodable<APIMessageTopLevelComponent>[] =
    page.data.map((data) => {
      const record = new Warn(apiConnService, data);
      const color = resolveColor(
        record.expiresAt > new Date()
          ? WarnEmbedColor.Active
          : WarnEmbedColor.Inactive,
      );

      const target =
        interaction.guild?.members.cache.get(record.targetId) ??
        interaction.client.users.cache.get(record.targetId);
      const moderator =
        interaction.guild?.members.cache.get(record.moderatorId) ??
        interaction.client.users.cache.get(record.moderatorId);

      const targetName =
        target instanceof GuildMember
          ? (target.nickname ?? target.displayName)
          : target instanceof User
            ? target.displayName
            : "[Deleted User]";
      const moderatorName =
        moderator instanceof GuildMember
          ? (moderator.nickname ?? moderator.displayName)
          : moderator instanceof User
            ? moderator.displayName
            : "[Deleted User]";

      return new ContainerBuilder()
        .setAccentColor(color)
        .addSectionComponents((top) =>
          top
            .setThumbnailAccessory((pfp) =>
              pfp.setURL(
                interaction.guild?.members.cache
                  .get(record.targetId)
                  ?.displayAvatarURL({ forceStatic: false }) ??
                  interaction.client.users.cache
                    .get(record.targetId)
                    ?.displayAvatarURL({ forceStatic: false }) ??
                  interaction.client.rest.cdn.defaultAvatar(
                    calculateUserDefaultAvatarIndex(record.targetId),
                  ),
              ),
            )
            .addTextDisplayComponents((text) =>
              text.setContent(
                `${heading(`Warning # ${record.id}`)}
${bold("Target")}:			${inlineCode(targetName) + " " + userMention(record.targetId)}
${bold("Moderator")}:	${inlineCode(moderatorName) + " " + userMention(record.moderatorId)}
${bold("Issued")}:			${time(record.createdAt, TimestampStyles.LongDateTime)}
${bold("Expires")}:		  ${time(record.expiresAt, TimestampStyles.LongDateTime)}`,
              ),
            ),
        )
        .addSeparatorComponents((space) =>
          space.setDivider(false).setSpacing(SeparatorSpacingSize.Small),
        )
        .addTextDisplayComponents((reason) =>
          reason.setContent(
            `${heading("Reason", HeadingLevel.Three)}\n${record.reason}`,
          ),
        )
        .addSeparatorComponents((line) =>
          line.setDivider(true).setSpacing(SeparatorSpacingSize.Large),
        )
        .addTextDisplayComponents((text) =>
          text.setContent(subtext(`Last Updated: ${time(record.updatedAt)}`)),
        )
        .addActionRowComponents((action) =>
          action.addComponents(
            new ButtonBuilder()
              .setCustomId(`warn view ${record.id}`)
              .setLabel("View Full")
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`warn end ${record.id}`)
              .setLabel("End")
              .setStyle(ButtonStyle.Danger),
          ),
        );
    });

  const pageRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setDisabled(page.page <= 0)
      .setCustomId(`warn page ${page.count - 1}`)
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setDisabled(true)
      .setCustomId("Button does not use ID")
      .setLabel(
        `${page.page + 1}\\${Math.ceil(page.count / page.limit).toString()}`,
      )
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setDisabled(page.page < 0)
      .setCustomId(`warn page ${page.count + 1}`)
      .setEmoji("➡️")
      .setStyle(ButtonStyle.Secondary),
  );
  interaction.editReply({
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    components: components.toReversed().concat(viewPageRow(page)),
    allowedMentions: {},
  });
}
