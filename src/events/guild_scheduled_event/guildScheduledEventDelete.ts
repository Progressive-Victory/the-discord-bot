import { Events, GuildScheduledEventStatus } from "discord.js";
import { Event } from "../../Classes/Event.js";
import { logScheduledEvent } from "../../features/logging/scheduledEvent.js";
import {
  IScheduledEvent,
  ScheduledEvent,
} from "../../models/ScheduledEvent.js";
import dbConnect from "../../util/libmongo.js";

/**
 * `guildScheduledEventDelete`
 * handles the {@link Events.guildScheduledEventDelete}
 * {@link Event}.
 * Flags scheduled event as canceled in database.
 */

export const guildScheduledEventDelete = new Event({
  name: Events.GuildScheduledEventDelete,
  execute: async (event) => {
    console.log("deleting");
    await dbConnect();
    // Finds event by ID
    const res: IScheduledEvent = (
      await ScheduledEvent.find({ eventId: event.id }).sort({ _id: -1 }).exec()
    )[0] as IScheduledEvent;
    // Flags event for deletion and then save
    res.status = GuildScheduledEventStatus.Canceled;
    res.save();
    // Old record inseted into logs
    await logScheduledEvent(res);
  },
});
