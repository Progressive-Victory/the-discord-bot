import { APIWarn } from "@/Classes/API/ApiConnService";
import { WarnSearch } from "@/Classes/API/ApiConnService/WarnSearchmanager";
import { Warn } from "@/Classes/API/Warn";
import { fetchMemberOrUser, getNameToDisplay } from "@/util";
import { apiConnService } from "@/util/api/pvapi";
import {
  APIMessageTopLevelComponent,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Colors,
  ContainerBuilder,
  Guild,
  HeadingLevel,
  JSONEncodable,
  SeparatorSpacingSize,
  Snowflake,
  bold,
  heading,
  inlineCode,
  resolveColor,
  subtext,
  time,
} from "discord.js";
import { WarnEmbedColor } from "./types";

export async function warnPage(search: WarnSearch) {
  const components: JSONEncodable<APIMessageTopLevelComponent>[] =
    await Promise.all(
      search.currentPageWarns.map((warn) =>
        warnContainer(search.searcher.client, warn, search.id),
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
          .setThumbnailAccessory((pfp) => pfp.setURL(target.displayAvatarURL()))
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
                `Created At: ${time(record.createdAt)} | Warn Id: ${inlineCode(record.id.toString())}`,
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
        .setThumbnailAccessory((pfp) => pfp.setURL(target.displayAvatarURL()))
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
          `Last Updated: ${time(record.updatedAt)} | Warn Id: ${inlineCode(record.id.toString())}`,
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

export function warnDMContainer(record: Warn) {
  return new ContainerBuilder()
    .setAccentColor(resolveColor(WarnEmbedColor.updated))
    .addTextDisplayComponents((text) =>
      text.setContent(
        [
          heading("You Have Received a Warning"),
          heading("Reason", HeadingLevel.Three),
          `${record.reason}`,
        ].join("\n"),
      ),
    )
    .addSeparatorComponents((line) =>
      line.setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents((footer) =>
      footer.setContent(
        [`Issued At: ${time(record.createdAt)}`].map(subtext).join("\n"),
      ),
    );
}

export async function warnModContainer(
  record: Warn,
  guild: Guild,
  receivedByUser: boolean,
) {
  // member or user of related to the action
  const [target, moderator] = await Promise.all([
    fetchMemberOrUser(record.targetId, guild),
    fetchMemberOrUser(record.moderatorId, guild),
  ]);
  const topText = [
    heading(`Member Warn`),
    `${bold("Member")}:		${[target.toString(), inlineCode(getNameToDisplay(target))].join(" ")}`,
    `${bold("Moderator")}:	${[moderator.toString(), inlineCode(getNameToDisplay(moderator))].join(" ")}`,
  ];
  if (!receivedByUser) {
    topText.splice(
      1,
      0,
      subtext("Member did not receive DM of warn due to privacy settings"),
    );
  }

  return new ContainerBuilder()
    .setAccentColor(resolveColor(WarnEmbedColor.updated))
    .addSectionComponents((top) =>
      top
        .setThumbnailAccessory((pfp) => pfp.setURL(target.displayAvatarURL()))
        .addTextDisplayComponents((text) =>
          text.setContent(topText.join("\n")),
        ),
    )
    .addTextDisplayComponents((reason) =>
      reason.setContent(
        [heading("Reason", HeadingLevel.Three), record.reason].join("\n"),
      ),
    )
    .addSeparatorComponents((line) =>
      line.setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addSectionComponents((footer) =>
      footer
        .addTextDisplayComponents((text) =>
          text.setContent(
            [`Issued At: ${time(record.createdAt)}`].map(subtext).join("\n"),
          ),
        )
        .setButtonAccessory((button) =>
          button
            .setCustomId(`vumw_${target.id}`)
            .setLabel("View Member Warns")
            .setStyle(ButtonStyle.Secondary),
        ),
    );
}
