import { Event } from "@/Classes";
import { Routes } from "@/Classes/API/ApiConnService";
import {
  DiscordEvent,
  DiscordEventStatus,
  zDiscordEvent,
} from "@/contracts/data";
import { logScheduledEvent } from "@/features/logging/scheduledEvent";
import { apiConnService } from "@/util/api/pvapi";
import { Events } from "discord.js";
import z from "zod";

export const guildScheduledEventDelete = new Event({
  name: Events.GuildScheduledEventDelete,
  execute: async (event) => {
    const data: DiscordEvent = await apiConnService.get<DiscordEvent>(
      Routes.latestDiscordEvent(event.id),
      zDiscordEvent,
    );

    data.status = DiscordEventStatus.Cancelled;
    const parsed = z.parse(zDiscordEvent, data);
    await apiConnService.patch(Routes.discordEvent(parsed.id), {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed),
    });

    logScheduledEvent(parsed, false);
  },
});
