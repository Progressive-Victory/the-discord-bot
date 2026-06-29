import { Event } from "@/Classes";
import { Events } from "discord.js";

export const shardResume = new Event({
  name: Events.ShardResume,
  execute: async (shardId, replayedEvents) => {
    console.log("[Info] Shard resumed!", { shardId, replayedEvents });
  },
});
