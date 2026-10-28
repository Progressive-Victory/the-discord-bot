import { Event } from "@/Classes";
import { apiConnService } from "@/util/api/pvapi";
import { Events } from "discord.js";

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
    console.log(`[Info] Ready! Logged in as ${client.user.username}`);
    apiConnService.init(process.env.PV_API_URL!);
    apiConnService.auth(process.env.PV_DISCORD_TOKEN!);
    console.log("Authenticate with the api!");
  },
});
