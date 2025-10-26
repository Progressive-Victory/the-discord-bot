import {
  ApplicationCommandDataResolvable,
  ApplicationCommandType,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Collection,
  Events,
  MessageContextMenuCommandInteraction,
  Routes,
  Snowflake,
  UserContextMenuCommandInteraction,
} from "discord.js";
import { Client } from "../Client/index.js";
import { ChatInputCommand, ContextMenuCommand } from "../Commands/index.js";

/**
 * Manages all chat and context menu commands that the PV bot supports. The {@link CommandHandler}:
 * <ul>
 *   <li>Allows registration of commands with the PV bot</li>
 *   <li>Handles the registration of global/guild-scoped commands with Discord via discord.js</li>
 *   <li>Dispatches interaction events from Discord to the appropriate interaction handler based on the event name</li>
 * </ul>
 */
export class CommandHandler {
  readonly client: Client;
  protected _chatCommands = new Collection<string, ChatInputCommand>();
  protected _userContextMenus = new Collection<
    string,
    ContextMenuCommand<UserContextMenuCommandInteraction>
  >();
  protected _messageContextMenus = new Collection<
    string,
    ContextMenuCommand<MessageContextMenuCommandInteraction>
  >();

  /**
   * @returns the {@link Collection} of user context menu commands maintained by the {@link CommandHandler} instance
   */
  get userContextMenus() {
    return this._userContextMenus;
  }

  /**
   * @returns the {@link Collection} of chat input commands maintained by the {@link CommandHandler} instance
   */
  get chatCommands() {
    return this._chatCommands;
  }

  /**
   * @returns the {@link Collection} of message context menu commands maintained by the {@link CommandHandler} instance
   */
  get messageContextMenus() {
    return this._messageContextMenus;
  }

  /**
   * @returns a reference to the underlying {@link Client}'s REST API handler
   */
  get rest() {
    return this.client.rest;
  }

  /**
   * Register command with the {@link CommandHandler} instance
   * @param command - the chat input or context menu command to register with the {@link CommandHandler} instance
   * @returns the {@link CommandHandler} instance
   */
  add(
    command:
      | ChatInputCommand
      | ContextMenuCommand<MessageContextMenuCommandInteraction>
      | ContextMenuCommand<UserContextMenuCommandInteraction>,
  ) {
    const { type, name } = command;

    switch (type) {
      case ApplicationCommandType.ChatInput:
        this._chatCommands.set(name, command);
        break;
      case ApplicationCommandType.Message:
        this._messageContextMenus.set(
          name,
          command as ContextMenuCommand<MessageContextMenuCommandInteraction>,
        );
        break;
      case ApplicationCommandType.User:
        this._userContextMenus.set(
          name,
          command as ContextMenuCommand<UserContextMenuCommandInteraction>,
        );
        break;
      default:
        break;
    }
    return this;
  }

  /**
   * Deploy Application Commands to Discord
   * @see https://discord.com/developers/docs/interactions/application-commands
   */
  async register() {
    if (!this.client.loggedIn)
      throw Error("Client cannot register commands before init");

    this.client.emit(Events.Debug, "Deploying commands...");
    const globalCommandData: ApplicationCommandDataResolvable[] =
      this.chatCommands
        .filter((f) => f.isGlobal)
        .map((m) => m.toJSON())
        .concat(
          this._userContextMenus
            .filter((f) => f.isGlobal)
            .map((m) => m.toJSON()),
        )
        .concat(
          this._messageContextMenus
            .filter((f) => f.isGlobal)
            .map((m) => m.toJSON()),
        );
    const sentCommands =
      await this.client.application.commands.set(globalCommandData);
    this.client.emit(
      Events.Debug,
      `Deployed ${sentCommands.size.toString()} global command(s)`,
    );

    const guildCommandData = new Collection<
      Snowflake,
      ApplicationCommandDataResolvable[]
    >();
    // Get guild chat commands
    this.chatCommands
      .filter((f) => !f.isGlobal)
      .map((m) => {
        const json = m.toJSON();
        m.guildIds.forEach((guildId) => {
          if (guildCommandData.has(guildId)) {
            guildCommandData.get(guildId)?.concat(json);
          } else {
            guildCommandData.set(guildId, [json]);
          }
        });
      });
    // Get guild context menu commands
    this._userContextMenus
      .filter((f) => !f.isGlobal)
      .map((m) => {
        const json = m.toJSON();
        m.guildIds.forEach((guildId) => {
          if (guildCommandData.has(guildId)) {
            guildCommandData.get(guildId)?.concat(json);
          } else {
            guildCommandData.set(guildId, [json]);
          }
        });
      });

    this._messageContextMenus
      .filter((f) => !f.isGlobal)
      .map((m) => {
        const json = m.toJSON();
        m.guildIds.forEach((guildId) => {
          if (guildCommandData.has(guildId)) {
            guildCommandData.get(guildId)?.concat(json);
          } else {
            guildCommandData.set(guildId, [json]);
          }
        });
      });
    // Deploys commands by guild
    for (const [guildIds, json] of guildCommandData) {
      await this.client.application.commands.set(json, guildIds);
    }

    this.client.emit(
      Events.Debug,
      `Deployed commands to ${guildCommandData.size.toString()} guilds`,
    );
    this.client.emit(Events.Debug, "Commands registered");
  }

  /**
   * Deregister commands for one or more guilds
   * @param guildId - If `undefined`, deregisters commands for all guilds. Else,
   *                  deregisters all commands for the specified guild
   */
  async deregisterGuildCommands(guildId?: string) {
    try {
      if (guildId !== undefined) {
        await this.rest
          .put(Routes.applicationGuildCommands(this.client.user.id, guildId), {
            body: [],
          })
          .catch((e: unknown) => {
            if (e instanceof Error) this.client.emit(Events.Error, e);
          });
        this.client.emit(
          Events.Debug,
          `Successfully deleted all guild commands in ${guildId}.`,
        );
      } else {
        const guilds = await this.client.guilds.fetch().catch(console.error);
        if (!guilds) return;

        for ([guildId] of guilds) {
          await this.rest
            .put(
              Routes.applicationGuildCommands(this.client.user.id, guildId),
              { body: [] },
            )
            .catch((e: unknown) => {
              if (e instanceof Error) this.client.emit(Events.Error, e);
            });
        }

        this.client.emit(
          Events.Debug,
          `Successfully deleted all guild commands.`,
        );
      }
    } catch (error) {
      if (error instanceof Error) this.client.emit(Events.Error, error);
    }
  }

  /**
   * Run the registered chat input interaction handler
   * @param interaction - the {@link ChatInputCommandInteraction} received from the Discord WebSocket
   */
  runChatCommand(interaction: ChatInputCommandInteraction) {
    this.chatCommands.get(interaction.commandName)?.execute(interaction);
  }

  /**
   * Run the registered autocomplete interaction handler
   * @param interaction - the {@link AutocompleteInteraction} received from the Discord WebSocket
   */
  runAutocomplete(interaction: AutocompleteInteraction) {
    this.chatCommands.get(interaction.commandName)?.autocomplete(interaction);
  }

  /**
   * Run the registered user context menu interaction handler
   * @param interaction - the {@link UserContextMenuCommandInteraction} received from the Discord WebSocket
   */
  runUserContextMenus(interaction: UserContextMenuCommandInteraction) {
    this._userContextMenus.get(interaction.commandName)?.execute(interaction);
  }

  /**
   * Run the registered message context menu interaction handler
   * @param interaction - the {@link MessageContextMenuCommandInteraction} received from the Discord WebSocket
   */
  runMessageContextMenus(interaction: MessageContextMenuCommandInteraction) {
    this._messageContextMenus
      .get(interaction.commandName)
      ?.execute(interaction);
  }

  /**
   * @param client - parent client
   */
  constructor(client: Client) {
    this.client = client;
  }
}
