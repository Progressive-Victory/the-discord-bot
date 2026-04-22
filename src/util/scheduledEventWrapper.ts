import { DiscordEvent } from "@/contracts/data";
import { createObjectCsvWriter } from "csv-writer";
import { GuildMember, GuildScheduledEventStatus, time } from "discord.js";
import { client } from "..";

/**
 * Wrapper class for "DiscordEvent"
 * Meant to provide easier access and some useful utility functions
 */
export class ScheduledEventWrapper {
  event: DiscordEvent;

  /**
   * Utility function for getting a color representation of the event's status
   * @returns blue for completed; green for active; red for canceled; white for undefined
   */
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

  /**
   * Utility function for getting the duration of the event
   * @returns time in minutes that an event went on; "N/A" if event hasn't finished yet.
   */
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

  /**
   * Utility function to fetch guild id for this bot (defined in env file)
   * @returns guild id
   */
  guild = async () => {
    if (!process.env.PV_GUILD_ID)
      throw Error("fill out 'PV_GUILD_ID' in env file");
    return await client.guilds.fetch(process.env.PV_GUILD_ID);
  };

  /**
   * Utility function to get up to date DiscordEvent from this ScheduledEventWrapper
   * @returns DiscordEvent
   */
  guildEvent = async () => {
    return await (
      await this.guild()
    ).scheduledEvents.fetch(this.event.discordId);
  };

  /**
   * Utility fucntion to find this event's channel
   * @returns GuildBasedChannel
   */
  channel = async () => {
    return this.event.channelId
      ? await (await this.guild()).channels.fetch(this.event.channelId)
      : null;
  };

  /**
   * Utility function for fetching the time this event was created
   * @returns string representation of time created
   */
  createdAt = () => {
    return time(this.event.createdAtUtc);
  };

  /**
   * Utility function to fetch event description
   * @returns DiscordEvent.description
   */
  description = () => {
    return this.event.description ? this.event.description : "None";
  };

  /**
   * Utility fucntion to fetch the member who created this event
   * @returns Guildmember who created this event
   */
  creator = async () => {
    return (await this.guild()).members.fetch(this.event.creatorDiscordId);
  };

  /**
   * Utility function to fetch time when event ended
   * @returns string representation of time ended or "None" if the event hasn't ended
   */
  scheduledEnd = () => {
    return this.event.scheduledEndUtc
      ? time(this.event.scheduledEndUtc)
      : "None";
  };

  /**
   * Utility function to fetch current scheduled start time
   * @returns string representation of start time or "None" if the event hasn't been scheduled
   */
  scheduledStart = () => {
    return this.event.scheduledStartUtc
      ? time(this.event.scheduledStartUtc)
      : "None";
  };

  /**
   * Utility function to fetch current scheduled start date
   * @returns string representation of start date or "None" if the event hasn't been scheduled
   */
  scheduledStartDate = () => {
    return this.event.scheduledStartUtc
      ? time(this.event.scheduledStartUtc, "D")
      : "None";
  };

  /**
   * Utility function to fetch the time of day when this event is planned to start
   * @returns string representation of time of day for event start or "None" if the event hasn't been scheduled
   */
  scheduledStartTime = () => {
    return this.event.scheduledStartUtc
      ? time(this.event.scheduledStartUtc, "t")
      : "None";
  };

  /**
   * Utility function to fech the time of day the event is scheduled to end
   * @returns string representation of the time of day for this event to end or "None" if the event's end hasn't been scheduled
   */
  scheduledEndTime = () => {
    return this.event.scheduledEndUtc
      ? time(this.event.scheduledEndUtc, "t")
      : "None";
  };

  /**
   * Utility function to fetch the date that this event started
   * @returns string representation of the date this event started or "None" if this event hasn't begun
   */
  startDate = () => {
    return this.event.startedAtUtc
      ? time(this.event.startedAtUtc, "D")
      : "None";
  };

  /**
   * Utility function to fetch the time of day when this event was started
   * @returns string representation of time of day when this event started or "None" if this event hasn't begun
   */
  startTime = () => {
    return this.event.startedAtUtc
      ? time(this.event.startedAtUtc, "t")
      : "None";
  };

  /**
   * Utility function to fetch the time of day when this event was ended
   * @returns string representation of the time of day when this event ended or "None" if this event hasn't ended
   */
  endTime = () => {
    return this.event.endedAtUtc ? time(this.event.endedAtUtc, "t") : "None";
  };

  /**
   * Utility function for fetcing the event's name
   * @returns DiscordEvent.name
   */
  name = () => {
    return this.event.name;
  };

  /**
   * Utility function for fetching this event's status
   * @returns GuildScheduledEventStatus
   */
  status = () => {
    return GuildScheduledEventStatus[this.event.status ?? 1];
  };

  /**
   * Utility function to fetch date and time when this event started
   * @returns string representation of event start time or "N/A" if event hasn't started
   */
  startedAt = () => {
    return this.event.startedAtUtc ? time(this.event.startedAtUtc) : "N/A";
  };

  /**
   * Utility function to fetch date and time when this event ended
   * @returns string representation of event end time or "N/A" if event hasn't ended
   */
  endedAt = () => {
    return this.event.endedAtUtc ? time(this.event.endedAtUtc) : "N/A";
  };

  /**
   * Utility function to fetch a list of join and leave events formatted as strings
   * @returns string[] of all user join and leave events
   */
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

  /**
   * Utility function to fetch the event user count
   * @returns DiscordEvent.userCount
   */
  userCount = () => {
    return this.event.userCount;
  };

  /**
   * Utility function to fetch information about if this event is recurring
   * @returns "Recurring" or "One Time"
   */
  recurrence = () => {
    return this.event.recurrent ? "Recurring" : "One Time";
  };

  /**
   * Utility function to fetch the thumbnail of this event
   * @returns DiscordEvent.thumbnailUrl
   */
  thumbnail = () => {
    return this.event.thumbnailUrl;
  };

  /**
   * Utility function to fetch a url to this event
   * @returns GuildScheduledEvent.url
   */
  eventLink = async () => {
    const guild = await this.guild();
    const res = await guild.scheduledEvents.fetch(this.event.discordId);
    return res.url;
  };

  /**
   * Utility function to get a list of user join and leave events with their usernames instead of discord ids
   * @returns string[] of user join and leave events
   */
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

  /**
   * Utility function to fetch the number of unique users who joined this event
   * @returns number of attendees
   */
  uniqueAttendees = () => {
    if (!this.event.attendees)
      throw Error("No attendees defined on event: " + this.event.id);
    const usrIds: string[] = [];
    this.event.attendees.map((obj) => {
      if (!usrIds.includes(obj.userDiscordId)) usrIds.push(obj.userDiscordId);
    });
    return usrIds.length;
  };

  /**
   * Utility function to fetch the percentage of the event each user was present for
   * @returns string[] of userids and their attendance percentages
   */
  attendancePercentages = () => {
    const users: string[] = [];
    this.calculateAttendancePercentages()?.forEach(
      (percentage: number, id: string) => {
        users.push(`<@${id}> attended ${percentage}% of the event`);
      },
    );

    return users;
  };

  /**
   * Make a new ScheduledEventWrapper from a DiscordEvent
   * @param ev source discord event
   */
  constructor(ev: DiscordEvent) {
    this.event = ev;
  }

  /**
   * Utility function to dump event attendance details into a csv file "./assets/temp/attendees.csv"
   */
  public async writeCsvDump() {
    if (!this.event.attendees)
      throw Error("No attendees defined on event: " + this.event.id);
    console.log("writing csv dump");
    const names = await this.getAttendeeNames(
      this.event.attendees.map((entry) => {
        return entry.userDiscordId;
      }),
    );
    const writer = createObjectCsvWriter({
      path: "./assets/temp/attendees.csv",
      header: ["timestamp", "id", "discordId", "displayName", "join"],
      fieldDelimiter: ";",
    });

    const data = this.event.attendees.map((entry) => ({
      timestamp: entry.dateAttendedUtc.toISOString(),
      id: entry.id,
      discordId: entry.userDiscordId,
      displayName: names.get(entry.userDiscordId) ?? "unknown",
      join: entry.isJoin ? "join" : "leave",
    }));

    console.log(data);

    await writer.writeRecords(data).catch((err) => console.error(err));
    console.log("csv written");
  }

  /**
   * private function for replacing occurrances of <@'id'> with a users username
   * @param entries list of strings that need this replacement (see ScheduledEventWrapper.attendees())
   * @param nameMap map keyed with ids to fetch names (see ScheduledEventWrapper.getAtendeeNames())
   * @returns new list of entries where <@'id'> is replaced with users names
   */
  private populateNames(entries: string[], nameMap: Map<string, string>) {
    return entries.map((entry) => {
      const id = entry.slice(2, 20);
      console.log(id);
      return `${entry.replace(`<@${id}>`, nameMap.get(id) ?? "undefined")}\n`;
    });
  }

  /**
   * private function for custom time formatting
   * @param time "Date" object for time to be formatted
   * @returns properly formatted string representation of given time
   */
  private getFormattedTime(time: Date) {
    const tzOffset = time.getTimezoneOffset() / 60;
    return `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()} UTC${tzOffset < 0 ? "-" : "+"}${tzOffset}`;
  }

  /**
   * private function to fetch atendees usernames based on their guild nickname
   * @param ids list of user ids
   * @returns map for getting a users name from their id
   */
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

  /**
   * private function for calculating user attendance to an event
   * @returns map of total time a user attended this event, keyed by their user id
   */
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

  /**
   * private function for finding the total percentage of the event any given attendee was present for
   * @returns map of attendence percentages, keyed by user id
   */
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
