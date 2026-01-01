import { ButtonInteraction, TextDisplayBuilder } from "discord.js";
import { Interaction } from "../../../Classes/index.js";
import {
  soloWarn,
  warnPage,
} from "../../../features/moderation/warn-render.js";
import { warnSearchManger } from "../../../util/api/pvapi.js";

export const warnView = new Interaction<ButtonInteraction>({
  customIdPrefix: "wv",
  run: async (interaction: ButtonInteraction) => {
    const args = interaction.customId.split(
      interaction.client.splitCustomIdOn!,
    );
    const warnId = args[1];
    const searchId = args[2];

    const search = warnSearchManger.cache.get(searchId);

    if (!search)
      return interaction.update({
        components: [
          new TextDisplayBuilder().setContent(
            "Search has ended please restart search",
          ),
        ],
      });

    const warn = search.currentPageWarns.get(warnId);
    if (!warn)
      return interaction.update({
        components: [
          new TextDisplayBuilder({
            content: "Warn could not be found on page",
          }),
        ],
      });

    await interaction.update({
      components: await soloWarn(search.id, warn, interaction.client),
    });
  },
});

export const warnPageButton = new Interaction<ButtonInteraction>({
  customIdPrefix: "wp",
  run: async (interaction: ButtonInteraction) => {
    const args = interaction.customId.split(
      interaction.client.splitCustomIdOn!,
    );
    const searchId = args[1];
    await interaction.deferUpdate();
    const search = warnSearchManger.cache.get(searchId);
    console.log(args);
    switch (args[2]) {
      case "l":
        await search?.fetchLastPage();
        break;
      case "n":
        await search?.fetchNextPage();
        break;
      default:
        break;
    }
    // console.log(search?.currentPageWarns);
    await interaction.editReply({
      components: await warnPage(interaction.client, search!),
      allowedMentions: {},
    });
  },
});
