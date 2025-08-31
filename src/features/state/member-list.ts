import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";

/**
 * Executes a chat input command interaction to export role members to a CSV file.
 * @param interaction - The chat input command interaction object.
 */
export async function memberList(interaction: ChatInputCommandInteraction) {
  // Typically, we would rely on the cached state for command interactions. However, this command
  // should resolve the current list of guildMembers since we want a precise result

  // First, ensure that we're running the command in a guild
  if (!interaction.inCachedGuild()) {
    return interaction.reply({
      content:
        "This command can only be run in a server that the PV bot is registered with",
      flags: MessageFlags.Ephemeral,
    });
  }

  // Defer the reply to indicate that the bot is processing the command.
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  // Extract relevant fields from the interaction.
  const { guild, options } = interaction;

  // Get the role option from the interaction's options, ensuring it is required.
  const role = options.getRole("role", true);

  const members = (await guild.members.fetch()).filter((guildMember) =>
    guildMember.roles.cache.has(role.id),
  );

  // Create a CSV attachment using the AttachmentBuilder class.
  const csv = new AttachmentBuilder(
    // Construct the CSV content using the role's members.
    Buffer.from(
      [`Display Name,Username,Id`]
        .concat(
          members.map(
            (guildMember) =>
              `${guildMember.displayName},${guildMember.user.username},${guildMember.id}`,
          ),
        )
        .join("\n"),
    ),
    // Set the file name for the CSV attachment based on the role name and interaction ID.
    { name: `${role.name.replace(" ", "-")}.csv` },
  );

  // Send a follow-up message with a content and the CSV file attached.
  await interaction.editReply({
    content: `Members with the ${role.toString()} role`,
    files: [csv],
  });
}
