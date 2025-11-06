import createCsvWriter from "csv-writer";
import { GuildMember, GuildScheduledEventStatus, time } from "discord.js";
import { client } from "../index.js";
import { IScheduledEvent } from "../models/ScheduledEvent.js";

export class ScheduledEventWrapper {
  event: IScheduledEvent;

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
    let names: Map<string, string> = new Map();
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
}
