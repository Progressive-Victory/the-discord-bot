import { Event } from "@/Classes";
import { client } from "@/index";
import { Events } from "discord.js";

/**
 * The `ready` event {@link Event} registers a event handler for the
 * {@link Events.ClientReady} event
 */
export const shardReady = new Event({
  name: Events.ShardReady,
  execute: async () => {
    const pvGuild = await client.guilds.fetch(process.env.PV_GUILD_ID!);

    await Promise.all([
      async () => {
        console.log("[Info] Fetching all PV members");
        await pvGuild.members.fetch();
        console.log(`[Info] ${pvGuild.members.cache.size} Members in cache`);
      },
      async () => {
        console.log("[Info] Fetching all PV Discord Events");
        await pvGuild.scheduledEvents.fetch();
        console.log(
          `[Info] ${pvGuild.scheduledEvents.cache.size} Events in cache`,
        );
      },
    ]);
  },
});
