import { Events } from "discord.js";
import { Event } from "../../Classes/index.js";

/**
 * The `error` {@link Event} handles emission of ERROR logs
 */
export const error = new Event({
  name: Events.Error,
  execute: (error: Error) => console.error(error),
});
