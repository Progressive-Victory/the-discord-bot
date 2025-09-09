import { AttachmentBuilder, ChatInputCommandInteraction } from "discord.js";
import { ns } from "../../commands/chat/state.js";
import { localize } from "../../i18n.js";
import { isRole } from "../../util/index.js";

/**
 * Executes a chat input command interaction to export role members to a CSV file.
 * @param interaction - The chat input command interaction object.
 */
export async function memberList(interaction: ChatInputCommandInteraction) {
  // Extract the locale and options from the interaction.
  const { locale, options } = interaction;
  const local = localize.getLocale(locale);

  // Defer the reply to indicate that the bot is processing the command.
  await interaction.deferReply({ ephemeral: true });

  // Get the role option from the interaction's options, ensuring it is required.
  const role = options.getRole("role", true);

  if (!isRole(role)) {
    return;
  }
  // Create a CSV attachment using the AttachmentBuilder class.
  const csv = new AttachmentBuilder(
    // Construct the CSV content using the role's members.
    Buffer.from(
      `Display Name,Username,Id\n${role.members.map((member) => `${member.displayName},${member.user.username},${member.id}\n`).join("")}`,
    ),
    // Set the file name for the CSV attachment based on the role name and interaction ID.
    { name: `${role.name.replace(" ", "-")}.csv` },
  );

  // Send a follow-up message with a content and the CSV file attached.
  await interaction.followUp({
    content: local?.t("member-list-message-followup", ns, {
      role: role.toString(),
    }),
    files: [csv],
  });
}
