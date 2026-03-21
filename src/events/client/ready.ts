import { Event } from "@/Classes";
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
    const pvGuild = await client.guilds.fetch(process.env.PV_GUILD_ID!);
    console.log("[Info] Fetching all PV members");
    await pvGuild.members.fetch();
    console.log(
      `[Debug] Current members in cache for ${pvGuild.name} is ${pvGuild.members.cache.size} out of reported ${pvGuild.memberCount}`,
    );
    console.log(`[Info] Ready! Logged in as ${client.user.username}`);
  },
});
