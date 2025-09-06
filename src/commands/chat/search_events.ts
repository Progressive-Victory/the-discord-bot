import {
	ChatInputCommandInteraction,
	Collection,
	Guild,
	GuildScheduledEvent,
	GuildScheduledEventStatus,
	InteractionContextType,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
	TextBasedChannel,
	User
} from "discord.js";
import {ChatInputCommand} from "../../Classes/index.js";



export const search_events = new ChatInputCommand({
	builder: new SlashCommandBuilder()
	.setName('search_events')
	.setDescription('Find events that match criteria')
	.setDefaultMemberPermissions(PermissionFlagsBits.ViewChannel)
	.setContexts(InteractionContextType.Guild)
	.addStringOption(option=>option
		.setName("id")
		.setDescription("find by id")
		.setMaxLength(30)
	)
	.addStringOption(option=>option
		.setName("name")
		.setDescription("find by name")
		.setMaxLength(100)
	)
	.addIntegerOption(option=>option
		.setName("time")
		.setDescription("Find by time")
		.setChoices(
			{name:"7am",value:7},
			{name:"8am",value:8},
			{name:"9am",value:9},
			{name:"10am",value:10},
			{name:"11am",value:11},
			{name:"12pm (noon)",value:12},
			{name:"1pm",value:13},
			{name:"2pm",value:14},
			{name:"3pm",value:15},
			{name:"4pm",value:16},
			{name:"5pm",value:17},
			{name:"6pm",value:18},
			{name:"7pm",value:19},
			{name:"8pm",value:20},
			{name:"9pm",value:21},
			{name:"10pm",value:22},
			{name:"11pm",value:23},
			{name:"12am (midnight)",value:24},
		)
	),
	execute: async(interaction)=>{
		await findEventsMatchingQuery(interaction,interaction.guild).then(
			events => {
				directMessageEvents(interaction,events)
			}
		)	
	}
})

function dmFoundNothing(interaction:ChatInputCommandInteraction){
	interaction.reply({
				flags: MessageFlags.Ephemeral,
				content:"No Matching events were found"
			})
}

async function findEventsMatchingQuery(interaction:ChatInputCommandInteraction,guild:Guild|null):Promise<GuildScheduledEvent[]|null>{
	if (guild === null){
		return null
	}
	let all_events:Collection<string,GuildScheduledEvent<GuildScheduledEventStatus>> = await guild.scheduledEvents.fetch()
	let id = interaction.options.getString("id")
	let name = interaction.options.getString("name")
	let time = interaction.options.getInteger("time")
	let events_list = all_events.map((v,_)=>v)
	let out = events_list.filter((v) => {
		return (
			(time === null && name === null && id === null) || 
			(time !== null && time_matches(v, time)) ||
			(id !== null && v.id.includes(id) && id !== "") ||
			(name !== null && v.name.includes(name) && name !== "")
		);
	})
	return out; 
}

function time_matches(v:GuildScheduledEvent, time: number): boolean {
	if (!v.scheduledStartAt || !v.scheduledEndAt) {
		return false;
	}
	return v.scheduledStartAt.getHours() <= time && v.scheduledEndAt.getHours() >= time;
}

function directMessageEvents(interaction:ChatInputCommandInteraction,events:any[]|null){
	if (events === null || events.length === 0){
		dmFoundNothing(interaction)
		return
	}
	//TODO: do we want to paginate this info somehow?
	//TODO: do we want to format this differently?
	let out = ""
	for(let e of events){
		out += e.toString() + "\n"
	}
	interaction.reply({
				flags: MessageFlags.Ephemeral,
				content:out
			})
}

