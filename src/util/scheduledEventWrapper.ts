import { GuildScheduledEventStatus, time } from "discord.js";
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

  attendees = async () => {
    const users = this.event.attendees.map((usr) => {
      return `<@${usr}>`;
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
    return await this.getAttendeeNames(this.event.attendees);
  };

  constructor(ev: IScheduledEvent) {
    this.event = ev;
  }

  private async getAttendeeNames(ids: string[]) {
    const buffer = [];
    let names: string[] = [];
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
      const res = (await guild.members.fetch({ user: buffer[i] }))
        .values()
        .toArray();
      console.log(`res: ${res}`);
      const out = res.map((usr) => {
        return usr.displayName;
      });
      names = [...names, ...out];
    }

    console.log(`names = ${names}`);

    return names;
  }
}
