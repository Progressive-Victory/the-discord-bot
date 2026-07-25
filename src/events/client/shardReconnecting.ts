import { Event } from "@/Classes";
import { Events } from "discord.js";

export const shardReconnecting = new Event({
  name: Events.ShardReconnecting,
  execute: async (shardId) => {
    console.log("[Info] Shard reconnecting!", { shardId });
  },
});
