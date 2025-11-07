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
 * This function is used for the deletion of a Shelude event.
 * The method uses the provided event object then flags it as canceled.
 * After the cancelation process is complete, the deleted event gets recorded in the logs.
 */

export const guildScheduledEventDelete = new Event({
  name: Events.GuildScheduledEventDelete,
  execute: async (event) => {
    console.log("deleting");
    await dbConnect();
    //finds event by ID
    const res: IScheduledEvent = (
      await ScheduledEvent.find({ eventId: event.id }).sort({ _id: -1 }).exec()
    )[0] as IScheduledEvent;
    //flags event for deletion and then save
    res.status = GuildScheduledEventStatus.Canceled;
    res.save();
    //old record inseted into logs
    await logScheduledEvent(res);
  },
});
