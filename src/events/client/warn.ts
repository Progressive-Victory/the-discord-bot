import { Events } from "discord.js";
import { Event } from "../../Classes/index.js";

/**
 * The `warn` {@link Event} handles emission of WARN logs
 */
export const warn = new Event({
  name: Events.Warn,
  execute: (info: string) => console.warn(info),
});
