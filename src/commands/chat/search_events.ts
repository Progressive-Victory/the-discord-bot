import {
	InteractionContextType,
	PermissionFlagsBits,
	SlashCommandBuilder,
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
		.setName("query")
		.setDescription("What would you like to find")
		.setMinLength(1)
		.setMaxLength(100)
		.setRequired(true)
	),
	execute: async(interaction)=>{
		const query = interaction.options.getString('query')
		if (query == null) {
			dmFoundNothing(interaction.user)
			return
		}
		const events = findEventsMatchingQuery(query)
		directMessageEvents(interaction.user,events)
	}
})

function dmFoundNothing(user:User){
	user.send("No Matching events were found")
}

function findEventsMatchingQuery(query:string):any|null{ //TODO: change to more concrete type

}

function directMessageEvents(user:User,events:any[]){
	if (events == null){
		dmFoundNothing(user)
		return
	}
	//TODO: do we want to paginate this info somehow?
	for(let e of events){
		user.send(e.toString())
	}
}

