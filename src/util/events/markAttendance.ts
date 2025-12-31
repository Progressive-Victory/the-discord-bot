import { GuildMember, GuildScheduledEvent } from "discord.js";
import { Routes } from "../../Classes/API/ApiConnService/routes.js";
import { IAttendee } from "../../features/events/IAttendee.js";
import { IEvent } from "../../features/events/IEvent.js";
import { apiConnService } from "../api/pvapi.js";

export async function markAttendance(
  event: GuildScheduledEvent,
  member: GuildMember,
  isJoin: boolean,
  preventRedundant: boolean = false,
) {
  try {
    const resGet: Response = (await apiConnService.get(
      Routes.latestDiscordEventByDiscordId(event.id),
      undefined,
      true,
    )) as Response;

    if (!resGet.ok)
      throw Error(
        `API threw exception: ${resGet.status} ${resGet.statusText}\n${resGet.body ? await resGet.text() : ""}`,
      );

    const raw = await resGet.json();
    const data = raw[0] as IEvent;

    if (data.status !== 2)
      throw Error(`event with id: ${data.id} is not active`);

    const myAttendee: Partial<IAttendee> = {
      userDiscordId: member.id,
      dateAttendedUtc: new Date(),
      isJoin,
    } satisfies Partial<IAttendee>;

    const resPost: Response = (await apiConnService.post(
      Routes.discordEventAttendancePost(data.id, preventRedundant),
      {
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(myAttendee),
      },
      true,
    )) as Response;

    if (!resPost.ok)
      throw Error(
        `API threw exception: ${resPost.status} ${resPost.statusText}\n${resPost.body ? await resPost.text() : ""}`,
      );
  } catch (e) {
    console.error(e);
  }
}
