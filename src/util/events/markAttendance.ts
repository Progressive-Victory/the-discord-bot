import { GuildMember, GuildScheduledEvent } from "discord.js";
import { Routes } from "../../Classes/API/ApiConnService/routes.js";
import { CreateDiscordEventAttendeeRequest } from "../../features/events/CreateDiscordEventAttendeeRequest.js";
import { IDiscordEvent } from "../../features/events/IDiscordEvent.js";
import { apiConnService } from "../api/pvapi.js";

export async function markAttendance(
  event: GuildScheduledEvent,
  member: GuildMember,
  isJoin: boolean,
  preventRedundant: boolean = false,
) {
  try {
    const resGet: { data: IDiscordEvent } = (await apiConnService.get(
      Routes.latestDiscordEvent(event.id),
    )) as { data: IDiscordEvent };

    const { data } = resGet;

    if (data.status !== 2)
      throw Error(`event with id: ${data.id} is not active`);

    const myAttendee: CreateDiscordEventAttendeeRequest = {
      userDiscordId: member.id,
      dateAttendedUtc: new Date(),
      isJoin,
    };

    const query = new URLSearchParams();
    query.set("preventRedundant", preventRedundant.toString());

    await apiConnService.post(Routes.discordEventAttendance(data.id), {
      headers: {
        "Content-Type": "application/json",
      },
      query,
      body: JSON.stringify(myAttendee),
    });
  } catch (e) {
    console.error(e);
  }
}
