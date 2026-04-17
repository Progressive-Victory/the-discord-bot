import {
	APIApplicationCommandOptionChoice,
	ChatInputCommandInteraction,
	DiscordAPIError,
	EmbedBuilder,
	inlineCode,
	LabelBuilder,
	MessageFlags,
	ModalBuilder,
	ModalSubmitInteraction,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	TextInputBuilder,
	TextInputStyle,
	User,
} from "discord.js";
import { getGuildChannel } from "../../util/index.js";

const BAN_COLOR = 0x7c018c;

/**
 * ban this user
 * @param interaction command interaction from user
 */
export async function banUserChatCommand(
  interaction: ChatInputCommandInteraction,
  minBanReason: number,
  maxBanReason: number,
  deleteMessagesChoices: APIApplicationCommandOptionChoice<number>[],
) {
  if (!interaction.inCachedGuild()) return;
  const options = interaction.options;

  const user = options.getUser("user", true);
  const reason = options.getString("reason");
  const deleteMessages = options.getNumber("delete_messages", true);

  const reasonText = new TextInputBuilder()
    .setCustomId("reason")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMinLength(minBanReason)
    .setMaxLength(maxBanReason);

  if (reason) {
    reasonText.setValue(reason);
  }

  const reasonLabel = new LabelBuilder()
    .setLabel("Reason")
    .setDescription("explanation of Ban")
    .setTextInputComponent(reasonText);

  const deleteMessageMenu = new StringSelectMenuBuilder()
    .setCustomId("delete_messages")
    .setRequired(true)
    .setMinValues(1)
    .setMaxValues(1)
    .setOptions(
      deleteMessagesChoices.map((c) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(c.name)
          .setValue(c.value.toString())
          .setDefault(deleteMessages === c.value),
      ),
    );

  const deleteMessageLabel = new LabelBuilder()
    .setLabel("Delete Messages")
    .setStringSelectMenuComponent(deleteMessageMenu);
  const confirm = new ModalBuilder()
    .setCustomId(`ban_${user.id}`)
    .setTitle(`Confirm Ban of ${user.displayName}`)
    .addLabelComponents(reasonLabel, deleteMessageLabel);

  await interaction.showModal(confirm);
}

export async function banUserModal(interaction: ModalSubmitInteraction) {
  if (!interaction.inCachedGuild()) return;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const { guild, fields } = interaction;
  const userId = interaction.customId.split("_")[1];
  const member = interaction.guild.members.cache.get(userId);

  if (member && (!member.user.bot || !member.bannable)) {
    await interaction.editReply({
      content: `${member.displayName} is unable to be banned`,
    });
    return;
  }

  const reason = fields.getTextInputValue("reason");
  const deleteMessages = Number(
    fields.getStringSelectValues("delete_messages"),
  );

  try {
    await guild.bans.create(userId, {
      reason,
      deleteMessageSeconds: deleteMessages,
    });
  } catch (error) {
    if (error instanceof DiscordAPIError) {
      await interaction.editReply({
        content: `User was unable to be banned. Error: ${inlineCode(error.message)}`,
      });
    }
  }
}

/**
 * log the ban in specified logging server
 * @param interaction command interaction from user
 */
async function logAction(interaction: ChatInputCommandInteraction) {
  const { options, guild, user: banning_user } = interaction;
  const settings = await GuildSetting.findOne({ guildId: guild?.id });
  if (!settings?.logging.timeoutChannelId || !guild) return;

  const bannedUser = options.getUser("user");
  const reason = options.getString("reason");
  if (bannedUser === null || reason === null) return;

  const timeoutChannel = await getGuildChannel(
    guild,
    settings.logging.timeoutChannelId,
  );
  if (!timeoutChannel?.isSendable()) return;

  timeoutChannel.send({
    embeds: [getBanLogEmbed(banning_user, bannedUser, reason)],
  });
}

/**
 * send a dm to the user informing them of why they were banned
 * @param interaction command interaction from user
 */
function dmNotification(interaction: ChatInputCommandInteraction) {
  const bannedUser = interaction.options.getUser("user");
  const botIcon = interaction.client.user.displayAvatarURL({
    forceStatic: true,
  });
  const reason = interaction.options.getString("reason") ?? "an unknown reason";
  bannedUser?.send({ embeds: [getBanNotificationEmbed(botIcon, reason)] });
}

/**
 * construct the embed for a ban log
 * @param banning_user admin who is banning
 * @param banned_user who is bannedd
 * @param reason why were they banned?
 */
function getBanLogEmbed(banning_user: User, banned_user: User, reason: string) {
  const title = "User Banned";
  const description = `${banned_user} was banned by ${banning_user} for ${reason}`;
  const icon = banned_user.displayAvatarURL({ forceStatic: true });
  return new EmbedBuilder()
    .setAuthor({ iconURL: icon, name: title })
    .setDescription(description)
    .setTimestamp()
    .setFooter({ text: `User ID: ${banned_user.id}` })
    .setColor(BAN_COLOR);
}

/**
 * construct the embed for a ban notification
 * @param iconURL url for icon of notification
 * @param reason why was this user banned
 */
function getBanNotificationEmbed(iconURL: string, reason: string) {
  const title = "User Banned";
  const description = `You were banned for ${reason}.`;
  return new EmbedBuilder()
    .setAuthor({ iconURL: iconURL, name: title })
    .setDescription(description)
    .setTimestamp()
    .setColor(BAN_COLOR);
}
