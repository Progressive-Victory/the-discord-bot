import { Events } from "discord.js";
import z from "zod";
import { Routes } from "../../Classes/API/ApiConnService/routes.js";
import { Event } from "../../Classes/Event.js";
import { IEvent, zEvent } from "../../features/events/IEvent.js";
import { logScheduledEvent } from "../../features/logging/scheduledEvent.js";
import { apiConnService } from "../../util/api/pvapi.js";
import { markAttendance } from "../../util/events/markAttendance.js";

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

      console.log(myEvent);

      // Event Started
      if (oldEvent.isScheduled() && newEvent.isActive()) {
        myEvent.startedAtUtc = new Date();
        myEvent.status = 2;

        console.log("my event");
        console.log(myEvent);
        const res: Response = (await apiConnService.post(
          Routes.discordEvents,
          {
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(myEvent),
          },
          true,
        )) as Response;

        if (!res.ok)
          throw Error(
            `API threw exception: ${res.status} ${res.statusText}\n${res.body ? await res.text() : ""}`,
          );

        const { id } = await res.json();
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
        const resGet: Response = (await apiConnService.get(
          Routes.latestDiscordEventByDiscordId(newEvent.id),
          undefined,
          true,
        )) as Response;

        if (!resGet.ok)
          throw Error(
            `API threw exception: ${resGet.status} ${resGet.statusText}\n${resGet.body ? await resGet.text() : ""}`,
          );

        const raw = await resGet.json();

        const data = raw[0];

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

        console.log(data);
        const myWholeEvent = z.parse(zEvent, data);

        const resPatch: Response = (await apiConnService.patch(
          Routes.discordEventPatch(myWholeEvent.id),
          {
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(myWholeEvent),
          },
          true,
        )) as Response;

        if (!resPatch.ok)
          throw Error(
            `API threw exception: ${resPatch.status} ${resPatch.statusText}\n${resPatch.body ? await resPatch.text() : ""}`,
          );

        logScheduledEvent(myWholeEvent, false);
      }
    } catch (e) {
      console.error(e);
    }
  },
});
