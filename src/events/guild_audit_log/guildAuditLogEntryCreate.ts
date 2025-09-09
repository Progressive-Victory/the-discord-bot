import {
  AuditLogEvent,
  Events,
  Guild,
  GuildAuditLogsEntry,
  User,
} from "discord.js";
import Event from "../../Classes/Event.js";
import { timeoutEmbed } from "../../features/timeout.js";
import { GuildSetting } from "../../models/Setting.js";
import { getGuildChannel } from "../../util/index.js";

/**
 * `guildAuditLogEntryCreate` handles the {@link Events.GuildAuditLogEntryCreate} {@link Event}
 * by sending an audit log to the timeout logging channel when a guild member is timed out.
 */
export const guildAuditLogEntryCreate = new Event({
  name: Events.GuildAuditLogEntryCreate,
  execute: async (auditLogEntry: GuildAuditLogsEntry, guild: Guild) => {
    const { executorId, target, changes } = auditLogEntry;
    const settings = await GuildSetting.findOne({ guildId: guild.id });
    if (
      settings?.logging.timeoutChannelId &&
      auditLogEntry.action == AuditLogEvent.MemberUpdate &&
      changes[0].key == "communication_disabled_until" &&
      target instanceof User &&
      executorId
    ) {
      const executorMember = guild.members.resolve(executorId);
      const targetMember = guild.members.resolve(target);

      if (executorMember?.user.bot || !(targetMember && executorMember)) return;

      const timeoutChannel = await getGuildChannel(
        guild,
        settings.logging.timeoutChannelId,
      );

      if (!timeoutChannel?.isSendable()) return;

      const newDate = changes[0].new ? new Date(changes[0].new) : undefined;
      const embed = timeoutEmbed(
        targetMember,
        executorMember,
        auditLogEntry.createdAt,
        newDate!,
        auditLogEntry.reason ?? undefined,
      );

      timeoutChannel.send({ embeds: [embed] });
    }
  },
});
