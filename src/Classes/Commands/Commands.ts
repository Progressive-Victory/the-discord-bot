import {
  ApplicationCommandType,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  ContextMenuCommandBuilder,
  ContextMenuCommandInteraction,
  ContextMenuCommandType,
  SlashCommandBuilder,
} from "discord.js";
import { BaseCommand } from "./BaseCommand.js";
import { AnySlashCommandBuilder } from "./types.js";

/**
 * Represents a PV Bot command that is invoked via a slash command and provides an interaction interface
 * using chat input
 */
export class ChatInputCommand extends BaseCommand<
  AnySlashCommandBuilder,
  ChatInputCommandInteraction
> {
  /**
   * Runs when client receives and Autocomplete interaction
   * @param interaction - Autocomplete interaction received by the client
   */
  protected _autocomplete?: (
    interaction: AutocompleteInteraction,
  ) => Promise<void>;

  get autocomplete() {
    if (this._autocomplete === undefined)
      throw Error("interaction.autocomplete is undefined");
    return this._autocomplete;
  }

  get type() {
    return ApplicationCommandType.ChatInput;
  }

  /**
   * Set the command builder method
   * @param input - Slash command builder or callback
   * @returns The modified object
   */
  setBuilder(
    input:
      | SlashCommandBuilder
      | ((commandBuilder: SlashCommandBuilder) => AnySlashCommandBuilder),
  ): this {
    if (typeof input === "function") {
      this._builder = input(new SlashCommandBuilder());
    } else {
      this._builder = input;
    }
    return this;
  }

  /**
   * Set Autocomplete method
   * @param autocomplete - autocomplete function
   * @returns The modified object
   */
  public setAutocomplete(
    autocomplete: (interaction: AutocompleteInteraction) => Promise<void>,
  ) {
    this._autocomplete = autocomplete;
    return this;
  }

  /**
   * Represents Slash command
   * @param options - partial object
   */
  constructor(options?: Partial<ChatInputCommand>) {
    super(options);
    this._autocomplete = options?.autocomplete;
  }
}

/**
 * Represents a PV Bot command that is invoked using either a user or message context menu
 */
export class ContextMenuCommand<
  CommandInteraction extends ContextMenuCommandInteraction,
> extends BaseCommand<ContextMenuCommandBuilder, CommandInteraction> {
  /**
   * Set the Context Menu command builder method
   * @param input - Context Menu command builder or callback
   * @returns The modified object
   */
  public setBuilder(
    input:
      | ContextMenuCommandBuilder
      | ((
          subcommandBuilder: ContextMenuCommandBuilder,
        ) => ContextMenuCommandBuilder),
  ): this {
    if (typeof input === "function") {
      this._builder = input(new ContextMenuCommandBuilder());
    } else {
      this._builder = input;
    }
    return this;
  }

  get type(): ContextMenuCommandType {
    return this.builder.type;
  }
}
