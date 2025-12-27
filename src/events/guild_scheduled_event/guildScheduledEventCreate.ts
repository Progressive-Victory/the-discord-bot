import { Events } from "discord.js"
import { Event } from "../../Classes/Event.js"
import { IEvent } from "../../features/events/IEvent.js"

export const guildScheduledEventCreate = new Event({
	name: Events.GuildScheduledEventCreate,
	execute: async (event) => {
		try {
			if(!event.channelId) throw Error("No channel id specified for event: " + event.id)
			if(!event.creatorId) throw Error("No creator id specified for event: " + event.id)
			if(!event.scheduledStartAt) throw Error("No scheduled start time specified for event: " + event.id)
			const myEvent = {
				discordId: event.id,
				channelId: event.channelId,
				name: event.name,
				description: event.description ?? undefined,
				status: event.status,
				recurrent: event.recurrenceRule ? true : false,
				thumbnailUrl: event.coverImageURL() ?? "None",
				createdAtUtc: new Date(),
				creatorDiscordId: event.creatorId,
				scheduledStartUtc: event.scheduledStartAt,
				scheduledEndUtc: event.scheduledEndAt ?? undefined
			} satisfies IEvent

		
		} catch (err) {
			console.error(err)
		}
	}
})
