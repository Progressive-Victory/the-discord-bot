import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Colors,
  ContainerBuilder,
  HeadingLevel,
  SeparatorSpacingSize,
  bold,
  calculateUserDefaultAvatarIndex,
  heading,
  inlineCode,
  subtext,
  time,
} from "discord.js";
import { APIWarn, APIWarnPage } from "../../Classes/API/ApiConnService/index.js";
import { Warn } from "../../Classes/API/Warn.js";
import { apiConnService } from "../../util/api/pvapi.js";
import { fetchMemberOrUser, getNameToDisplay } from "../../util/index.js";

export async function warnContainer(client: Client, warn: APIWarn, page: APIWarnPage) {
  const guild = client.guilds.cache.get(process.env.GUILD_ID!)!;
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
              .setCustomId(`warn view ${record.id}`)
              .setLabel(`vw ${}`)
              .setStyle(ButtonStyle.Primary),
          ),
      )
  );
}

export function viewPageRow(page:APIWarnPage) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
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
    )
}
