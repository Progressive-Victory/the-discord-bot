import { Event } from "@/Classes";
import { Events } from "discord.js";

/**
 * The `debug` {@link Event} handles emission of DEBUG logs
 */
export const debug = new Event({
  name: Events.Debug,
  execute: async (info) => {
    if (info.startsWith("[WS => ") || info.startsWith("[object")) return;
    console.debug(info);
  },
});
