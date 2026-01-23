import { Routes } from "@/Classes/API/ApiConnService/routes";
import { Event } from "@/Classes/Event";
import { DiscordEvent, zDiscordEvent } from "@/contracts/data";
import { zCreateDiscordEventRequest } from "@/contracts/requests/CreateDiscordEventRequest";
import { logScheduledEvent } from "@/features/logging/scheduledEvent";
import { apiConnService } from "@/util/api/pvapi";
import { markAttendance } from "@/util/events/markAttendance";
import { Events } from "discord.js";
import z from "zod";

export const guildScheduledEventUpdate = new Event({
  name: Events.GuildScheduledEventUpdate,
  execute: async (oldEvent, newEvent) => {
    try {
      if (!oldEvent) throw Error("No old event reported");
      console.log(+newEvent.status);

      // map event interface
      if (!newEvent.channelId)
        throw Error("No channel id specified for event: " + newEvent.id);
      if (!newEvent.creatorId)
        throw Error("No creator specified for event: " + newEvent.id);
      if (!newEvent.scheduledStartAt)
        throw Error("No start time specified for event: " + newEvent.id);
      const myEvent: Partial<DiscordEvent> = {
        discordId: newEvent.id,
        channelId: newEvent.channelId,
        name: newEvent.name,
        description: newEvent.description ?? null,
        status: 3,
        recurrent: newEvent.recurrenceRule ? true : false,
        userCount: null,
        startedAtUtc: new Date(),
        endedAtUtc: null,
        thumbnailUrl: newEvent.coverImageURL() ?? "attachment://image.jpg",
        createdAtUtc: newEvent.createdAt,
        creatorDiscordId: newEvent.creatorId,
        scheduledStartUtc: newEvent.scheduledStartAt,
        scheduledEndUtc: newEvent.scheduledEndAt ?? null,
      } satisfies Partial<DiscordEvent>;

      // Event Started
      if (oldEvent.isScheduled() && newEvent.isActive()) {
        myEvent.startedAtUtc = new Date();
        myEvent.status = 2;

        const createEventRequest = z.parse(zCreateDiscordEventRequest, myEvent);

        const id: number = await apiConnService.post<number>(
          Routes.discordEvents,
          {
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(createEventRequest),
          },
          z.number(),
        );

        myEvent.id = id;

        const myWholeEvent: DiscordEvent = z.parse(zDiscordEvent, myEvent);

        await logScheduledEvent(myWholeEvent, true);

        console.log(myWholeEvent.id);

        const channelFresh = await newEvent.channel?.fetch();

        channelFresh?.members.forEach(async (usr) => {
          await markAttendance(newEvent, usr, true, true);
        });
      }

      // Event Ended
      else if (oldEvent.isActive() && !newEvent.isActive()) {
        const data: DiscordEvent = await apiConnService.get<DiscordEvent>(
          Routes.latestDiscordEvent(newEvent.id),
          zDiscordEvent,
        );

        data.endedAtUtc = new Date();
        switch (newEvent.status) {
          case 1:
            data.status = 3;
            break;
          case 3:
            data.status = 3;
            break;
          case 4:
            data.status = 4;
            break;
        }

        const myWholeEvent = z.parse(zDiscordEvent, data);

        await apiConnService.patch(Routes.discordEvent(myWholeEvent.id), {
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(myWholeEvent),
        });

        logScheduledEvent(myWholeEvent, false);
      }
    } catch (e) {
      console.error(e);
    }
  },
});
