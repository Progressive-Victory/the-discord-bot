import {
  ChatInputCommandInteraction,
  ContextMenuCommandBuilder,
  ContextMenuCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import { BaseCommand } from "./BaseCommand";

export type builders = SlashCommandBuilder | ContextMenuCommandBuilder;

export type TypeCommand = BaseCommand<
  SlashCommandBuilder | ContextMenuCommandBuilder,
  ChatInputCommandInteraction | ContextMenuCommandInteraction
>;

export type AnySlashCommandBuilder =
  | SlashCommandBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | SlashCommandOptionsOnlyBuilder
  | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
