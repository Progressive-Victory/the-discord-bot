


import { ChatInputCommandInteraction, 
	EmbedBuilder, 
	InteractionContextType, 
	PermissionFlagsBits, 
	SlashCommandBuilder, 
	User} from "discord.js";
import { ChatInputCommand } from "../../Classes/index.js";
import { GuildSetting } from "../../models/Setting.js";
import { getGuildChannel } from "../../util/index.js";


const BAN_COLOR = 0x7c018c

export const ban = new ChatInputCommand({
	builder: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Command to ban user')
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setContexts(InteractionContextType.Guild)
		.addUserOption(option=>option
			.setName("user")
			.setDescription("Which user would you like to ban?")
			.setRequired(true)
		)
		.addStringOption(option=>option
			.setName('reason')
			.setDescription('Why are you banning this user?')
			.setMinLength(1)
			.setMaxLength(300)
			.setRequired(true)
		),
	execute: async(interaction)=>{
		
		logAction(interaction)
		dmNotification(interaction)
		banUser(interaction)
	}
})


/**
 * ban this user
 * @param interaction command interaction from user
 */
function banUser(interaction:ChatInputCommandInteraction){
	//who are we banning
	const member = interaction.guild?.members.cache.get(
		interaction.options.getUser('user')?.id??""
	)
	const reason = interaction.options.getString('reason')

	// ban
	if (member && reason){
		interaction.guild?.members.ban(member,{reason})
	}
}

/**
 * log the ban in specified logging server
 * @param interaction command interaction from user
 */
async function logAction(interaction:ChatInputCommandInteraction){
	const {
		options,guild,user:banning_user
	} = interaction
	const settings = await GuildSetting.findOne({guildId:guild?.id})
	if (!settings?.logging.timeoutChannelId||!guild) return
	
	const bannedUser = options.getUser('user');
	const reason = options.getString('reason')
	if(bannedUser===null || reason === null) return

	const timeoutChannel = await getGuildChannel(guild, settings.logging.timeoutChannelId)
	if(!timeoutChannel?.isSendable()) return

	timeoutChannel.send({embeds:[getBanLogEmbed(banning_user,bannedUser,reason)]})
}

/**
 * send a dm to the user informing them of why they were banned
 * @param interaction command interaction from user
 */
function dmNotification(interaction:ChatInputCommandInteraction){
	const bannedUser = interaction.options.getUser('user')
	const botIcon = interaction.client.user.displayAvatarURL({forceStatic:true})
	const reason = interaction.options.getString('reason')??"an unknown reason"
	bannedUser?.send({embeds:[getBanNotificationEmbed(botIcon,reason)]})
}

/**
 * construct the embed for a ban log
 * @param banning_user admin who is banning
 * @param banned_user who is bannedd
 * @param reason why were they banned?
 */
function getBanLogEmbed(banning_user:User,banned_user:User,reason:string){
	const title = "User Banned"
	const description = `${banned_user} was banned by ${banning_user} for ${reason}`
	const icon = banned_user.displayAvatarURL({forceStatic:true})
	return new EmbedBuilder()
		.setAuthor({iconURL:icon, name:title})
		.setDescription(description)
		.setTimestamp()
		.setFooter({text:`User ID: ${banned_user.id}`})
		.setColor(BAN_COLOR)
}

/**
 * construct the embed for a ban notification
 * @param iconURL url for icon of notification
 * @param reason why was this user banned
 */
function getBanNotificationEmbed(iconURL:string,reason:string){
	const title = "User Banned"
	const description = `You were banned for ${reason}.`
	return new EmbedBuilder()
		.setAuthor({iconURL:iconURL,name:title})
		.setDescription(description)
		.setTimestamp()
		.setColor(BAN_COLOR)
}
