import { ContextMenuCommand } from "@/Classes";
import { reportModalPrefix, reportModel } from "@/features/report";
import { AddSplitCustomId } from "@/util";
import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  InteractionContextType,
  MessageContextMenuCommandInteraction,
  MessageFlags,
  UserContextMenuCommandInteraction,
} from "discord.js";

/**
 * The `Report User` context menu command allows a user to report another non-bot user
 */
export const reportUser =
  new ContextMenuCommand<UserContextMenuCommandInteraction>({
    builder: new ContextMenuCommandBuilder()
      .setName("Report User")
      .setContexts(InteractionContextType.Guild)
      .setType(ApplicationCommandType.User),
    execute: (interaction) => {
      if (interaction.targetUser.bot) {
        interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: "You can not report a bot",
        });
        return Promise.resolve();
      } else if (interaction.targetUser === interaction.user) {
        interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: "You can not report yourself",
        });
        return Promise.resolve();
      }
      const modal = reportModel;
      modal.setCustomId(
        AddSplitCustomId(reportModalPrefix.userReport, interaction.targetId),
      );

      interaction.showModal(modal);
      return Promise.resolve();
    },
  });

/**
 * The `Report Message` context menu command allows a user to report another non-bot message
 */
export const reportMessage =
  new ContextMenuCommand<MessageContextMenuCommandInteraction>({
    builder: new ContextMenuCommandBuilder()
      .setName("Report Message")
      .setContexts(InteractionContextType.Guild)
      .setType(ApplicationCommandType.Message),
    execute: (interaction) => {
      if (interaction.targetMessage.author.bot) {
        interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: "You can not report a bot message",
        });
        return Promise.resolve();
      } else if (interaction.targetMessage.author === interaction.user) {
        interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: "You can not report yourself",
        });
        return Promise.resolve();
      }

      const modal = reportModel;
      modal.setCustomId(
        AddSplitCustomId(
          reportModalPrefix.messageReport,
          interaction.targetMessage.channelId,
          interaction.targetMessage.id,
        ),
      );

      interaction.showModal(modal);
      return Promise.resolve();
    },
  });
