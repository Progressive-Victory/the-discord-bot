import {
  APIMessageTopLevelComponent,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Colors,
  ContainerBuilder,
  HeadingLevel,
  JSONEncodable,
  SeparatorSpacingSize,
  Snowflake,
  bold,
  calculateUserDefaultAvatarIndex,
  heading,
  inlineCode,
  subtext,
  time,
} from "discord.js";
import { APIWarn } from "../../Classes/API/ApiConnService/index.js";
import { WarnSearch } from "../../Classes/API/ApiConnService/WarnSearchmanager.js";
import { Warn } from "../../Classes/API/Warn.js";
import { apiConnService } from "../../util/api/pvapi.js";
import { fetchMemberOrUser, getNameToDisplay } from "../../util/index.js";

export async function warnPage(client: Client, search: WarnSearch) {
  const components: JSONEncodable<APIMessageTopLevelComponent>[] =
    await Promise.all(
      search.currentPageWarns.map((warn) =>
        warnContainer(client, warn, search.id),
      ),
    );
  return components.toReversed().concat(viewPageRow(search));
}

export async function warnContainer(
  client: Client,
  warn: APIWarn,
  searchId: Snowflake,
) {
  const guild = client.guilds.cache.get(process.env.PV_GUILD_ID!)!;
  const record = new Warn(apiConnService, warn);

  // color of the container
  const color = Colors.Red;

  // member or user of related to the action
  const [target, moderator] = await Promise.all([
    fetchMemberOrUser(record.targetId, guild),
    fetchMemberOrUser(record.moderatorId, guild),
  ]);

  // if name is too long shorten it
  const printableReason =
    record.reason.length >= 1000
      ? record.reason.substring(0, 997).concat("...")
      : record.reason;

  return (
    new ContainerBuilder()
      .setAccentColor(color)
      .addSectionComponents((top) =>
        top
          .setThumbnailAccessory((pfp) =>
            pfp.setURL(
              guild.members.cache
                .get(record.targetId)
                ?.displayAvatarURL({ forceStatic: false }) ??
                client.users.cache
                  .get(record.targetId)
                  ?.displayAvatarURL({ forceStatic: false }) ??
                client.rest.cdn.defaultAvatar(
                  calculateUserDefaultAvatarIndex(record.targetId),
                ),
            ),
          )
          .addTextDisplayComponents((text) =>
            text.setContent(
              [
                heading(`Member Warn`),
                `${bold("Member")}:		${[target.toString(), inlineCode(getNameToDisplay(target))].join(" ")}`,
                `${bold("Moderator")}:	${[moderator.toString(), inlineCode(getNameToDisplay(moderator))].join(" ")}`,
              ].join("\n"),
            ),
          ),
      )
      // .addSeparatorComponents((space) =>
      //   space.setDivider(true).setSpacing(SeparatorSpacingSize.Large),
      // )
      .addTextDisplayComponents((reason) =>
        reason.setContent(
          `${heading("Reason", HeadingLevel.Three)}\n${printableReason}`,
        ),
      )
      .addSeparatorComponents((line) =>
        line.setDivider(true).setSpacing(SeparatorSpacingSize.Small),
      )
      .addSectionComponents((footer) =>
        footer
          .addTextDisplayComponents((text) =>
            text.setContent(
              [
                `Last Updated: ${time(record.updatedAt)}`,
                // `Discord Id:	${record.targetId}`,
              ]
                .map(subtext)
                .join("\n"),
            ),
          )
          .setButtonAccessory((view) =>
            view
              .setCustomId(`wv_${record.id}_${searchId}`)
              .setLabel(`View Warn`)
              .setStyle(ButtonStyle.Primary),
          ),
      )
  );
}

export function viewPageRow(search: WarnSearch) {
  const { totalWarns, page, limit, id } = search;
  const totalPages = Math.ceil((totalWarns ?? 0) / limit!);
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setDisabled(page! <= 0)
      .setCustomId(`wp_${id}_l`)
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setDisabled(true)
      .setCustomId("Button does not use ID")
      .setLabel(`${page! + 1}\\${totalPages}`)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setDisabled(totalPages <= page! + 1)
      .setCustomId(`wp_${id}_n`)
      .setEmoji("➡️")
      .setStyle(ButtonStyle.Secondary),
  );
}

export async function soloWarn(
  searchId: string,
  warn: APIWarn,
  client: Client,
) {
  const guild = client.guilds.cache.get(process.env.PV_GUILD_ID!)!;
  const record = new Warn(apiConnService, warn);

  // color of the container
  const color = Colors.Red;

  // member or user of related to the action
  const [target, moderator] = await Promise.all([
    fetchMemberOrUser(record.targetId, guild),
    fetchMemberOrUser(record.moderatorId, guild),
  ]);

  const container = new ContainerBuilder()
    .setAccentColor(color)
    .addSectionComponents((top) =>
      top
        .setThumbnailAccessory((pfp) =>
          pfp.setURL(
            guild.members.cache
              .get(record.targetId)
              ?.displayAvatarURL({ forceStatic: false }) ??
              client.users.cache
                .get(record.targetId)
                ?.displayAvatarURL({ forceStatic: false }) ??
              client.rest.cdn.defaultAvatar(
                calculateUserDefaultAvatarIndex(record.targetId),
              ),
          ),
        )
        .addTextDisplayComponents((text) =>
          text.setContent(
            [
              heading(`Member Warn`),
              `${bold("Member")}:		${[target.toString(), inlineCode(getNameToDisplay(target))].join(" ")}`,
              `${bold("Moderator")}:	${[moderator.toString(), inlineCode(getNameToDisplay(moderator))].join(" ")}`,
            ].join("\n"),
          ),
        ),
    )
    // .addSeparatorComponents((space) =>
    //   space.setDivider(true).setSpacing(SeparatorSpacingSize.Large),
    // )
    .addTextDisplayComponents((reason) =>
      reason.setContent(
        `${heading("Reason", HeadingLevel.Three)}\n${record.reason}`,
      ),
    )
    .addSeparatorComponents((line) =>
      line.setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents((text) =>
      text.setContent(
        [
          `Last Updated: ${time(record.updatedAt)}`,
          // `Discord Id:	${record.targetId}`,
        ]
          .map(subtext)
          .join("\n"),
      ),
    );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`wp_${searchId}`)
      .setLabel("Back to Search")
      .setStyle(ButtonStyle.Secondary),
  );
  return [container, row];
}
