import { Routes } from "@/Classes/API/ApiConnService/routes";
import { Event } from "@/Classes/Event";
import {
  DiscordEvent,
  DiscordEventStatus,
  zDiscordEvent,
} from "@/contracts/data";
import {
  CreateDiscordEventRequest,
  zCreateDiscordEventRequest,
} from "@/contracts/requests/CreateDiscordEventRequest";
import { logScheduledEvent } from "@/features/logging/scheduledEvent";
import { apiConnService } from "@/util/api/pvapi";
import { markAttendance } from "@/util/events/markAttendance";
import { Events } from "discord.js";
import z from "zod";

/**
 * `guildScheduledEventUpdate` handles the {@link Events.guildScheduledEventUpdate}
 * {@link Event}.
 * This event is used to update or overwrite guild events on the discord server.
 * Using the oldEvent and newEvent parameters, the function updates the currently saved oldEvent with newEvent.
 * After the update completes, the updated event is logged.
 * If the current event is a recurring event that is active, and the updated event is scheduled. It will update the recurring event ending today and log it.
 * If the event is one-time and the Oldevent is marked active, and the new event is marked completed. It will update the one-time event ending today and log it.
 */
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

      // Event Started - creates new "occurrence"
      if (oldEvent.isScheduled() && newEvent.isActive()) {
        const eventCreateRequest: CreateDiscordEventRequest = {
          discordId: newEvent.id,
          channelId: newEvent.channelId,
          name: newEvent.name,
          description: newEvent.description ?? null,
          status: newEvent.status as number as DiscordEventStatus,
          recurrent: newEvent.recurrenceRule ? true : false,
          userCount: null,
          startedAtUtc: new Date(),
          endedAtUtc: null,
          thumbnailUrl: newEvent.coverImageURL(),
          createdAtUtc: newEvent.createdAt,
          creatorDiscordId: newEvent.creatorId,
          scheduledStartUtc: newEvent.scheduledStartAt,
          scheduledEndUtc: newEvent.scheduledEndAt ?? null,
        };

        eventCreateRequest.startedAtUtc = new Date();
        eventCreateRequest.status = DiscordEventStatus.Active;
        eventCreateRequest.userCount = newEvent.userCount;

        const myWholeEvent = await apiConnService.post<DiscordEvent>(
          Routes.discordEvents,
          {
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(
              z.parse(zCreateDiscordEventRequest, eventCreateRequest),
            ),
          },
          zDiscordEvent,
        );

        await logScheduledEvent(myWholeEvent, true);

        const channelFresh = await newEvent.channel?.fetch();

        channelFresh?.members.forEach(async (usr) => {
          await markAttendance(newEvent, usr, true, true);
        });
      }

      // Event updated
      else {
        // get the object in our db
        const data: DiscordEvent = await apiConnService.get<DiscordEvent>(
          Routes.latestDiscordEvent(newEvent.id),
          zDiscordEvent,
        );

        data.discordId = newEvent.id;
        data.channelId = newEvent.channelId;
        data.name = newEvent.name;
        data.description = newEvent.description;
        data.status = newEvent.status as number as DiscordEventStatus;
        data.recurrent = newEvent.recurrenceRule ? true : false;
        // when an event is cancelled, this gets nulled; we still want it:
        data.userCount = newEvent.userCount ?? data.userCount;
        data.endedAtUtc =
          oldEvent.isActive() && !newEvent.isActive() ? new Date() : null;
        data.thumbnailUrl = newEvent.coverImageURL();
        data.createdAtUtc = newEvent.createdAt;
        data.creatorDiscordId = newEvent.creatorId;
        // when an event is cancelled, these also get nulled; we still want them:
        data.scheduledStartUtc =
          newEvent.scheduledStartAt ?? data.scheduledStartUtc;
        data.scheduledEndUtc = newEvent.scheduledEndAt ?? data.scheduledEndUtc;

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
