import { ChatInputCommand } from "@/Classes";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";

export const ns = "feedback";

/**
 * The `feedback` command is used to inform the caller how to submit feedback on the
 * PV bot. It displays a button that links to the GitHub issues page.
 * @see https://github.com/Progressive-Victory/the-discord-bot/issues
 * @see {@link ChatInputCommand}
 */
export default new ChatInputCommand()
  .setBuilder((builder) =>
    builder
      .setName("feedback")
      .setDescription("Find out how to submit feedback about the bot"),
  )
  .setExecute(async (interaction) => {
    await interaction.reply({
      content:
        "Your feedback is important to us. Click the button below to report an issue on our GitHub page",
      flags: MessageFlags.Ephemeral,
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel("GitHub Issues")
            .setEmoji("📝")
            .setStyle(ButtonStyle.Link)
            .setURL(
              "https://github.com/Progressive-Victory/the-discord-bot/issues",
            ),
        ),
      ],
    });
  });
