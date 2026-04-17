import { ContextMenuCommand } from "@/Classes";
import { banModalBuilder } from "@/features/moderation/ban";
import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  UserContextMenuCommandInteraction,
} from "discord.js";

export const BanUser =
  new ContextMenuCommand<UserContextMenuCommandInteraction>({
    builder: new ContextMenuCommandBuilder()
      .setName("Ban")
      .setDefaultMemberPermissions(
        PermissionFlagsBits.KickMembers | PermissionFlagsBits.BanMembers,
      )
      .setContexts(InteractionContextType.Guild)
      .setType(ApplicationCommandType.User),
    execute: async (interaction) => {
      if (!interaction.inCachedGuild()) return;
      const member = interaction.targetMember;
      if (member && (!member.user.bot || !member.bannable)) {
        await interaction.reply({
          content: `${member.toString()} is unable to be banned`,
          flags: MessageFlags.Ephemeral,
        });
      } else {
        const confirm = banModalBuilder(interaction.targetUser);
        await interaction.showModal(confirm);
      }
    },
  });
