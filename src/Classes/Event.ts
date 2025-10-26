import { ClientEvents } from "discord.js";

/**
 * Event Class
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Event<Key extends keyof ClientEvents = any> {
  // Name of the Event
  private _name?: Key;

  // Flag if the event should only run once
  private _once: boolean;

  // Method to be run when the event occurs
  private _execute?: (...args: ClientEvents[Key]) => void;

  /**
   * @returns the name of the event
   */
  get name() {
    if (this._name === undefined) throw Error("Invalid or missing event name.");
    return this._name;
  }

  /**
   * @returns whether the event only runs once
   */
  get once() {
    return this._once;
  }

  /**
   * @returns the event handler
   */
  get execute() {
    if (this._execute === undefined)
      throw Error("Invalid or missing execute function.");
    return this._execute;
  }

  constructor(options?: Partial<Event<Key>>) {
    this._name = options?.name;
    this._once = options?.once ?? false;
    this._execute = options?.execute;
  }

  /**
   * @param input - the new value for {@link Event#once}
   * @returns The modified {@link Event} object
   */
  public setOnce(input: boolean) {
    this._once = input;
    return this;
  }

  /**
   * @param input - the new value for {@link Event#name}
   * @returns The modified {@link Event} object
   */
  public setName(input: Key) {
    this._name = input;
    return this;
  }

  /**
   * Updates the event handler of the {@link Event} object
   * @param execute - the new event handler to be stored in {@link Event#execute}
   * @returns The modified {@link Event} object
   */
  public setExecute(execute: (...args: ClientEvents[Key]) => void) {
    this._execute = execute;
    return this;
  }
}

export default Event;
