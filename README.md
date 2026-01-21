# Progressive Victory Bot

This bot supports operations in the Progressive Victory Discord Server. To join, sign up on the [website](https://www.progressivevictory.win/volunteer).

## High-Level Overview

The Progressive Victory Discord bot runs in a [Docker](https://docs.docker.com/get-started/) container deployed to the [GCP Compute Engine](https://cloud.google.com/compute/docs/containers). The bot uses:

- [pnpm](https://pnpm.io/) to manage dependencies
- [MySQL](https://dev.mysql.com/doc/refman/8.4/en/)
- [express.js](https://expressjs.com/en/api.html) to implement RESTful APIs
  - **NOTE:** The bot now requires the api repo to be running concurrently to perform any interaction with the database. See the [api repo](https://github.com/Progressive-Victory/the-api) for instructions on how to set that up.

## How to Contribute

To contribute to this repo, follow the contribution standards and instructions outlined on the [project home page](https://github.com/Progressive-Victory).

## Setup Instructions

### Installation

To get started we recommend you install the following software:

- [git](https://git-scm.com/downloads)
- [Visual Studio Code](https://code.visualstudio.com/Download)
- [Node.js](https://nodejs.org/en/download) v20.12.2 or later

Follow the installation instructions for Node.js. Then, run the following:

```sh
npm install -g pnpm@latest-10
```

Finally, copy `./.env.sample` to a file `./.env` then edit the following vaules to be accurate:

```txt
# Required for minimum function
# Discord Bot Token from Dev portal
DISCORD_TOKEN = "<bot_token>"

# Express server port
PORT = "<port>"

# host address (including port) for the api
API_HOST_ADDR = "<api_address>"

# guild id of the target server
PV_GUILD_ID = "<guild_id>"
```

You can ask the current tech director to provide these values.

### Runing the Bot

The following actions must be completed to run the bot:

First, install all dependencies:

```sh
pnpm install
```

Build and run the bot:

```sh
pnpm dev
```

Sync commands with discord (only do if necessary so we don't get rate limited):
```sh
pnpm dev-deploy
```

If the bot fails to run, check that all values are correct in the `./.env` file. Otherwise, if everything succeeds, you should be able to send commands to the bot via the Dev Discord server.

### Building the Documentation

To build the documentation, first run

```sh
pnpm doc
```

Then, open `./docs/index.html` in a browser.

## Commands

Commands help users interact with the server and manage its members:

### state

State lead tools. This command has two subcommands:

- ping - Allows our state leads to ping members' state roles
- members - Gets a list of all members with a specified role

### feedback

Directs members to the [GitHub issues](https://github.com/Progressive-Victory/the-discord-bot/issues) page to submit feedback and report bugs.

### warn

Moderation tools. This command has four subcommands:

- create - Add a warning to a user
- update - Update an existing warning
- remove - Remove an existing warning
- view - Gets a filterable list of all warnings

### settings

Admin tools for managing the server structure. This command has four subcommands:

- warn channels - Configure which channels are used to manage warnings
- report channels - Configure which channels are used to manage reports
- welcome channel - Configure which channel to send join logs to
- logging channels - Configure which channels logs are sent to

### timeout

Moderation tool to timeout a user for a specified duration.

### state-admin

Admin tools for managing the server structure for states. This command has two subcommands:

- team set - Set a state's team channel and role
- set - Set a state's channel and role

### mute

Moderation tool to mute a user for a specified duration.

### ban

This command allows admins to ban users while also logging the action and provided reason.

### Context Menus

Context menus provide actions that can be taken on users and messages.

- Report User: Report a user to the mods
- Report Message: Report a message to the mods

### References

- [dockerfile](dockerfile) contains the instructions to build the Discord bot's Docker image.
- [cloudbuild.yml](cloudbuild.yml) contains the [GCP build configuration](https://cloud.google.com/build/docs/configuring-builds/create-basic-configuration), which defines:
  - Startup scripts
  - [The destination for logs](https://cloud.google.com/logging/docs/buckets)
  - [Managing secrets](https://cloud.google.com/build/docs/securing-builds/use-secrets) such as the bot's Discord token and the MongoDB URI
- [commands](src/commands) defines the various commands users can use to trigger PV bot workflows:
  - [commands/chat](src/commands/chat/README.md) defines the various chat commands ([slash commands](https://discordjs.guide/slash-commands/response-methods.html)) users can use
  - [commands/context_menu](src/commands/context_menu/README.md) defines the various [context menu commands](https://discordjs.guide/interactions/context-menus.html) users can use
- [events](src/events/README.md) defines the various client events that the PV bot uses to interact with Discord.
- [interactions](src/interactions) defines the various [interactive components](https://discordjs.guide/interactive-components/action-rows.html) the PV bot can send to users to enhance the functionality of commands
  - [interactions/buttons](src/interactions/buttons/README.md) defines various [button interactions](https://discordjs.guide/interactive-components/buttons.html#building-buttons)
  - [interactions/modals](src/interactions/modals/README.md) defines various [modal interactions](https://discordjs.guide/interactions/modals.html)
  - [interactions/select_menus](src/interactions/select_menus/README.md) defines various [select menu interactions](https://discordjs.guide/interactive-components/select-menus.html#building-string-select-menus)
