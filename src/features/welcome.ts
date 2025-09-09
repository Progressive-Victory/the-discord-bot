import { ButtonBuilder, ButtonStyle, Colors } from "discord.js";

export const welcomeButton = new ButtonBuilder()
  .setCustomId("welcomed")
  // .setEmoji('👋')
  .setLabel("Confirm Welcome")
  .setStyle(ButtonStyle.Secondary);

export const unWelcomeButton = new ButtonBuilder()
  .setCustomId("unwelcomed")
  .setLabel("Mark unwelcomed")
  .setStyle(ButtonStyle.Danger);

export enum welcomeColors {
  Unwelcomed = Colors.Blue,
  Welcomed = Colors.Green,
  welcomeRemoved = Colors.Red,
}
