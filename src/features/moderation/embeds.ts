import {
  APIEmbedField,
  ColorResolvable,
  EmbedAuthorOptions,
  EmbedBuilder,
  EmbedFooterOptions,
  Guild,
  GuildMember,
  ImageURLOptions,
  inlineCode,
  Snowflake,
  TimestampStyles,
  User,
} from "discord.js";
import { APIWarn } from "../../Classes/API/ApiConnService/types.js";
import { client } from "../../index.js";
import { getMember } from "../../util/index.js";
import { numberOfWarnEmbedsOnPage, WarnEmbedColor } from "./types.js";

/**
 * Utility to create an embed for a moderator creating a new warning
 * @param record - The {@link WarningRecord} corresponding to the newly created warning
 * @param moderator - The metadata for the mod
 * @param target - The metadata for the user being warned
 * @returns the created new warning {@link EmbedBuilder}
 */
export function newWarnModEmbed(
  record: APIWarn,
  moderator: GuildMember,
  target: GuildMember,
) {
  const embed = new EmbedBuilder()
    .setTitle("Warning Issued")
    .setColor(WarnEmbedColor.updated)
    .setThumbnail(target.displayAvatarURL({ forceStatic: true }))
    .setFields(
      reasonField(record.reason),
      userField("Member", target.user),
      // userField('Moderator', moderator.user),
      expireAtField(record),
    )
    .setFooter(documentIdFooter(record));
  return embed;
}

/**
 * Utility to create an embed for a user updating warning
 * @param record - The {@link WarningRecord} corresponding to the warning being updated
 * @param moderator - The metadata for the mod who created the warning
 * @param target - The metadata for the user being warned
 * @param updater - The metadata for the user updating the warning
 * @returns the created warning update {@link EmbedBuilder}
 */
export function warnLogUpdateEmbed(
  record: APIWarn,
  moderator: GuildMember,
  target: GuildMember,
  updater: GuildMember,
) {
  const embed = new EmbedBuilder()
    .setTitle("Warning updated")
    .setColor(WarnEmbedColor.issued)
    // .setThumbnail(target.displayAvatarURL({forceStatic: true}))
    .setFields(
      reasonField(record.reason),
      userField("Member", target.user),
      userField("Moderator", moderator.user),
      userField("Updated By", updater.user),

      expireAtField(record),
    )
    .setFooter(documentIdFooter(record))
    .setTimestamp()
    .setAuthor(getAuthorOptions(target));
  return embed;
}

/**
 * Utility to create an embed when a warning is updated
 * @param record - the {@link WarningRecord} corresponding to the updated warning
 * @param target - the {@link GuildMember} to whom the warning was issued
 * @returns the created {@link EmbedBuilder}
 */
export function warnIssueUpdateEmbed(record: APIWarn, target: GuildMember) {
  const embed = new EmbedBuilder()
    .setTitle("Warning updated")
    .setColor(WarnEmbedColor.updated)
    .setThumbnail(target.displayAvatarURL({ forceStatic: true }))
    .setFields(
      reasonField(record.reason),
      userField("Member", target.user),
      // userField('Moderator', moderator.user),
      expireAtField(record),
    )
    .setFooter(documentIdFooter(record));
  return embed;
}

/**
 * Embed sent to recipient of a warning over DM
 * @param record - document of a warning
 * @param count - the number of active warnings
 * @param guild - guild where warning was issued
 * @returns the created {@link EmbedBuilder}
 */
export function newWarningDmEmbed(
  record: APIWarn,
  count: number,
  guild: Guild,
) {
  return new EmbedBuilder()
    .setTitle("You Have Received a Warning")
    .setColor(WarnEmbedColor.updated)
    .addFields(
      reasonField(record.reason, "Reason for this warning"),
      activeWarningCountField(count),
    )
    .setAuthor({
      name: guild.name,
      iconURL: guild.iconURL({ forceStatic: true }) ?? undefined,
    })
    .setFooter(documentIdFooter(record));
}

/**
 * @param record - The {@link WarningRecord} for the newly created warning
 * @param moderator - The moderator who authored the warning
 * @param target - The target of the warning
 * @returns an {@link EmbedBuilder} that acts as a notification that the warning was created
 */
export function newWarningLogEmbed(
  record: APIWarn,
  moderator: GuildMember,
  target: GuildMember,
) {
  const embed = new EmbedBuilder()
    .setTitle("Warning Issued")
    .setColor(WarnEmbedColor.updated)
    .setAuthor(getAuthorOptions(moderator))
    .setThumbnail(target.displayAvatarURL({ forceStatic: true }))
    .setFields(
      reasonField(record.reason),
      userField("Member", target.user),
      userField("Moderator", moderator.user),
      expireAtField(record),
    )
    .setFooter(documentIdFooter(record))
    .setTimestamp(new Date(record.createdAtUtc));
  return embed;
}

/**
 * Render records to an array of embed
 * @param records - Array of Warn documents from search
 * @param isMod - flag for if request is from a mod
 * @param start - The idex location of were to start
 * @returns Array of EmbedBuilders
 */
export async function viewWarningEmbeds(
  guildId: Snowflake,
  records: APIWarn[],
  isMod: boolean,
  start: number = 0,
) {
  const embeds: EmbedBuilder[] = [];
  // start indexing at start
  // Continue while number of embeds is less than numberOfWarnEmbedsOnPage and index is less than the warning documents
  // then increases index by one
  for (
    let index = start;
    embeds.length < numberOfWarnEmbedsOnPage && index < records.length;
    index++
  ) {
    // get record located at index
    const record = records[index];

    // Embed color based on the status of the warning
    const color =
      new Date(record.expiresAtUtc) > new Date()
        ? WarnEmbedColor.Active
        : WarnEmbedColor.Inactive;

    // Render embed
    const embed = await viewWarningEmbed(guildId, record, isMod, color);

    // If embed is undefined is is not added to the embeds array
    if (!embed) continue;
    embeds.push(embed);
  }

  return embeds;
}

/**
 * Render warning embed
 * @param record - Warning document
 * @param isMod - whether
 * @param embedColor - color of the embed
 * @returns EmbedBuilder or undefined
 */
export async function viewWarningEmbed(
  guildId: Snowflake,
  record: APIWarn,
  isMod: boolean,
  embedColor: ColorResolvable = WarnEmbedColor.updated,
) {
  // Get guild from cache or fetch
  const guild =
    client.guilds.cache.get(guildId) ??
    (await client.guilds.fetch(guildId).catch(console.error));
  if (!guild) return;

  const embed = new EmbedBuilder()
    .addFields(reasonField(record.reason))
    .setColor(embedColor)
    .setFooter(documentIdFooter(record));
  if (isMod) {
    // Get target from cache or fetch
    const target = await getMember(guild, record.userWarnedDiscordId);

    // Get moderator from cache or fetch
    const moderator = await getMember(guild, record.moderatorDiscordId);

    const targetFieldName = "Member";

    // Check if target present if target is not present uses username from warning document
    if (!target)
      embed.addFields(userField(targetFieldName, record.userWarnedDiscordId));
    // if target is present use GuildMember for username and avatar
    else
      embed
        .addFields(userField(targetFieldName, target.user))
        // If user does not have a server avatar try user avatar
        .setThumbnail(target.displayAvatarURL({ forceStatic: true }));

    const moderatorFieldName = "Moderator";

    // Check if target present if moderator is not present uses username from warning document
    if (!moderator)
      embed.addFields(userField(moderatorFieldName, record.moderatorDiscordId));
    // if moderator is present use GuildMember for username
    else embed.addFields(userField(moderatorFieldName, moderator.user));
  }
  embed
    .addFields(expireAtField(record))
    .setTimestamp(new Date(record.createdAtUtc));
  embed.setTimestamp(new Date(record.createdAtUtc));

  return embed;
}

/**
 * Text for footed of embed
 * @param record - Warning record
 * @returns footer option
 */
export function documentIdFooter(record: APIWarn): EmbedFooterOptions {
  return { text: `Warn ID: ${record.id}` };
}

/**
 * @param record - Warning document
 * @param inline - whether the embed field is inline
 * @returns an embed field showing the time until a warning expires
 */
export function expireAtField(
  record: APIWarn,
  inline: boolean = false,
): APIEmbedField {
  return {
    name: "Remaining Time",
    value: `Expire ${new Date(record.expiresAtUtc).toDiscordString(TimestampStyles.RelativeTime)} On ${new Date(record.expiresAtUtc).toDiscordString(TimestampStyles.LongDate)}`,
    inline,
  };
}

/**
 * @param user - a Discord user
 * @param name - a name for the user, typically their role (Moderator, Member)
 * @param inline - whether the embed field should be inline
 * @returns an embed field containing information about the user
 */
export function userField(
  name: string,
  user: User | string,
  inline: boolean = true,
): APIEmbedField {
  let value: string;

  if (typeof user === "string") {
    value = user;
  } else {
    value = `${user.toString()}\n${user.username}`;
  }

  return { name, value, inline };
}

/**
 * @param reason - the reason for the warning
 * @param title - the title of the embed field
 * @param inline - whether the embed field should be inlined
 * @returns an embed field containing information about the reason for a warning
 */
export function reasonField(
  reason: string,
  title?: string,
  inline: boolean = false,
): APIEmbedField {
  return {
    name: title ?? "Reason",
    value: reason,
    inline,
  };
}

/**
 * @param count - the number of active warnings
 * @param inline - whether the embed field should be inlined
 * @returns an embed field containing information about the number of active warnings
 */
function activeWarningCountField(
  count: number,
  inline: boolean = false,
): APIEmbedField {
  return {
    name: "Active warnings",
    value: `You have ${inlineCode(count.toString())} active Warnings`,
    inline,
  };
}

/**
 * get the URL for the avatar of a guild member
 * @param member - the member to get the avatar of
 * @param imageOptions - additional options for the image
 * @returns URL of the image
 */
export function getAuthorOptions(
  member: GuildMember,
  imageOptions: ImageURLOptions = { forceStatic: true },
): EmbedAuthorOptions {
  return {
    name: member.displayName,
    iconURL: member.displayAvatarURL(imageOptions),
  };
}
