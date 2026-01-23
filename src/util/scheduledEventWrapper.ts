import createCsvWriter from "csv-writer";
import { GuildMember, GuildScheduledEventStatus, time } from "discord.js";
import { IDiscordEvent } from "../features/events/IDiscordEvent.js";
import { client } from "../index.js";

export class ScheduledEventWrapper {
  event: IDiscordEvent;

  statusColor = () => {
    let color: number;
    switch (this.event.status) {
      case 1: // scheduled = completed = blue
        color = 0x3498db;
        break;
      case 2: // active = green
        color = 0x57f386;
        break;
      case 3: // completed = blue
        color = 0x3498db;
        break;
      case 4: // cancelled = red
        color = 0xed4245;
        break;
      default: // undefined = white
        color = 0xffffff;
    }

    return color;
  };

  duration = () => {
    if (!this.event.startedAtUtc) {
      return "N/A";
    } else {
      if (!this.event.endedAtUtc) {
        return "N/A";
      } else {
        console.log("calculating duration");
        return Math.round(
          (this.event.endedAtUtc.getTime() -
            this.event.startedAtUtc.getTime()) /
            60000,
        );
      }
    }
  };

  guild = async () => {
    if (!process.env.PV_GUILD_ID)
      throw Error("fill out 'PV_GUILD_ID' in env file");
    return await client.guilds.fetch(process.env.PV_GUILD_ID);
  };

  guildEvent = async () => {
    return await (
      await this.guild()
    ).scheduledEvents.fetch(this.event.discordId);
  };

  channel = async () => {
    return this.event.channelId
      ? await (await this.guild()).channels.fetch(this.event.channelId)
      : null;
  };

  createdAt = () => {
    return time(this.event.createdAtUtc);
  };

  description = () => {
    return this.event.description ? this.event.description : "None";
  };

  creator = async () => {
    return (await this.guild()).members.fetch(this.event.creatorDiscordId);
  };

  scheduledEnd = () => {
    return this.event.scheduledEndUtc
      ? time(this.event.scheduledEndUtc)
      : "None";
  };

  scheduledStart = () => {
    return this.event.scheduledStartUtc
      ? time(this.event.scheduledStartUtc)
      : "None";
  };

  scheduledStartDate = () => {
    return this.event.scheduledStartUtc
      ? time(this.event.scheduledStartUtc, "D")
      : "None";
  };

  scheduledStartTime = () => {
    return this.event.scheduledStartUtc
      ? time(this.event.scheduledStartUtc, "t")
      : "None";
  };

  scheduledEndTime = () => {
    return this.event.scheduledEndUtc
      ? time(this.event.scheduledEndUtc, "t")
      : "None";
  };

  startDate = () => {
    return this.event.startedAtUtc
      ? time(this.event.startedAtUtc, "D")
      : "None";
  };

  startTime = () => {
    return this.event.startedAtUtc
      ? time(this.event.startedAtUtc, "t")
      : "None";
  };

  endTime = () => {
    return this.event.endedAtUtc ? time(this.event.endedAtUtc, "t") : "None";
  };

  name = () => {
    return this.event.name;
  };

  status = () => {
    return GuildScheduledEventStatus[this.event.status];
  };

  startedAt = () => {
    return this.event.startedAtUtc ? time(this.event.startedAtUtc) : "N/A";
  };

  endedAt = () => {
    return this.event.endedAtUtc ? time(this.event.endedAtUtc) : "N/A";
  };

  attendees = () => {
    if (!this.event.attendees)
      throw Error("No attendees defined on event: " + this.event.id);
    const users: string[] = [];
    this.event.attendees.map((obj) => {
      //gonna need some refactoring with joins or some bullshit
      users.push(
        `<@${obj.userDiscordId}> ${obj.isJoin ? "joined" : "left"} at ${this.getFormattedTime(obj.dateAttendedUtc)}`,
      );
    });
    return users;
  };

  userCount = () => {
    return this.event.userCount;
  };

  recurrence = () => {
    return this.event.recurrent ? "Recurring" : "One Time";
  };

  thumbnail = () => {
    return this.event.thumbnailUrl;
  };

  eventLink = async () => {
    const guild = await this.guild();
    const res = await guild.scheduledEvents.fetch(this.event.discordId);
    return res.url;
  };

  attendeesNames = async () => {
    if (!this.event.attendees)
      throw Error("No attendees defined on event: " + this.event.id);
    const usrIds: string[] = [];
    this.event.attendees.map((obj) => {
      if (!usrIds.includes(obj.userDiscordId)) usrIds.push(obj.userDiscordId);
    });
    const nameMap = await this.getAttendeeNames(usrIds);
    const entries = await this.attendees();
    return this.populateNames(entries, nameMap);
  };

  uniqueAttendees = () => {
    if (!this.event.attendees)
      throw Error("No attendees defined on event: " + this.event.id);
    const usrIds: string[] = [];
    this.event.attendees.map((obj) => {
      if (!usrIds.includes(obj.userDiscordId)) usrIds.push(obj.userDiscordId);
    });
    return usrIds.length;
  };

  attendancePercentages = () => {
    const users: string[] = [];
    this.calculateAttendancePercentages()?.forEach(
      (percentage: number, id: string) => {
        users.push(`<@${id}> attended ${percentage}% of the event`);
      },
    );

    return users;
  };

  constructor(ev: IDiscordEvent) {
    this.event = ev;
  }

  public async writeCsvDump() {
    if (!this.event.attendees)
      throw Error("No attendees defined on event: " + this.event.id);
    console.log("writing csv dump");
    const names = await this.getAttendeeNames(
      this.event.attendees.map((entry) => {
        return entry.userDiscordId;
      }),
    );
    const writer = createCsvWriter.createObjectCsvWriter({
      path: "./assets/temp/attendees.csv",
      header: ["timestamp", "id", "displayName", "join"],
      fieldDelimiter: ";",
    });

    const data = this.event.attendees.map((entry) => {
      return {
        dateAttendedUtc: entry.dateAttendedUtc,
        id: entry.id,
        userDiscordId: entry.userDiscordId,
        displayName: names.get(entry.userDiscordId) ?? "unknown",
        mode: entry.isJoin ? "join" : "leave",
      };
    });

    await writer.writeRecords(data).catch((err) => console.error(err));
    console.log("csv written");
  }

  private populateNames(entries: string[], nameMap: Map<string, string>) {
    return entries.map((entry) => {
      const id = entry.slice(2, 20);
      console.log(id);
      return `${entry.replace(`<@${id}>`, nameMap.get(id) ?? "undefined")}\n`;
    });
  }

  private getFormattedTime(time: Date) {
    const tzOffset = time.getTimezoneOffset() / 60;
    return `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()} UTC${tzOffset < 0 ? "-" : "+"}${tzOffset}`;
  }

  private async getAttendeeNames(ids: string[]) {
    const buffer = [];
    const names: Map<string, string> = new Map();
    for (let i = 0; i < Math.ceil(ids.length / 100); i++) {
      const slice = ids.slice(
        i * 100,
        i * 100 + (ids.length - i * 100 > 0 ? 100 : ids.length - i * 100),
      );
      buffer.push(slice);
    }

    const guild = await this.guild();
    console.log(`buffer = ${buffer}`);

    for (let i = 0; i < buffer.length; i++) {
      const res = await guild.members.fetch({ user: buffer[i] });
      res.forEach((value: GuildMember, key: string) => {
        names.set(key, value.displayName);
      });
    }

    console.log(`names = ${names}`);

    return names;
  }

  private calculateAttendanceTime() {
    interface joinLeavePair {
      userDiscordId: string;
      join: Date;
      leave: Date | null;
    }

    try {
      const joinLeavePairs: joinLeavePair[] = [];
      const attendanceTotals: Map<string, number> = new Map<string, number>();

      if (!this.event.attendees)
        throw Error("No attendees defined on event: " + this.event.id);
      console.log(this.event.attendees);
      this.event.attendees.forEach((entry) => {
        if (entry.isJoin) {
          joinLeavePairs.push({
            userDiscordId: entry.userDiscordId,
            join: entry.dateAttendedUtc,
            leave: null,
          });
        } else {
          const existingPair = joinLeavePairs.findLast(
            (x) => x.userDiscordId === entry.userDiscordId,
          );
          if (!existingPair)
            throw Error(
              "Leave entry unaccompanied by join entry in attendance tracking.",
            );
          existingPair.leave = entry.dateAttendedUtc;
        }
      });

      joinLeavePairs.forEach((pair) => {
        if (!pair.leave) {
          const lastIdPair =
            joinLeavePairs.findLast(
              (x) => x.userDiscordId === pair.userDiscordId,
            )?.join === pair.join;
          if (!lastIdPair)
            throw Error(
              "Missing leave timestamp in attendance calculation pairs",
            );
          if (!this.event.endedAtUtc)
            throw Error(
              "Attempting to calculate attendance for unfinished event: " +
                this.event.id,
            );
          pair.leave = this.event.endedAtUtc;
        }

        console.log("getting pair duration");
        console.log(typeof pair.join);
        const pairDuration = pair.leave.getTime() - pair.join.getTime();

        attendanceTotals.set(
          pair.userDiscordId,
          (attendanceTotals.get(pair.userDiscordId) ?? 0) + pairDuration,
        );
      });

      return attendanceTotals;
    } catch (err) {
      console.error(err);
    }
  }

  private calculateAttendancePercentages() {
    try {
      if (!this.event.endedAtUtc || !this.event.startedAtUtc)
        throw Error(
          "Attempting to calculate attendance percentages without defined start and end times on event: " +
            this.event.id,
        );
      const totals = this.calculateAttendanceTime();
      console.log("duration start");
      const eventDuration =
        this.event.endedAtUtc.getTime() - this.event.startedAtUtc.getTime();
      console.log("duration end");
      const percentages: Map<string, number> = new Map<string, number>();
      if (!totals) throw Error("Failed to calculate attendance totals");

      totals.forEach((value: number, key: string) => {
        percentages.set(key, Math.round((value / eventDuration) * 100));
      });

      return percentages;
    } catch (err) {
      console.error(err);
    }
  }
}
