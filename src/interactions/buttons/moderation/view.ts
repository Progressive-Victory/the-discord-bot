import { ButtonInteraction } from "discord.js";
import { Interaction } from "../../../Classes/index.js";

export const warnView = new Interaction<ButtonInteraction>({
  customIdPrefix: "warnview",
  run: async (interaction: ButtonInteraction) => {},
});
