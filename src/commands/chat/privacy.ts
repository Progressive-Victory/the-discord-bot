import { ChatInputCommand } from "@/Classes";
import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  MessageFlags,
} from "discord.js";
const POLICY_LINK = "https://www.progressivevictory.win/privacy";

export const privacy = new ChatInputCommand()
  .setBuilder((builder) =>
    builder
      .setContexts(InteractionContextType.Guild)
      .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
      .setName("privacy")
      .setDescription("Get PV Privacy Policy"),
  )
  .setExecute(async (interaction) => {
    const linkButton = new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setURL(POLICY_LINK)
      .setLabel("Privacy Policy")
      .setEmoji({
        name: "🔎",
      });

    const row = new ActionRowBuilder<ButtonBuilder>().setComponents(linkButton);

    await interaction.reply({
      content: "PV respect you right to know what data we collect",
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
  });
