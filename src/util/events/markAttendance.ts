import { Routes } from "@/Classes/API/ApiConnService/routes";
import { DiscordEvent, zDiscordEvent } from "@/contracts/data";
import { CreateDiscordEventAttendeeRequest } from "@/contracts/requests/CreateDiscordEventAttendeeRequest";
import { GuildMember, GuildScheduledEvent } from "discord.js";
import { apiConnService } from "../api/pvapi";

export async function markAttendance(
  event: GuildScheduledEvent,
  member: GuildMember,
  isJoin: boolean,
  preventRedundant: boolean = false,
) {
  try {
    const data: DiscordEvent = await apiConnService.get<DiscordEvent>(
      Routes.latestDiscordEvent(event.id),
      zDiscordEvent,
    );

    if (data.status !== 2)
      throw Error(`event with id: ${data.id} is not active`);

    if (!data.startedAtUtc)
      throw Error(
        `Event ${event.id} has no start time but claims to be active`,
      );

    if (Date.now() - data.startedAtUtc.getTime() < 5000)
      preventRedundant = true;

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
