import { ChatInputCommand } from "@/Classes";
import {
  GuildMember,
  InteractionContextType,
  SlashCommandBuilder,
} from "discord.js";

export const vcStatus = new ChatInputCommand({
  builder: new SlashCommandBuilder()
    .setName("vcstatus")
    .setDescription("Changes the status of the current Voice Channel")
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName("status")
        .setDescription("New Voice Channel Status")
        .setRequired(true)
        .setMaxLength(500),
    ),
  execute: async (interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const newStatus = interaction.options.getString("status", true);
    const member = interaction.member as GuildMember;

    if (!interaction.channel?.isVoiceBased()) {
      await interaction.editReply(
        "❌ You can only use this command inside a voice channel's side chat.",
      );
      return;
    }

    if (member.voice.channelId !== interaction.channelId) {
      await interaction.editReply(
        "❌ You must be connected to this voice channel to change its status.",
      );
      return;
    }

    if (newStatus.length > 500) {
      await interaction.editReply(
        "❌ Status Text cannot exceed 500 characters.",
      );
      return;
    }

    try {
      await interaction.client.rest.put(
        `/channels/${interaction.channelId}/voice-status` as `/${string}`,
        {
          body: {
            status: newStatus,
          },
        },
      );

      await interaction.editReply(
        `✅ Voice channel status set to: **${newStatus}**`,
      );
    } catch (error) {
      console.error("Failed to set VC status:", error);
      await interaction.editReply(
        "❌ Failed to change status. Does the bot have the correct permissions?",
      );
    }
  },
});
