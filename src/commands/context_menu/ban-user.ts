import { ContextMenuCommand } from "@/Classes";
import {
  banDefaultMemberPermissions,
  banModalBuilder,
  isBannable,
} from "@/features/moderation/ban";
import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  InteractionContextType,
  MessageFlags,
  UserContextMenuCommandInteraction,
} from "discord.js";

export const BanUser =
  new ContextMenuCommand<UserContextMenuCommandInteraction>({
    builder: new ContextMenuCommandBuilder()
      .setName("Ban")
      .setDefaultMemberPermissions(banDefaultMemberPermissions)
      .setContexts(InteractionContextType.Guild)
      .setType(ApplicationCommandType.User),
    execute: async (interaction) => {
      if (!interaction.inCachedGuild()) return;
      const member = interaction.targetMember;
      if (member && !isBannable(member, interaction.member)) {
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
