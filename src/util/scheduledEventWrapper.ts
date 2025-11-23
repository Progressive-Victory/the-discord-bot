import createCsvWriter from "csv-writer";
import { GuildMember, GuildScheduledEventStatus, time } from "discord.js";
import { client } from "../index.js";
import { IScheduledEvent } from "../models/ScheduledEvent.js";
/**
 *
 * Wrapper class that returns a Schelude event for end user comsumption
 * @returns{@link ScheduledEventWrapper}
 */
export class ScheduledEventWrapper {
  event: IScheduledEvent;

  statusColor = () => {
    let color: number;
    switch (this.event.status) {
      case 1: // Scheduled = completed = blue
        color = 0x3498db;
        break;
      case 2: // Active = green
        color = 0x57f386;
        break;
      case 3: // Completed = blue
        color = 0x3498db;
        break;
      case 4: // Cancelled = red
        color = 0xed4245;
        break;
      default: // Undefined = white
        color = 0xffffff;
    }

    return color;
  };

  duration = () => {
    if (!this.event.startedAt) {
      return "N/A";
    } else {
      if (!this.event.endedAt) {
        return "N/A";
      } else {
        return Math.round(
          (this.event.endedAt.getTime() - this.event.startedAt.getTime()) /
            60000,
        );
      }
    }
  };

  guild = async () => {
    return await client.guilds.fetch(this.event.guildId);
  };

  guildEvent = async () => {
    return await (await this.guild()).scheduledEvents.fetch(this.event.id);
  };

  channel = async () => {
    return this.event.channelId
      ? await (await this.guild()).channels.fetch(this.event.channelId)
      : null;
  };

  createdAt = () => {
    return time(this.event.createdAt);
  };

  description = () => {
    return this.event.description ? this.event.description : "None";
  };

  creator = async () => {
    return (await this.guild()).members.fetch(this.event.creatorId);
  };

  scheduledEnd = () => {
    return this.event.scheduledEnd ? time(this.event.scheduledEnd) : "None";
  };

  scheduledStart = () => {
    return this.event.scheduledStart ? time(this.event.scheduledStart) : "None";
  };

  scheduledStartDate = () => {
    return this.event.scheduledStart
      ? time(this.event.scheduledStart, "D")
      : "None";
  };

  scheduledStartTime = () => {
    return this.event.scheduledStart
      ? time(this.event.scheduledStart, "t")
      : "None";
  };

  scheduledEndTime = () => {
    return this.event.scheduledEnd
      ? time(this.event.scheduledEnd, "t")
      : "None";
  };

  startDate = () => {
    return this.event.startedAt ? time(this.event.startedAt, "D") : "None";
  };

  startTime = () => {
    return this.event.startedAt ? time(this.event.startedAt, "t") : "None";
  };

  endTime = () => {
    return this.event.endedAt ? time(this.event.endedAt, "t") : "None";
  };

  name = () => {
    return this.event.name;
  };

  status = () => {
    return GuildScheduledEventStatus[this.event.status];
  };

  startedAt = () => {
    return this.event.startedAt ? time(this.event.startedAt) : "N/A";
  };

  endedAt = () => {
    return this.event.endedAt ? time(this.event.endedAt) : "N/A";
  };

  attendees = () => {
    const users: string[] = [];
    this.event.attendees.map((obj) => {
      users.push(
        `<@${obj.id}> ${obj.join ? "joined" : "left"} at ${this.getFormattedTime(obj.timestamp)}`,
      );
    });
    return users;
  };

  userCount = () => {
    return this.event.userCount;
  };

  recurrence = () => {
    return this.event.recurrence ? "Recurring" : "One Time";
  };

  thumbnail = () => {
    return this.event.thumbnailUrl;
  };

  eventLink = () => {
    return this.event.eventUrl;
  };

  attendeesNames = async () => {
    const usrIds: string[] = [];
    this.event.attendees.map((obj) => {
      if (!usrIds.includes(obj.id)) usrIds.push(obj.id);
    });
    const nameMap = await this.getAttendeeNames(usrIds);
    const entries = await this.attendees();
    return this.populateNames(entries, nameMap);
  };

  uniqueAttendees = () => {
    const usrIds: string[] = [];
    this.event.attendees.map((obj) => {
      if (!usrIds.includes(obj.id)) usrIds.push(obj.id);
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

  constructor(ev: IScheduledEvent) {
    this.event = ev;
  }

  public async writeCsvDump() {
    console.log("writing csv dump");
    const names = await this.getAttendeeNames(
      this.event.attendees.map((entry) => {
        return entry.id;
      }),
    );
    const writer = createCsvWriter.createObjectCsvWriter({
      path: "./assets/temp/attendees.csv",
      header: ["timestamp", "id", "displayName", "join"],
      fieldDelimiter: ";",
    });

    const data = this.event.attendees.map((entry) => {
      return {
        timestamp: entry.timestamp,
        id: entry.id,
        displayName: names.get(entry.id) ?? "unknown",
        join: entry.join,
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
      id: string;
      join: Date;
      leave: Date | null;
    }

    try {
      const joinLeavePairs: joinLeavePair[] = [];
      const attendanceTotals: Map<string, number> = new Map<string, number>();

      this.event.attendees.forEach((entry) => {
        if (entry.join) {
          joinLeavePairs.push({
            id: entry.id,
            join: entry.timestamp,
            leave: null,
          });
        } else {
          const existingPair = joinLeavePairs.findLast(
            (x) => x.id === entry.id,
          );
          if (!existingPair)
            throw Error(
              "Leave entry unaccompanied by join entry in attendance tracking.",
            );
          existingPair.leave = entry.timestamp;
        }
      });

      joinLeavePairs.forEach((pair) => {
        if (!pair.leave) {
          const lastIdPair =
            joinLeavePairs.findLast((x) => x.id === pair.id)?.join ===
            pair.join;
          if (!lastIdPair)
            throw Error(
              "Missing leave timestamp in attendance calculation pairs",
            );
          pair.leave = this.event.endedAt;
        }

        const pairDuration = pair.leave.getTime() - pair.join.getTime();

        attendanceTotals.set(
          pair.id,
          (attendanceTotals.get(pair.id) ?? 0) + pairDuration,
        );
      });

      return attendanceTotals;
    } catch (err) {
      console.error(err);
    }
  }

  private calculateAttendancePercentages() {
    try {
      const totals = this.calculateAttendanceTime();
      const eventDuration =
        this.event.endedAt.getTime() - this.event.startedAt.getTime();
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
