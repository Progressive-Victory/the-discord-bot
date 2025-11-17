import { ClientOptions } from "discord.js";

/**
 * Provides additional configuration for the PV Bot Discord client
 */
export interface ExtendedClientOptions extends ClientOptions {
  // Whether the bot should respond to buttons or select menus
  receiveMessageComponents?: boolean;
  // Whether the bot should respond to modals
  receiveModals?: boolean;
  // Whether the bot should respond to autocomplete
  receiveAutocomplete?: boolean;
  // Whether the bot should respond to autocomplete
  replyOnError?: boolean;
  // Message for errors in the interactionCreate
  replyMessageOnError?: string;
  // The string that is used to split/join the custom id
  splitCustomIdOn?: string;
}
