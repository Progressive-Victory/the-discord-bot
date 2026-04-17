import {
  codeBlock,
  ColorResolvable,
  EmbedBuilder,
  GuildMember,
  TimestampStyles,
} from "discord.js";
import { getAuthorOptions } from "./moderation/embeds";

/**
 * @param member - The member to display the information of
 * @param colors - The color of the embed
 * @returns an embed that displays information about the member
 */
export function memberInspectEmbed(
  member: GuildMember,
  colors: ColorResolvable,
) {
  const iconURL = member.displayAvatarURL();
  return new EmbedBuilder()
    .setAuthor(getAuthorOptions(member, { forceStatic: true, size: 4096 }))
    .setThumbnail(iconURL)
    .setColor(colors)
    .setFields(
      {
        name: "Display name:",
        value: codeBlock(member.displayName),
        inline: true,
      },
      {
        name: "Username:",
        value: codeBlock(member.user.username),
        inline: true,
      },
      { name: "User ID:", value: codeBlock(member.id), inline: true },
      {
        name: "Created at:",
        value: member.user.createdAt.toDiscordString(
          TimestampStyles.LongDateTime,
        ),
        inline: true,
      },
      {
        name: "Joined at:",
        value: member.joinedAt!.toDiscordString(TimestampStyles.LongDateTime),
        inline: true,
      },
    )
    .setImage(
      member.bannerURL({ forceStatic: true }) ??
        member.user.bannerURL({ forceStatic: true }) ??
        null,
    );
}
