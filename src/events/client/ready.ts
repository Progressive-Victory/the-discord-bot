import { Events } from "discord.js";
import { Event } from "../../Classes/index.js";

/**
 * The `ready` event {@link Event} registers a event handler for the
 * {@link Events.ClientReady} event
 */
export const ready = new Event({
  name: Events.ClientReady,
  once: true,
  /**
   * function to run on the client ready event
   * @param client - client object
   */
  execute: async (client) => {
    client.guilds.cache.forEach((g) => g.members.fetch());
    console.log(`Ready! Logged in as ${client.user.username}`);
  },
});
