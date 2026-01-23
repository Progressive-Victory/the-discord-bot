import { Routes } from "@/Classes/API/ApiConnService/routes";
import {
  SettingsResponse,
  zSettingsResponse,
} from "@/contracts/responses/SettingsResponse";
import { apiConnService } from "@/util/api/pvapi";
import { eventLogMessageCache } from "@/util/cache/eventLogMessageCache";
import { ScheduledEventWrapper } from "@/util/scheduledEventWrapper";
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
import { client } from "../..";
import { IEvent } from "../events/IEvent";

export async function logScheduledEvent(event: IEvent, init: boolean) {
  try {
    if (!process.env.PV_GUILD_ID)
      throw Error("Set 'PV_GUILD_ID' in the env file");
    const guild: Guild = await client.guilds.fetch(process.env.PV_GUILD_ID);

    const setting = "event_log_channel_id";

    const res = await apiConnService.get<SettingsResponse>(
      Routes.setting(setting),
      zSettingsResponse,
    );

    const logChannelId = res.data;
    if (!logChannelId) throw Error("Set the log channel id in the settings!");
    let logChannel = guild.channels.cache.get(logChannelId);
    if (!logChannel) {
      logChannel = (await guild.channels.fetch(logChannelId)) ?? undefined;
    }

    if (logChannel?.type !== ChannelType.GuildText) return;
    let existingPost = undefined;
    const logMessageId = eventLogMessageCache.fetch(event.id);
    if (logMessageId) {
      existingPost = logChannel.messages.cache.get(logMessageId);
      if (!existingPost) {
        existingPost = await logChannel.messages
          .fetch(logMessageId)
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

    if (existingPost) {
      const { cont } = await logContainer(event, init);
      const files = [];
      if (event.thumbnailUrl === "attachment://image.jpg")
        files.push(new AttachmentBuilder("./assets/image.jpg"));
      if (!init)
        files.push(new AttachmentBuilder("./assets/temp/attendees.csv"));
      await existingPost.edit({
        components: [cont],
        files: files,
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [] },
      });
      if (logMessageId) eventLogMessageCache.delete(logMessageId);
    } else {
      const { cont } = await logContainer(event, init);
      const files = [];
      if (event.thumbnailUrl === "attachment://image.jpg")
        files.push(new AttachmentBuilder("./assets/image.jpg"));
      if (!init)
        files.push(new AttachmentBuilder("./assets/temp/attendees.csv"));
      const post = await logChannel.send({
        components: [cont],
        flags: MessageFlags.IsComponentsV2,
        files: files,
        allowedMentions: { parse: [] },
      });
      eventLogMessageCache.push(post.id, event);
    }
  } catch (err) {
    console.error(err);
  }
}

// rewrite this function
async function logContainer(event: IEvent, init: boolean) {
  const wrapper = new ScheduledEventWrapper(event);
  let attendeesCount;
  let attendeesStr;
  if (!init) {
    const attendees = wrapper.attendancePercentages();
    attendeesCount = wrapper.uniqueAttendees();
    await wrapper.writeCsvDump();
    //if attendees.length > 30 then replace inline list with text file
    //todo: figure out how to generate text file
    //todo: add some file output for attachments in this function; wire it up to the main log function
    attendeesStr =
      attendees.length > 0 && attendees.length < 30
        ? attendees
            .map((usr) => {
              return `\n- ${usr}`;
            })
            .toString()
        : "";
  }
  const separator = new SeparatorBuilder()
    .setSpacing(SeparatorSpacingSize.Small)
    .setDivider(true);
  if (init) {
    return {
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
              new TextDisplayBuilder().setContent(`Time: N/A`),
            ),
        )
        .addSeparatorComponents(separator)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            "Description:\n" + wrapper.description(),
          ),
          new TextDisplayBuilder().setContent("Attendees: N/A"),
        )
        .addSeparatorComponents(separator)
        .addSectionComponents(
          new SectionBuilder()
            .setButtonAccessory(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel("Event Link")
                .setURL(await wrapper.eventLink()),
            )
            .addTextDisplayComponents(
              new TextDisplayBuilder().setContent(
                `N/A Minutes • N/A Attendees • ${wrapper.recurrence()}`,
              ),
            ),
        ),
    };
  } else {
    return {
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
          new FileBuilder().setURL("attachment://attendees.csv"),
        )
        .addSeparatorComponents(separator)
        .addSectionComponents(
          new SectionBuilder()
            .setButtonAccessory(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel("Event Link")
                .setURL(await wrapper.eventLink()),
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
