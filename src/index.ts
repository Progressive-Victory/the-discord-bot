import {
  AnySelectMenuInteraction,
  GatewayIntentBits as Intents,
  Partials,
} from "discord.js";
import express from "express";
import { Client, Interaction } from "./Classes";
import * as commands from "./commands";
import * as events from "./events";
import * as buttons from "./interactions/buttons";
import * as modals from "./interactions/modals";
import * as selectMenus from "./interactions/select_menus";

// Initialization (specify intents and partials)
export const client = new Client({
  intents: [
    Intents.Guilds,
    Intents.GuildMessages,
    Intents.GuildVoiceStates,
    Intents.MessageContent,
    Intents.GuildMembers,
    Intents.GuildModeration,
    Intents.GuildScheduledEvents,
  ],
  partials: [Partials.GuildMember],
  receiveMessageComponents: true,
  receiveModals: true,
  receiveAutocomplete: true,
  replyOnError: true,
  splitCustomIdOn: "_",
});

// Load Events
for (const event of Object.values(events)) client.events.add(event);

// Load commands
for (const command of Object.values(commands)) client.commands.add(command);

// Load buttons
for (const button of Object.values(buttons))
  client.interactions.addButton(button);

// Load modals
for (const modal of Object.values(modals)) client.interactions.addModal(modal);

// Load selectMenus
for (const selectMenu of Object.values(selectMenus))
  client.interactions.addSelectMenu(
    selectMenu as Interaction<AnySelectMenuInteraction>,
  );

// Bot logins to Discord services
void client.login(process.env.DISCORD_TOKEN).then(() => {
  // Skip if no-deployment flag is set, else deploys command
  if (process.argv.includes("--deploy"))
    // removes guild command from set guild
    // client.commands.deregisterGuildCommands(process.env.GUILDID);
    // deploys commands
    void client.commands.register();
});

// Express Server
const app = express();
const port = process.env.PORT ?? "No port set";
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
