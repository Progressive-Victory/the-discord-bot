import { Routes } from "@/Classes/API/ApiConnService/routes";
import { Event } from "@/Classes/Event";
import { IEvent, zEvent } from "@/features/events/IEvent";
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

      // map event interface
      if (!newEvent.channelId)
        throw Error("No channel id specified for event: " + newEvent.id);
      if (!newEvent.creatorId)
        throw Error("No creator specified for event: " + newEvent.id);
      if (!newEvent.scheduledStartAt)
        throw Error("No start time specified for event: " + newEvent.id);
      const myEvent: Partial<IEvent> = {
        discordId: newEvent.id,
        channelId: newEvent.channelId,
        name: newEvent.name,
        description: newEvent.description ?? undefined,
        status: newEvent.status,
        recurrent: newEvent.recurrenceRule ? true : false,
        thumbnailUrl: newEvent.coverImageURL() ?? "attachment://image.jpg",
        createdAtUtc: newEvent.createdAt,
        creatorDiscordId: newEvent.creatorId,
        scheduledStartUtc: newEvent.scheduledStartAt,
        scheduledEndUtc: newEvent.scheduledEndAt ?? undefined,
      } satisfies Partial<IEvent>;

      // Event Started
      if (oldEvent.isScheduled() && newEvent.isActive()) {
        myEvent.startedAtUtc = new Date();
        myEvent.status = 2;

        const id: number = await apiConnService.post<number>(
          Routes.discordEvents,
          {
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(myEvent),
          },
          z.number(),
        );

        myEvent.id = id;

        const myWholeEvent: IEvent = z.parse(zEvent, myEvent);

        await logScheduledEvent(myWholeEvent, true);

        console.log(myWholeEvent.id);

        const channelFresh = await newEvent.channel?.fetch();

        channelFresh?.members.forEach(async (usr) => {
          await markAttendance(newEvent, usr, true, true);
        });
      }

      // Event Ended
      else if (oldEvent.isActive() && !newEvent.isActive()) {
        const data: IEvent = await apiConnService.get<IEvent>(
          Routes.latestDiscordEvent(newEvent.id),
          zEvent,
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

        const myWholeEvent = z.parse(zEvent, data);

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
