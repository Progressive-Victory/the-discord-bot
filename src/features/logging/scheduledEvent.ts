import {
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ContainerBuilder,
  DiscordAPIError,
  FileBuilder,
  Guild,
  heading,
  HeadingLevel,
  MessageFlags,
  RESTJSONErrorCodes,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from "discord.js";
import * as fs from "fs";
import { client } from "../../index.js";
import { IScheduledEvent } from "../../models/ScheduledEvent.js";
import { GuildSetting } from "../../models/Setting.js";
import dbConnect from "../../util/libmongo.js";
import { ScheduledEventWrapper } from "../../util/scheduledEventWrapper.js";

/**
 * Records schelude event object in logs
 * @param event Sheduled Event Object
 * @param guild ??
 * @param forceNew ?? 
 * 
 */
export async function logScheduledEvent(event: IScheduledEvent) {
  await dbConnect();
  //gets guild object by guild ID from event object
  const guild: Guild = await client.guilds.fetch(event.guildId);
  //get settings by guild ID
  const settings = await GuildSetting.findOne({ guildId: guild.id }).exec();

  const logChannelId = settings?.logging.eventLogChannelId;
  //checks if log channel ID exists 
  if (!logChannelId) return;
  //finds channel from guid's channels cache by log Channel Id 
  let logChannel = guild.channels.cache.get(logChannelId);
  if (!logChannel) {
    logChannel = (await guild.channels.fetch(logChannelId)) ?? undefined;
  }
  //check if channel type is GuildText 
  if (logChannel?.type !== ChannelType.GuildText) return;
  let existingPost = undefined;
  if (event.logMessageId) {
    //console.log("finding existing post");
    existingPost = logChannel.messages.cache.get(event.logMessageId);
    if (!existingPost) {
      existingPost = await logChannel.messages
        .fetch(event.logMessageId)
        .catch((e) => {
          if (
            e instanceof DiscordAPIError &&
            e.code === RESTJSONErrorCodes.UnknownMessage
          ) {
            return undefined;
          }
          throw e;
        });
    }
  }

  //console.log("fetched post");
  //console.log(existingPost);

  if (existingPost) {
    //console.log("editing existing post...");
    //console.log("event ended at: " + event.endedAt);
    const { fileOut, cont } = await logContainer(event);
    const files = [];
    if (event.thumbnailUrl === "attachment://image.jpg")
      files.push(new AttachmentBuilder("./assets/image.jpg"));
    if (fileOut)
      files.push(new AttachmentBuilder("./assets/temp/attendees.txt"));
    await existingPost.edit({
      components: [cont],
      files: files,
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] },
    });
  } else {
    const { fileOut, cont } = await logContainer(event);
    const files = [];
    if (event.thumbnailUrl === "attachment://image.jpg")
      files.push(new AttachmentBuilder("./assets/image.jpg"));
    if (fileOut)
      files.push(new AttachmentBuilder("./assets/temp/attendees.txt"));
    const post = await logChannel.send({
      components: [cont],
      flags: MessageFlags.IsComponentsV2,
      files: files,
      allowedMentions: { parse: [] },
    });
    event.logMessageId = post.id;
    //console.log("event log message id: " + event.logMessageId);
    await event.save();
  }
}

/**
 *
 * @param event
 */
async function logContainer(event: IScheduledEvent) {
  const wrapper = new ScheduledEventWrapper(event);
  let attendees = await wrapper.attendees();
  let fileOut = false;
  if (attendees.length > 30) {
    attendees = await wrapper.attendeesNames();
    await fs.writeFile(
      "./assets/temp/attendees.txt",
      attendees.toString(),
      () => {},
    );
    fileOut = true;
  }
  //if attendees.length > 30 then replace inline list with text file
  //todo: figure out how to generate text file
  //todo: add some file output for attachments in this function; wire it up to the main log function
  const attendeesCount = attendees.length;
  const attendeesStr =
    attendees.length > 0 && !fileOut
      ? attendees
          .map((usr) => {
            return `\n- ${usr}`;
          })
          .toString()
      : "";
  const separator = new SeparatorBuilder()
    .setSpacing(SeparatorSpacingSize.Small)
    .setDivider(true);
  if (fileOut) {
    return {
      fileOut: fileOut,
      cont: new ContainerBuilder()
        .setAccentColor(wrapper.statusColor())
        .addSectionComponents(
          new SectionBuilder()
            .setThumbnailAccessory(
              new ThumbnailBuilder().setURL(wrapper.thumbnail()),
            )
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                heading(wrapper.name(), HeadingLevel.Three),
              ),
              new TextDisplayBuilder().setContent(
                "Date: " + wrapper.startDate(),
              ),
              new TextDisplayBuilder().setContent(
                `Time: ${wrapper.startTime()} - ${wrapper.endTime()}`,
              ),
            ),
        )
        .addSeparatorComponents(separator)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            "Description:\n" + wrapper.description(),
          ),
          new TextDisplayBuilder().setContent("Attendees: " + attendeesStr),
        )
        .addFileComponents(
          new FileBuilder().setURL("attachment://attendees.txt"),
        )
        .addSeparatorComponents(separator)
        .addSectionComponents(
          new SectionBuilder()
            .setButtonAccessory(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel("Event Link")
                .setURL(wrapper.eventLink()),
            )
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `${wrapper.duration()} Minutes • ${attendeesCount} Attendees • ${wrapper.recurrence()}`,
              ),
            ),
        ),
    };
  } else {
    return {
      fileOut: fileOut,
      cont: new ContainerBuilder()
        .setAccentColor(wrapper.statusColor())
        .addSectionComponents(
          new SectionBuilder()
            .setThumbnailAccessory(
              new ThumbnailBuilder().setURL(wrapper.thumbnail()),
            )
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                heading(wrapper.name(), HeadingLevel.Three),
              ),
              new TextDisplayBuilder().setContent(
                "Date: " + wrapper.startDate(),
              ),
              new TextDisplayBuilder().setContent(
                `Time: ${wrapper.startTime()} - ${wrapper.endTime()}`,
              ),
            ),
        )
        .addSeparatorComponents(separator)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            "Description:\n" + wrapper.description(),
          ),
          new TextDisplayBuilder().setContent("Attendees: " + attendeesStr),
        )
        .addSeparatorComponents(separator)
        .addSectionComponents(
          new SectionBuilder()
            .setButtonAccessory(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel("Event Link")
                .setURL(wrapper.eventLink()),
            )
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `${wrapper.duration()} Minutes • ${attendeesCount} Attendees • ${wrapper.recurrence()}`,
              ),
            ),
        ),
    };
  }
}
