import {
  ColorResolvable,
  Colors,
  EmbedBuilder,
  GuildMember,
  inlineCode,
  TimestampStyles,
} from "discord.js";
import { getAuthorOptions, reasonField, userField } from "./moderation/embeds";

const muteEmbedColor: ColorResolvable = Colors.Aqua;

/**
 * @param target - The target of the mute
 * @param executor - The creator of the Mute
 * @param createdAt - When the mute was created
 * @param expiresAt - When the mute will expire
 * @param reason - The reason for the mute
 * @returns an {@link EmbedBuilder} to notify the `executor` that the `target` was timed out
 */
export function muteEmbed(
  target: GuildMember,
  executor: GuildMember,
  createdAt: Date,
  expiresAt: Date,
  reason: string = "No Reason Given",
) {
  return new EmbedBuilder()
    .setTitle("Mute")
    .setAuthor(getAuthorOptions(executor))
    .setThumbnail(target.displayAvatarURL({ forceStatic: true }))
    .setDescription(
      `${target} ${inlineCode(target.user.username)} was muted until ${expiresAt.toDiscordString(TimestampStyles.LongDateTime)}`,
    )
    .setFields(reasonField(reason), userField("Action By", executor.user))
    .setTimestamp(createdAt)
    .setColor(muteEmbedColor);
}
