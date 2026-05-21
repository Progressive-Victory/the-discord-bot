import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ContainerBuilder,
  Guild,
  GuildMember,
  heading,
  LabelBuilder,
  Message,
  MessageCreateOptions,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  roleMention,
  SeparatorSpacingSize,
  Snowflake,
  subtext,
  TextInputBuilder,
  TextInputStyle,
  userMention,
} from "discord.js";

/**
 * Executes the ping command to send a message to a channel.
 * @param interaction - The chat input command interaction object.
 * @returns interaction
 */
export default async function ping(interaction: ChatInputCommandInteraction) {
  let guild: Guild;
  let member: GuildMember;
  const { client, options } = interaction;

  // interaction.deferReply({flags:MessageFlags.Ephemeral})

  if (interaction.inCachedGuild()) {
    guild = interaction.guild;
    member = interaction.member;
  } else if (interaction.inRawGuild()) {
    try {
      guild = await client.guilds.fetch(interaction.guildId);
      member = await guild.members.fetch(interaction.user);
    } catch (error) {
      console.log(error);
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "An Error has occurred, contact your administrator",
      });
      return;
    }
  } else {
    throw Error("ping not in guild");
  }
}
