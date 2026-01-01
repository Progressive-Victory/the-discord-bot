import {
  APIMessageTopLevelComponent,
  ChatInputCommandInteraction,
  JSONEncodable,
  MessageFlags,
} from "discord.js";
import { Routes } from "../../../Classes/API/ApiConnService/routes.js";
import { APIWarnPage } from "../../../Classes/API/ApiConnService/types.js";
import {
  viewPageRow,
  warnContainer,
} from "../../../features/moderation/warn-render.js";
import { apiConnService } from "../../../util/api/pvapi.js";

export async function view(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const mod = interaction.options.getUser("moderator");
  const target = interaction.options.getUser("recipient");
  const monthsAgo = interaction.options.getInteger("scope") ?? 0;
  const order = interaction.options.getString("order") ?? "desc";

  const timeWindowDate = new Date(Date.now() - monthsAgo * 2592000000);
  const query = new URLSearchParams();

  if (mod) query.set("mod_discord_id", mod.id);
  if (target) query.set("tgt_discord_id", target.id);
  if (monthsAgo > 0) query.set("time_window", timeWindowDate.toISOString());
  query.set("sort", order);
  query.set("limit", String(3));

  const page = (await apiConnService.get(Routes.discordWarns, {
    query,
  })) as APIWarnPage;

  // console.log(page);
  const components: JSONEncodable<APIMessageTopLevelComponent>[] =
    await Promise.all(
      page.data.map((data) => warnContainer(interaction.client, data)),
    );

  interaction.editReply({
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    components: components.toReversed().concat(viewPageRow(page)),
    allowedMentions: {},
  });
}
