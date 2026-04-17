import { WarnSortOption } from "@/Classes/API/ApiConnService/WarnSearchmanager";
import { warnPage } from "@/features/moderation/warn-render";
import { warnSearchManger } from "@/util/api/pvapi";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";

export async function view(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({
    flags: MessageFlags.Ephemeral,
    // withResponse: true,
  });
  if (!interaction.inCachedGuild()) return;

  const mod = interaction.options.getUser("moderator");
  const target = interaction.options.getUser("recipient");
  const monthsAgo = interaction.options.getInteger("scope") ?? 0;
  const order =
    (interaction.options.getString("order") as WarnSortOption) ??
    WarnSortOption.Descending;

  const search = warnSearchManger.newSearch(interaction.member, {
    moderatorId: mod?.id,
    targetId: target?.id,
    monthsAgo: monthsAgo,
    sort: order,
  });

  await search.fetchPage();

  await interaction.editReply({
    flags: MessageFlags.IsComponentsV2,
    components: await warnPage(search),
    allowedMentions: {},
  });
}
