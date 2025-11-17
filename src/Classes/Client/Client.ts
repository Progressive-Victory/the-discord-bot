import { Client, Events } from "discord.js";
import {
  CommandHandler,
  EventHandler,
  InteractionHandler,
} from "../Handlers/index.js";
import { ExtendedClientOptions } from "./interfaces.js";

/**
 * Client is extended from the {@link Client}.
 * @see {@link https://discord.js.org/#/docs/main/stable/class/Client}
 */
export class ExtendedClient extends Client<true> {
  private _eventHandler = new EventHandler(this);

  private _commandHandler = new CommandHandler(this);

  private _interactionHandler = new InteractionHandler(this);

  // Whether the bot should respond to buttons or select menus
  readonly receiveMessageComponents: boolean;

  // Whether the bot should respond to modals
  readonly receiveModals: boolean;

  // Whether the bot should respond to autocomplete
  readonly receiveAutocomplete: boolean;

  // Whether the bot should respond to autocomplete
  readonly replyOnError: boolean;

  // Message for errors in the interactionCreate
  readonly errorMessage: string =
    "There was an error while executing this interaction.";

  // The string that is used to split/join the custom id
  readonly splitCustomIdOn?: string;

  // Whether the bot should use the provided InteractionCreate event
  readonly useDefaultInteractionEvent: boolean = true;

  // Checks if the init function has run
  private _hasInitRun = false;

  get loggedIn() {
    return this._hasInitRun;
  }

  get events() {
    return this._eventHandler;
  }

  get commands() {
    return this._commandHandler;
  }

  get interactions() {
    return this._interactionHandler;
  }

  /**
   * @param options - Options for the client
   * @see https://discord.js.org/#/docs/discord.js/main/typedef/ClientOptions
   */
  constructor(options: ExtendedClientOptions) {
    super(options);

    this.emit(Events.Debug, "Client starting up...");

    // Paths
    const {
      receiveMessageComponents,
      receiveModals,
      receiveAutocomplete,
      replyOnError,
      replyMessageOnError,
      splitCustomIdOn,
    } = options;

    // Misc configuration
    this.receiveMessageComponents = receiveMessageComponents ?? false;
    this.receiveModals = receiveModals ?? false;
    this.receiveAutocomplete = receiveAutocomplete ?? false;
    this.replyOnError = replyOnError ?? false;
    this.splitCustomIdOn = splitCustomIdOn ?? undefined;
    if (replyMessageOnError) this.errorMessage = replyMessageOnError;
  }

  /**
   * Logs the client in, establishing a WebSocket connection to Discord
   * @param token - The bot's Discord token
   * @returns token of the account used
   * @see https://discord.js.org/docs/packages/discord.js/14.21.0/Client:Class#login
   */
  public async login(token?: string): Promise<string> {
    if (!token) throw new Error("[ERROR] Missing token");

    this._hasInitRun = true;
    return super.login(token);
  }

  /**
   * Insert the CustomId in between strings in the array
   * @param args - arguments to be separated
   * @returns string with array elements separated by `splitCustomIdOn`
   */
  public arrayToCustomId(...args: string[]): string {
    if (this.splitCustomIdOn == undefined)
      throw Error(
        "splitCustomIdOn is undefined set value to use arrayToCustomId",
      );

    let output = args[0];
    for (let index = 1; index < args.length; index++)
      output = output.concat(this.splitCustomIdOn, args[index]);
    return output;
  }
}
