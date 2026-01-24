import {
  ColorResolvable,
  Colors,
  EmbedBuilder,
  GuildMember,
  inlineCode,
  TimestampStyles,
} from "discord.js";
import { getAuthorOptions, reasonField, userField } from "./moderation/embeds";

const timeoutEmbedColor: ColorResolvable = Colors.LuminousVividPink;

/**
 * @param target - The target of the timeout
 * @param executor - The creator of the timeout
 * @param createdAt - When the timeout was created
 * @param expiresAt - When the timeout will expire
 * @param reason - The reason for the timeout
 * @returns an {@link EmbedBuilder} to notify the `executor` that the `target` was timed out
 */
export function timeoutEmbed(
  target: GuildMember,
  executor: GuildMember,
  createdAt: Date,
  expiresAt: Date,
  reason: string = "No Reason Given",
) {
  return new EmbedBuilder()
    .setTitle("Timeout")
    .setAuthor(getAuthorOptions(executor))
    .setThumbnail(target.displayAvatarURL({ forceStatic: true }))
    .setDescription(
      `${target} ${inlineCode(target.user.username)} was timed out until ${expiresAt.toDiscordString(TimestampStyles.LongDateTime)}`,
    )
    .setFields(reasonField(reason), userField("Action By", executor.user))
    .setTimestamp(createdAt)
    .setColor(timeoutEmbedColor);
}
