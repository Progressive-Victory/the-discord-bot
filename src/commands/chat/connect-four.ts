import { ChatInputCommand } from "@/Classes";
import { getMMRData, processGameResult } from "@/features/connect-four-mmr";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ComponentType,
  InteractionContextType,
  SlashCommandBuilder,
} from "discord.js";

export const connectFour = new ChatInputCommand({
  builder: new SlashCommandBuilder()
    .setName("connectfour")
    .setDescription("Invite others to play a game of Connect Four with you.")
    .setContexts(InteractionContextType.Guild)
    .setDMPermission(false),
  execute: async (interaction) => {
    const joinButton = new ButtonBuilder()
      .setCustomId("c4_join_game")
      .setLabel("Challenge")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("⚔️");

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(joinButton);

    await interaction.reply({
      content: `**${interaction.user.displayName}** wants to play a game of Connect Four 🔴🟡\n-# ${getMMRData(interaction.user.id)} Points`,
      components: [row],
    });

    const response = await interaction.fetchReply();

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000,
    });

    let turnCollector: any = null;

    const gameInput = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("c4_col_1")
        .setLabel("1")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("c4_col_2")
        .setLabel("2")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("c4_col_3")
        .setLabel("3")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("c4_col_4")
        .setLabel("4")
        .setStyle(ButtonStyle.Secondary),
    );

    const gameInput2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("c4_col_5")
        .setLabel("5")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("c4_col_6")
        .setLabel("6")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("c4_col_7")
        .setLabel("7")
        .setStyle(ButtonStyle.Secondary),
    );

    collector.on("collect", async (buttonInteraction: ButtonInteraction) => {
      if (buttonInteraction.user.id === interaction.user.id) {
        await buttonInteraction.reply({
          content: "You cannot challenge yourself!",
          ephemeral: true,
        });
        return;
      }

      if (buttonInteraction.customId === "c4_join_game") {
        collector.stop("game_started");

        const players = [buttonInteraction.user, interaction.user];
        const wager = Math.floor(
          Math.min(getMMRData(players[0].id), getMMRData(players[1].id)) * 0.2,
        );
        let gameState = 0;
        let turn = 1;

        const gameBoard = new Array(7)
          .fill(null)
          .map(() => new Array(6).fill(0));

        await buttonInteraction.update({
          content: `**${interaction.user.displayName}** (🔴) vs. **${buttonInteraction.user.displayName}** (🟡)\nTurn: ${turn}\n<@${players[turn % 2].id}>\n\n${renderGameBoard(gameBoard)}-# Wager: ${wager} points`,
          components: [gameInput, gameInput2],
        });

        const awaitNextTurn = () => {
          if (turnCollector) {
            turnCollector.stop("next_turn");
          }
          turnCollector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 180000,
          });

          turnCollector.on(
            "collect",
            async (gameInteraction: ButtonInteraction) => {
              if (
                gameInteraction.user.id !== players[0].id &&
                gameInteraction.user.id !== players[1].id
              ) {
                await gameInteraction.reply({
                  content: "You are not part of this match.",
                  ephemeral: true,
                });
                return;
              }

              if (gameInteraction.user.id !== players[turn % 2].id) {
                await gameInteraction.reply({
                  content: "It's not your turn!",
                  ephemeral: true,
                });
                return;
              }

              const colIndex =
                parseInt(gameInteraction.customId.replace("c4_col_", "")) - 1;
              const rowPlacement = gameBoard[colIndex].indexOf(0);

              if (rowPlacement === -1) {
                await gameInteraction.reply({
                  content: `Column ${colIndex + 1} is full.`,
                  ephemeral: true,
                });
                return;
              }

              gameState = updateGameState(
                colIndex,
                rowPlacement,
                turn % 2,
                gameBoard,
              );

              if (gameState === 0) {
                turn++;

                await gameInteraction.update({
                  content: `**${players[0].displayName}** (🔴) vs. **${players[1].displayName}** (🟡)\nTurn: ${turn}\n<@${players[turn % 2].id}>\n\n${renderGameBoard(gameBoard)}`,
                  components: [gameInput, gameInput2],
                });
                awaitNextTurn();
              } else {
                await gameInteraction.update({
                  content: `**${players[turn % 2].displayName}** ${turn % 2 === 0 ? "🔴" : "🟡"} wins!\n*${turn} Turns*\n\n${renderGameBoard(gameBoard)}> *${players[0].displayName} (🔴) vs. ${players[1].displayName} (🟡)*\n-# Wager: ${wager} points\n-# Victory: +10 points for winning`,
                  components: [],
                });
                turnCollector.stop("game_end");
                processGameResult(
                  players[turn % 2].id,
                  players[((turn % 2) + 1) % 2].id,
                  wager,
                );
              }
            },
          );
          turnCollector.on(
            "end",
            async (
              collected: Map<string, ButtonInteraction>,
              reason: string,
            ) => {
              if (reason === "time") {
                if (turn < 10) {
                  interaction.editReply({
                    content: `The game has expired. No one won the game.\n*${turn} Turns*\n\n${renderGameBoard(gameBoard)}> *${players[0].displayName} (🔴) vs. ${players[1].displayName} (🟡)*`,
                    components: [],
                  });
                  turnCollector.stop("game_end");
                } else {
                  const availableCols: number[] = [];
                  for (let col = 0; col < gameBoard.length; col++) {
                    if (gameBoard[col].includes(0)) {
                      availableCols.push(col);
                    }
                  }

                  if (availableCols.length > 0) {
                    const randomCol =
                      availableCols[
                        Math.floor(Math.random() * availableCols.length)
                      ];
                    const rowPlacement = gameBoard[randomCol].indexOf(0);

                    gameState = updateGameState(
                      randomCol,
                      rowPlacement,
                      turn % 2,
                      gameBoard,
                    );

                    if (gameState === 0) {
                      turn++;

                      await interaction.editReply({
                        content: `**${players[0].displayName}** (🔴) vs. **${players[1].displayName}** (🟡)\nTurn: ${turn}\n<@${players[turn % 2].id}>\n\n${renderGameBoard(gameBoard)}-# a random column was selected due to inactivity.`,
                        components: [gameInput, gameInput2],
                      });

                      awaitNextTurn();
                    } else {
                      await interaction.editReply({
                        content: `**${players[turn % 2].displayName}** ${turn % 2 === 0 ? "🔴" : "🟡"} wins!\n*${turn} Turns*\n\n${renderGameBoard(gameBoard)}> *${players[0].displayName} (🔴) vs. ${players[1].displayName} (🟡)*-# a random column was selected due to inactivity.\n-# Wager: ${wager} points\n-# Victory: +10 points for winning`,
                        components: [],
                      });
                      turnCollector.stop("game_end");
                      processGameResult(
                        players[turn % 2].id,
                        players[((turn % 2) + 1) % 2].id,
                        wager,
                      );
                    }
                  }
                }
              }
            },
          );
        };
        awaitNextTurn();
      }
    });

    collector.on(
      "end",
      async (collected: Map<string, ButtonInteraction>, reason: string) => {
        if (reason === "time") {
          await interaction.editReply({
            content:
              "The challenge has expired. No one accepted the challenge.",
            components: [],
          });
        }
      },
    );
  },
});

function renderGameBoard(board: number[][]): string {
  let boardString = "";
  for (let row = board[0].length - 1; row >= 0; row--) {
    boardString += "**|";
    for (let col = 0; col < board.length; col++) {
      boardString +=
        board[col][row] === 1 ? "🔴|" : board[col][row] === 2 ? "🟡|" : "⬛|";
    }
    boardString += "**\n";
  }
  return boardString;
}

function updateGameState(
  x: number,
  y: number,
  playerID: number,
  board: number[][],
): number {
  playerID++;
  board[x][y] = playerID;

  if (checkDirection(x, y, 1, 0, playerID, board) >= 4) return playerID;
  if (checkDirection(x, y, 0, 1, playerID, board) >= 4) return playerID;
  if (checkDirection(x, y, 1, 1, playerID, board) >= 4) return playerID;
  if (checkDirection(x, y, 1, -1, playerID, board) >= 4) return playerID;

  return 0;
}

function checkDirection(
  x: number,
  y: number,
  dx: number,
  dy: number,
  playerID: number,
  board: number[][],
): number {
  let run = 1;
  for (let i = 1; i < 4; i++) {
    if (
      x + dx * i < 0 ||
      x + dx * i >= board.length ||
      y + dy * i < 0 ||
      y + dy * i >= board[0].length
    ) {
      break;
    }
    if (board[x + dx * i][y + dy * i] === playerID) {
      run++;
    } else {
      break;
    }
  }
  for (let i = 1; i < 4; i++) {
    if (
      x - dx * i < 0 ||
      x - dx * i >= board.length ||
      y - dy * i < 0 ||
      y - dy * i >= board[0].length
    ) {
      break;
    }
    if (board[x - dx * i][y - dy * i] === playerID) {
      run++;
    } else {
      break;
    }
  }
  return run;
}
