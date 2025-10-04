# Chat Commands

Chat commands (also called [slash commands](https://discordjs.guide/creating-your-bot/slash-commands.html)) are the primary way users interact with an application on Discord. There are several types of options a command can be - a `String`, `Integer`, `Number`, `Boolean`, `User`, `Channel`, `Role`, or `Mentionable`. Each type helps by providing basic input validation.

See [discord.js guide](https://discordjs.guide/slash-commands/advanced-creation.html#adding-options) for addtional help with options.

Additionally, you may want to group commands together. This is done with `Subcommands` and `Subcommand Groups`. See [discord.js guide](https://discordjs.guide/slash-commands/advanced-creation.html#subcommands) for addtional help with subcommands.

## Create a Chat Command Object

1. Create a new file corresponding to the command you want to create. We typically define the following:

    - `builder` - A discord.js [`SlashCommandBuilder`](https://discord.js.org/docs/packages/discord.js/14.18.0/SlashCommandBuilder:Class).
      - `name` - The name of the command
      - `description` - A description of what the command does
      - Localization configuration
    - `execute` - The function that will run on the command invocation
    - _Optional_ `guildIds` - An array of server IDs. _Only use if the command will be exclusive to a set of servers_.
    - _Optional_ `autoComplete` - function to run on uses of option [autocomplete](https://discordjs.guide/slash-commands/autocomplete.html)

    ```ts
    // src/commands/chat/ping.ts
    import { ChatInputCommand } from "../../Classes/index.js";

    export default new ChatInputCommand()
      .setBuilder((builder) =>
        builder.setName("ping").setDescription("The bot will reply with pong"),
      )
      .setExecute(async (interaction) => {
        interaction.reply("🏓 Pong");
      });
    ```

2. Export the defined command in [`index.ts`](../index.ts).

    ```ts
    // src/commands/index.ts
    export { default as ping } from "./chat/ping.js";
    ```

3. Register the commands with the client in the root [`index.ts`](../../index.ts).

    ```ts
    // src/index.ts
    import { Client } from "./Classes/index.js";
    import * as commands from "./commands/index.js";

    const client = new Client();

    // Load commands
    for (const command of Object.values(commands)) client.commands.add(command);
    ```
