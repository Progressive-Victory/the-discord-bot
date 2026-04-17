import {
  AnySelectMenuInteraction,
  ButtonInteraction,
  Collection,
  ModalSubmitInteraction,
} from "discord.js";
import { Client } from "../Client";
import { Interaction } from "../Interaction";

/**
 * Manages all interactions that the PV bot supports. The {@link InteractionHandler}:
 * <ul>
 *   <li>Manages button, select menu, and modal interactions</li>
 *   <li>Receives an interaction name from the Discord WebSocket, splits on the
 *       client's custom ID if required, and invokes the appropriate interaction handler</li>
 * </ul>
 */
export class InteractionHandler {
  readonly client: Client;

  protected _buttons = new Collection<string, Interaction<ButtonInteraction>>();
  protected _selectMenus = new Collection<
    string,
    Interaction<AnySelectMenuInteraction>
  >();
  protected _modals = new Collection<
    string,
    Interaction<ModalSubmitInteraction>
  >();

  /**
   * @returns the {@link Collection} of button interactions registered on the {@link InteractionHandler} instance
   */
  get buttons() {
    return this._buttons;
  }

  /**
   * @returns the {@link Collection} of select menu interactions registered on the {@link InteractionHandler} instance
   */
  get selectMenus() {
    return this._selectMenus;
  }

  /**
   * @returns the {@link Collection} of modal interactions registered on the {@link InteractionHandler} instance
   */
  get modals() {
    return this._modals;
  }

  /**
   * Adds a button interaction to the {@link Collection} of button interactions registered with the
   * @param interaction - the button interaction to add to the {@link InteractionHandler}
   * @returns the updated {@link InteractionHandler} instance
   */
  addButton(interaction: Interaction<ButtonInteraction>) {
    this.buttons.set(interaction.customIdPrefix, interaction);
    return this;
  }

  /**
   * Merges a {@link Collection} of button interaction handlers with the current {@link Collection} of
   * button interaction handlers registered with the {@link InteractionHandler} instance
   * @param collection - the {@link Collection} of button interaction handlers to add to the {@link InteractionHandler}
   * @returns the updated {@link InteractionHandler} instance
   */
  addButtons(collection: Collection<string, Interaction<ButtonInteraction>>) {
    this._buttons = this.buttons.concat(collection);
    return this;
  }

  /**
   * Runs a {@link ButtonInteraction} handler based on the custom ID of the interaction, splitting it
   * using {@link Client#splitCustomIdOn} if specified
   * @param interaction - The {@link ButtonInteraction} to handle
   * @returns if the command runs successfully, return void, else undefined
   */
  runButton(interaction: ButtonInteraction) {
    const interactionName = this.client.splitCustomIdOn
      ? interaction.customId.split(this.client.splitCustomIdOn)[0]
      : interaction.customId;
    return this.buttons.get(interactionName)?.run(interaction);
  }

  /**
   * Adds a modal interaction to the {@link Collection} of modal interactions registered with the
   * @param interaction - the modal interaction to add to the {@link InteractionHandler}
   * @returns the updated {@link InteractionHandler} instance
   */
  addModal(interaction: Interaction<ModalSubmitInteraction>) {
    this._modals.set(interaction.customIdPrefix, interaction);
    return this;
  }

  /**
   * Merges a {@link Collection} of modal interaction handlers with the current {@link Collection} of
   * modal interaction handlers registered with the {@link InteractionHandler} instance
   * @param collection - the {@link Collection} of modal interaction handlers to add to the {@link InteractionHandler}
   * @returns the updated {@link InteractionHandler} instance
   */
  addModals(
    collection: Collection<string, Interaction<ModalSubmitInteraction>>,
  ) {
    this._modals = this._modals.concat(collection);
    return this;
  }

  /**
   * Runs a {@link ModalSubmitInteraction} handler based on the custom ID of the interaction, splitting it
   * using {@link Client#splitCustomIdOn} if specified
   * @param interaction - The {@link ModalSubmitInteraction} to handle
   * @returns if the command runs successfully, return void, else undefined
   */
  runModal(interaction: ModalSubmitInteraction) {
    const interactionName = this.client.splitCustomIdOn
      ? interaction.customId.split(this.client.splitCustomIdOn)[0]
      : interaction.customId;
    return this._modals.get(interactionName)?.run(interaction);
  }

  /**
   * Adds a select menu interaction to the {@link Collection} of select menu interactions registered with the
   * @param interaction - the select menu interaction to add to the {@link InteractionHandler}
   * @returns the updated {@link InteractionHandler} instance
   */
  addSelectMenu(interaction: Interaction<AnySelectMenuInteraction>) {
    this._selectMenus.set(interaction.customIdPrefix, interaction);
    return this;
  }

  /**
   * Merges a {@link Collection} of select menu interaction handlers with the current {@link Collection} of
   * select menu interaction handlers registered with the {@link InteractionHandler} instance
   * @param collection - the {@link Collection} of select menu interaction handlers to add to the {@link InteractionHandler}
   * @returns the updated {@link InteractionHandler} instance
   */
  addSelectMenus(
    collection: Collection<string, Interaction<AnySelectMenuInteraction>>,
  ) {
    this._selectMenus = this._selectMenus.concat(collection);
    return this;
  }

  /**
   * Runs a {@link AnySelectMenuInteraction} handler based on the custom ID of the interaction, splitting it
   * using {@link Client#splitCustomIdOn} if specified
   * @param interaction - The {@link AnySelectMenuInteraction} to handle
   * @returns if the command runs successfully, return void, else undefined
   */
  runSelectMenus(interaction: AnySelectMenuInteraction) {
    const interactionName = this.client.splitCustomIdOn
      ? interaction.customId.split(this.client.splitCustomIdOn)[0]
      : interaction.customId;
    return this._selectMenus.get(interactionName)?.run(interaction);
  }

  constructor(client: Client) {
    this.client = client;
  }
}
