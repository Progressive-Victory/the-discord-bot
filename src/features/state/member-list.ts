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
  // Defer the reply to indicate that the bot is processing the command.
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (!interaction.inCachedGuild()) return;

  // Extract the locale and options from the interaction.
  const options = interaction.options;

  // HACK: This re-fetches all members if the cache is small, e.g., it only
  // contains members who have used the bot and the bot itself. The threshold
  // is arbitrary.
  const cacheSize = interaction.guild.members.cache.size;
  const memberCount = interaction.guild.memberCount;
  const cacheThreshold = 0.7;
  if (cacheSize < memberCount * cacheThreshold) {
    console.log(
      `[Debug] Detected a bad member cache (${cacheSize} < ${memberCount} * ${cacheThreshold})! Refetching...`,
    );
    interaction.guild.members.cache.clear();
    await interaction.guild.members.fetch();
    console.log(
      `[Debug] New member cache size: ${interaction.guild.members.cache.size}`,
    );
  }

  // Get the role from interaction options using true to make the argument required
  const role = options.getRole("role", true);

  console.log(
    `[Debug] Current members with "${role.name}" in cache ${role.members.size}`,
  );
  const memberLines = role.members.map(
    (member) => `${member.displayName},${member.user.username},${member.id}`,
  );

  // Create a CSV attachment using the AttachmentBuilder class.
  const csv = new AttachmentBuilder(
    // Construct the CSV content using the role's members.
    Buffer.from(`Display Name,Username,Id\n${memberLines.join("\n")}`),
    // Set the file name for the CSV attachment based on the role name and interaction ID.
    { name: `${role.name.replace(" ", "-")}.csv` },
  );

  // Send a follow-up message with a content and the CSV file attached.
  await interaction.editReply({
    content: `Members in ${role.toString()} role`,
    files: [csv],
  });
}
