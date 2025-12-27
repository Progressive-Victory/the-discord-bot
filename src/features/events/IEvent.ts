export interface IEvent {
	id?: number,
	discordId: string,
	channelId: string,
	name: string,
	description?: string,
	status: number,
	recurrent: boolean,
	userCount?: number,
	thumbnailUrl: string,
	createdAtUtc: Date,
	creatorDiscordId: string,
	scheduledStartUtc: Date,
	startedAtUtc?: Date,
	scheduledEndUtc?: Date,
	endedAtUtc?: Date
}
