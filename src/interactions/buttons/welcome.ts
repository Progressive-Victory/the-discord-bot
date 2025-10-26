import {
  ActionRowBuilder,
  bold,
  ButtonBuilder,
  ButtonInteraction,
  ContainerBuilder,
  ContainerComponent,
  EmbedBuilder,
  MessageFlags,
  TextDisplayBuilder,
} from "discord.js";
import { Interaction } from "../../Classes/index.js";
import {
  unWelcomeButton,
  welcomeButton,
  welcomeColors,
} from "../../features/welcome.js";

export const welcomed = new Interaction<ButtonInteraction>({
  customIdPrefix: "welcomed",
  run: (interaction) => {
    const message = interaction.message;
    const component = message.components[0];

    if (!message.flags.has(MessageFlags.IsComponentsV2)) {
      const embed = new EmbedBuilder(message.embeds[0].toJSON());
      embed
        .setColor(welcomeColors.Welcomed)
        .addFields({ name: "Welcomed By:", value: `${interaction.member}` });
      interaction.update({ embeds: [embed], components: [] });
      return;
    } else if (component instanceof ContainerComponent) {
      const welcomer = new TextDisplayBuilder().setContent(
        `${bold("Welcomed By:")} ${interaction.member?.toString()}`,
      );
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        unWelcomeButton,
      );
      const container = new ContainerBuilder(component.toJSON())
        .spliceComponents(
          1,
          component.accentColor === welcomeColors.welcomeRemoved ? 1 : 0,
          welcomer,
        )
        .spliceComponents(-1, 1, row)
        .setAccentColor(welcomeColors.Welcomed);

      interaction.update({ components: [container], allowedMentions: {} });
      return;
    }
  },
});

export const unwelcome = new Interaction<ButtonInteraction>({
  customIdPrefix: "unwelcomed",
  run: (interaction) => {
    const component = interaction.message.components[0];
    if (!(component instanceof ContainerComponent)) return;

    const welcomer = new TextDisplayBuilder().setContent(
      `${bold("Welcome Removed By:")} ${interaction.member?.toString()}`,
    );
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      welcomeButton,
    );
    const container = new ContainerBuilder(component.toJSON())
      .spliceComponents(1, 1, welcomer)
      .spliceComponents(-1, 1, row)
      .setAccentColor(welcomeColors.welcomeRemoved);

    interaction.update({ components: [container], allowedMentions: {} });
  },
});
