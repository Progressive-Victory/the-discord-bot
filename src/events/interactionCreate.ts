import {
  ApplicationCommandType,
  DiscordAPIError,
  Events,
  Interaction,
  InteractionType,
} from "discord.js";
import { Event } from "../Classes/Event.js";
import { GuildSetting } from "../models/Setting.js";

/**
 * Handles the creation of a new interaction.
 * @param interaction - The interaction object.
 */
async function onInteractionCreate(interaction: Interaction): Promise<void> {
  const { client, type } = interaction;
  const { commands, interactions, errorMessage, replyOnError } = client;

  if (interaction.inGuild()) {
    const setting = await GuildSetting.findOne({
      guildId: interaction.guildId,
    });
    if (!setting)
      GuildSetting.create({
        guildId: interaction.guildId,
        guildName: interaction.guild?.name,
      });
    else if (interaction.guild?.name !== setting.guildName) {
      setting.guildName = interaction.guild?.name ?? "Name Unknown";
      setting.save();
    }
  }

  client.emit(Events.Debug, interaction.toString());
  try {
    switch (type) {
      case InteractionType.ApplicationCommandAutocomplete:
        // If the interaction is an autocomplete request, handle autocomplete
        void commands.runAutocomplete(interaction);
        break;
      case InteractionType.ModalSubmit:
        // If the interaction is a modal submit interaction, execute the corresponding modal submit handler
        void interactions.runModal(interaction);
        break;
      case InteractionType.ApplicationCommand:
        switch (interaction.commandType) {
          case ApplicationCommandType.ChatInput:
            // If the interaction is a chat input command, execute the corresponding command
            void commands.runChatCommand(interaction);
            break;
          case ApplicationCommandType.User:
            // If the interaction is a user context menu command, execute the corresponding command
            void commands.runUserContextMenus(interaction);
            break;
          case ApplicationCommandType.Message:
            // If the interaction is a message context menu command, execute the corresponding command
            void commands.runMessageContextMenus(interaction);
            break;
          default:
            break;
        }
        break;

      case InteractionType.MessageComponent:
        if (interaction.isButton())
          // If the interaction is a button interaction, execute the corresponding button handler
          void interactions.runButton(interaction);
        else if (interaction.isAnySelectMenu())
          // If the interaction is a select menu interaction, execute the corresponding select menu handler
          void interactions.runSelectMenus(interaction);

        break;

      default:
        break;
    }
  } catch (error) {
    if (interaction.isRepliable()) {
      // If the interaction is repliable, handle the error with a reply
      if (error instanceof DiscordAPIError) client.emit(Events.Error, error);
      else if (error instanceof Error) {
        client.emit(Events.Error, error);

        if (!replyOnError) return;

        if (interaction.deferred)
          // If the interaction is deferred, follow up with an ephemeral error message
          void interaction.followUp({ content: errorMessage, ephemeral: true });
        else
          // If the interaction is not deferred, reply with an ephemeral error message
          void interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } else
      // If the interaction is not repliable
      throw error;
  }
}

export const interactionCreate = new Event({
  name: Events.InteractionCreate,
  once: false,
  execute: onInteractionCreate,
});
