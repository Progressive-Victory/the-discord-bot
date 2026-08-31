import { createObjectCsvStringifier } from "csv-writer";
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

  // HACK: This re-fetches all members if the cache is out of date. The
  // threshold is arbitrary, but should generally prevent the cache from being
  // re-fetched multiple times a day.
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

  const writer = createObjectCsvStringifier({
    header: [
      {
        id: "display_name",
        title: "Display Name",
      },
      {
        id: "username",
        title: "Username",
      },
      {
        id: "id",
        title: "Id",
      },
    ],
  });
  const memberData = role.members.map((member) => ({
    id: member.id,
    display_name: member.displayName,
    username: member.user.username,
  }));
  const csvStr = writer.getHeaderString() + writer.stringifyRecords(memberData);

  // Create a CSV attachment using the AttachmentBuilder class.
  const csv = new AttachmentBuilder(
    // Use the CSV content using the role's members.
    Buffer.from(csvStr),
    // Set the file name for the CSV attachment based on the role name and interaction ID.
    { name: `${role.name.replace(" ", "-")}.csv` },
  );

  // Send a follow-up message with a content and the CSV file attached.
  await interaction.editReply({
    content: `Members in ${role.toString()} role`,
    files: [csv],
  });
}
