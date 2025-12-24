import {
  calculateUserDefaultAvatarIndex,
  ChatInputCommandInteraction,
  ContainerBuilder,
  DiscordAPIError,
  MessageFlags,
  resolveColor,
  RESTJSONErrorCodes,
  SeparatorSpacingSize,
  subtext,
  time,
  userMention,
} from "discord.js";
import { Routes } from "../../../Classes/API/ApiConnService/routes.js";
import { WarnPage } from "../../../Classes/API/ApiConnService/types.js";
import { Warn } from "../../../Classes/API/Warn.js";
import { WarnEmbedColor } from "../../../features/moderation/types.js";
import { apiConnService } from "../../../util/api/pvapi.js";

export async function view(interaction: ChatInputCommandInteraction) {
  
  const mod = interaction.options.getUser("moderator");
  const target = interaction.options.getUser("recipient");
  const monthsAgo = interaction.options.getInteger("scope") ?? 0;

  const timeWindowDate = new Date(Date.now() - monthsAgo * 2592000000);
  const query = new URLSearchParams();

  if (mod) query.set("mod_discord_id", mod.id);
  if (target) query.set("tgt_discord_id", target.id);
  if (monthsAgo > 0) query.set("time_window", timeWindowDate.toISOString());
  query.set("limit", String(3));

  const page = (await apiConnService.get(Routes.discordWarns, {
    query,
  })) as WarnPage;

  for (let index = 0; index < page.limit; index++) {
    const id = page.data[index].userWarnedDiscordId;
    await interaction.guild?.members.fetch(id).catch(async (e) => {
      if (
        !(e instanceof DiscordAPIError) ||
        e.code !== RESTJSONErrorCodes.UnknownMember
      )
        throw e;
      await interaction.client.users.fetch(id);
    });
  }
  const containers = page.data.map((data) => {
    const record = new Warn(apiConnService, data);
    const color = resolveColor(
      record.expiresAt > new Date()
        ? WarnEmbedColor.Active
        : WarnEmbedColor.Inactive,
    );
    return new ContainerBuilder()
      .setAccentColor(color)
      .addSectionComponents((top) =>
        top
          .setThumbnailAccessory((pfp) =>
            pfp.setURL(
              interaction.guild?.members.cache
                .get(record.targetId)
                ?.displayAvatarURL({ forceStatic: true }) ??
                interaction.client.users.cache
                  .get(record.targetId)
                  ?.displayAvatarURL({ forceStatic: true }) ??
                interaction.client.rest.cdn.defaultAvatar(
                  calculateUserDefaultAvatarIndex(record.targetId),
                ),
            ),
          )
          .addTextDisplayComponents((text) =>
            text.setContent(
              `Target: ${userMention(record.targetId)}\nMod: ${userMention(record.moderatorId)}\nReason: ${record.reason}`,
            ),
          ),
      )
      .addTextDisplayComponents()
      .addSeparatorComponents((line) =>
        line.setDivider(true).setSpacing(SeparatorSpacingSize.Large),
      )
      .addTextDisplayComponents((text) =>
        text.setContent(subtext(`Last Updated: ${time(record.updatedAt)}`)),
      );
  });

  interaction.editReply({
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    components: containers,
    allowedMentions: {},
  });
}
