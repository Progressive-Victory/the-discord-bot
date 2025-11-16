import { Client, Collection } from "discord.js";
import { Event } from "../Event.js";

/**
 * Manages all events that the PV bot supports. The EventHandler:
 * <ul>
 *   <li>Allows registration of {@link Event}s with the PV bot</li>
 *   <li>Manages the set of registered {@link Event}s and their corresponding event names</li>
 * </ul>
 */
export class EventHandler {
  readonly client: Client;

  protected events = new Collection<string, Event>();

  /**
   * Add an {@link Event} to the {@link EventHandler}, registering it with Discord in the process
   * @param event - event to add to handler
   */
  add(event: Event) {
    // FIXME: The client must be signed in before registering event handlers
    if (event.once) this.client.once(event.name, event.execute);
    else this.client.on(event.name, event.execute);
    this.events.set(event.name, event);
  }

  /**
   * @returns the number of events registered with the {@link EventHandler}
   */
  get size() {
    return this.events.size;
  }

  constructor(client: Client) {
    this.client = client;
  }
}
