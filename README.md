# Progressive Victory Bot

This bot supports operations in the Progressive Victory Discord Server. To join, sign up [here](https://www.progressivevictory.win/volunteer).

## Commands

Commands help users interact with the server and manage its members:

### state

This command has two subcommands

- ping - Allows our state leads to ping members' state roles
- members - Gets a list of all members with a specified role

### feedback

Directs members to the [GitHub issues](https://github.com/Progressive-Victory/crm-bot/issues) page to submit feedback and report bugs

## How to Contribute

To contribute to this repo, start by forking it and working on the fork. Then, when you are ready, create a pull request. The  pull request will be reviewed as soon as possible.

### Getting Started

To get started we recommend you install the following software:

- [Node.js](https://nodejs.org/en/download) v20.12.2 or later
  - [pnpm](https://pnpm.io/installation)
- [Visual Studio Code](https://code.visualstudio.com/)
- [git](https://git-scm.com/downloads)

Once you have installed the required tools, use the following steps to setup your local environment:

1. Open the git cli
2. Navigate to the directory you'd like to store your copy of the project in with the following command:
	cd <directory-path>
3. Use the clone command to install the git project locally:
	git clone https://github.com/Progressive-Victory/the-discord-bot.git
4. Open the newly downloaded folder in visual studio code
5. In visual studio open the console, and switch to command prompt since powershell likes to cause problems
6. Use the following command to install all dependencies for the project:
	pnpm install
7. To both build and run the project, use the following command:
	pnpm run dev

To familiarize yourself with the primary libraries in use here we'd recommend reading the quickstart guides (at least) for the following docs:

- [discord.js](https://discord.js.org/docs/packages/discord.js/14.23.2)
- [mongoose](https://mongoosejs.com/docs/guide.html)

Also, being familiar with how writing HTTP requests for interfacing with the [API](https://github.com/Progressive-Victory/the-api), and knowing the basic overview of how [mongo db](https://www.mongodb.com/docs/manual/) works will be necessary.

## High-Level Overview

The *production deployment* of the Progressive Victory Discord bot runs in a [Docker](https://docs.docker.com/get-started/) container deployed to the [GCP Compute Engine](https://cloud.google.com/compute/docs/containers). *DO NOT WORRY* you don't have to worry about that. For development purposes you can run the discord bot locally. We have a developer discord server intended for testing new bot features. To get an invite to the dev server, and the dev environmental variables: reach out to sH3llH0und or Joops. The bot uses:

- [pnpm](https://pnpm.io/) to manage dependencies
- [MongoDB](https://www.mongodb.com/docs/manual/) as a (document) database
- [Mongoose](https://mongoosejs.com/docs/) to interact with the database
- [express.js](https://expressjs.com/en/api.html) to implement RESTful APIs
  - **NOTE:** Currently, the PV bot doesn't define any RESTful API routes or handlers. The long-term vision is for the PV bot to act as a proxy for requests to the Discord API.

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
