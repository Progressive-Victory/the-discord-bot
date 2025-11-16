import { Interaction as DiscordInteraction } from "discord.js";

/**
 * Interaction object
 */
export class Interaction<E extends DiscordInteraction> {
  // Name of Interaction
  private _customIdPrefix?: string;

  // Method that to run when interaction happens
  private _run?: (interaction: E) => void;

  get customIdPrefix() {
    if (this._customIdPrefix === undefined)
      throw Error("Interaction.customIdPrefix undefined");
    return this._customIdPrefix;
  }

  get run() {
    if (this._run === undefined) throw Error("Interaction.run undefined");
    return this._run;
  }

  /**
   * @deprecated Use `customId`
   */
  get name() {
    return this.customIdPrefix;
  }

  /**
   * @deprecated Use `run`
   */
  get execute() {
    return this.run;
  }

  constructor(options?: Partial<Interaction<E>>) {
    this._customIdPrefix = options?.customIdPrefix;
    this._run = options?.run;
  }

  /**
   * Set the name of the interaction
   * @deprecated Use `setCustomId`
   * @param name - Name of interaction
   * @returns The modified object
   */
  public setName(name: string) {
    this._customIdPrefix = name;
    return this;
  }

  /**
   * Set the name of the interaction
   * @param customId - Name of interaction
   * @returns The modified object
   */
  public setCustomIdPrefix(customId: string) {
    this._customIdPrefix = customId;
    return this;
  }

  /**
   * Set the execute method
   * @deprecated Use `setRun`
   * @param execute - function passed in
   * @returns The modified object
   */
  public setExecute(execute: (interaction: E) => void) {
    this._run = execute;
    return this;
  }

  /**
   * Set the execute method
   * @param run - function passed in
   * @returns The modified object
   */
  public setRun(run: (interaction: E) => void) {
    this._run = run;
    return this;
  }
}
