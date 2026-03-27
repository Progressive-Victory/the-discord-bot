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
    console.log("[Info] Fetching all PV members");
    await pvGuild.members.fetch();
    console.log(`[Info] Ready! Logged in as ${client.user.username}`);
  },
});
