import {
  bold,
  Colors,
  ContainerBuilder,
  Events,
  heading,
  inlineCode,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder,
  TimestampStyles,
} from "discord.js";
import Event from "../../Classes/Event.js";
import { GuildSetting } from "../../models/Setting.js";
import { footer } from "../../util/components.js";
import { getGuildChannel } from "../../util/index.js";

/**
 * `GuildMemberRemove` handles the {@link Events.GuildMemberRemove} {@link Event}.
 * If an audit logging channel is configured for members leaving the server, a message is sent there.
 */
export const GuildMemberRemove = new Event({
  name: Events.GuildMemberRemove,
  execute: async (member) => {
    const { guild } = member;
    const settings = await GuildSetting.findOne({ guildId: guild.id });

    // check that leave channel ID is set
    const leaveChannelId = settings?.logging.leaveChannelId;
    if (!leaveChannelId) return;

    // check that Join channel exists in guild
    const leaveChannel = await getGuildChannel(guild, leaveChannelId);
    if (!leaveChannel?.isSendable()) return;
    const userAvatarURL = member.user.displayAvatarURL({ forceStatic: true });
    const text = [
      heading("Member Left"),
      `${bold(member.displayName)} ${member.user.username}`,
      `Joined: ${member.joinedAt?.toDiscordString(TimestampStyles.LongDateTime) ?? inlineCode("not cached")}`,
    ];

    if (member.pending === true) text.push("*Didn't agree to rules");
    const thumbnail = new ThumbnailBuilder().setURL(userAvatarURL);
    const display = new TextDisplayBuilder().setContent(text.join("\n"));

    const container = new ContainerBuilder()
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(display)
          .setThumbnailAccessory(thumbnail),
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small),
      )
      .addTextDisplayComponents(footer(member.id))
      .setAccentColor(Colors.Red);

    leaveChannel.send({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
    });
  },
});
