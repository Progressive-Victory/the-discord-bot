import {
  ChatInputCommandInteraction,
  ContextMenuCommandBuilder,
  ContextMenuCommandInteraction,
  Snowflake,
} from "discord.js";
import { AnySlashCommandBuilder } from "./types.js";

/**
 * BaseCommand represents a command that the PV bot can handle. This is a combination of a
 * command type, which is how the command is invoked, and an interaction, which defines the
 * behavior after the command is invoked.
 * @typeParam TypeBuilder - is the type of the command builder - either a slash command
 *  						or a context menu command
 * @typeParam TypeInteraction - is the type of the interaction - either a chat input interaction or
 * 							    a context menu interaction
 * @see {@link https://discordjs.guide/creating-your-bot/command-deployment.html}
 * @see {@link https://discordjs.guide/slash-commands/response-methods.html}
 */
export class BaseCommand<
  TypeBuilder extends AnySlashCommandBuilder | ContextMenuCommandBuilder,
  TypeInteraction extends
    | ChatInputCommandInteraction
    | ContextMenuCommandInteraction,
> {
  protected _builder?: TypeBuilder;

  protected _guildIds: Snowflake[];

  protected _execute?: (interaction: TypeInteraction) => Promise<void>;

  get name() {
    return this.builder.name;
  }

  get isGlobal() {
    return this._guildIds.length == 0;
  }

  get guildIds() {
    return this._guildIds;
  }

  get builder() {
    if (this._builder === undefined)
      throw Error("Command builder is undefined");
    return this._builder;
  }

  get execute() {
    if (this._execute === undefined)
      throw Error("Command execute is undefined");
    return this._execute;
  }

  setGuildIds(...ids: Snowflake[]) {
    this._guildIds = ids;
    return this;
  }

  /**
   * Set the interaction method that gets invoked on command execution
   * @param execute - the interaction handler
   * @returns The modified object
   */
  setExecute(execute: (interaction: TypeInteraction) => Promise<void>): this {
    this._execute = execute;
    return this;
  }

  /**
   * This method runs validations on the data before serializing it.
   * As such, it may throw an error if the data is invalid.
   * @returns Serializes to API-compatible JSON data.
   */
  toJSON() {
    return this.builder.toJSON();
  }

  /**
   * Represents Slash command or context command
   * @param options - optionally specifies the command builder, interaction, and guild IDs
   */
  constructor(options?: Partial<BaseCommand<TypeBuilder, TypeInteraction>>) {
    this._guildIds = options?.guildIds ?? [];
    this._builder = options?.builder;
    this._execute = options?.execute;
  }
}
