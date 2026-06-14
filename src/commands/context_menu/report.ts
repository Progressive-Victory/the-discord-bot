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
    execute: async (interaction) => {
      if (interaction.targetUser.bot) {
        await interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: "You can not report a bot",
        });
        return;
      } else if (interaction.targetUser === interaction.user) {
        await interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: "You can not report yourself",
        });
        return;
      }

      const modal = reportModel;
      modal.setCustomId(
        AddSplitCustomId(reportModalPrefix.userReport, interaction.targetId),
      );

      await interaction.showModal(modal);
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
    execute: async (interaction) => {
      if (interaction.targetMessage.author.bot) {
        await interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: "You can not report a bot message",
        });
        return;
      } else if (interaction.targetMessage.author === interaction.user) {
        await interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: "You can not report yourself",
        });
        return;
      }

      const targetMessage = interaction.targetMessage;
      const channel = targetMessage.channel;

      const modal = reportModel;
      modal.setCustomId(
        AddSplitCustomId(
          reportModalPrefix.messageReport,
          channel.id,
          targetMessage.id,
        ),
      );

      interaction.showModal(modal);
    },
  });
