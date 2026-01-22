import { GuildMember, GuildScheduledEvent } from "discord.js";
import { Routes } from "../../Classes/API/ApiConnService/routes.js";
import { IAttendee } from "../../features/events/IAttendee.js";
import { IEvent, zEvent } from "../../features/events/IEvent.js";
import { apiConnService } from "../api/pvapi.js";

export async function markAttendance(
  event: GuildScheduledEvent,
  member: GuildMember,
  isJoin: boolean,
  preventRedundant: boolean = false,
) {
  try {
    const data: IEvent = await apiConnService.get<IEvent>(
      Routes.latestDiscordEvent(event.id),
      zEvent,
    );

    if (data.status !== 2)
      throw Error(`event with id: ${data.id} is not active`);

    const myAttendee: Partial<IAttendee> = {
      userDiscordId: member.id,
      dateAttendedUtc: new Date(),
      isJoin,
    } satisfies Partial<IAttendee>;

    const query = new URLSearchParams();
    query.set("prevent_redundant", preventRedundant.toString());

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
