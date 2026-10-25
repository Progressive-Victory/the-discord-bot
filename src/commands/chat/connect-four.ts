import { ChatInputCommand } from "@/Classes";
import { getMMRData, processGameResult } from "@/features/connect-four-mmr";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  InteractionContextType,
  Message,
  SlashCommandBuilder,
  User,
} from "discord.js";

const EMPTY = 2;
const PIECES = ["🔴", "🟡", "⬛"];

const CHALLENGE_TIMEOUT = 120_000;
const TURN_TIMEOUT = 180_000;
const CANCEL_MATCH_THRESHOLD = 10;
const WAGER_RATIO = 0.2;

const JOIN_BUTTON_ID = "c4_join_game";
const COLUMN_BUTTON_PREFIX = "c4_col_";

const IDLE_AUTOPLAY_NOTE = "a random column was selected due to inactivity.";
const DRAW_NOTE = "The game is a draw. No one won the game.";
const GAME_EXPIRED_NOTE = "The game has expired. No one won the game.";
const CHALLENGE_EXPIRED_NOTE =
  "The challenge has expired. No one accepted the challenge.";
const SELF_CHALLENGE_NOTE = "You cannot challenge yourself!";

const DIRECTIONS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

type Board = number[][];
type TurnOutcome = "continue" | "win" | "draw";
type View = { content: string; components: ActionRowBuilder<ButtonBuilder>[] };
type Respond = (view: View) => Promise<unknown>;

interface Match {
  players: [User, User]; // players[0] will always be the original challenger, plays red, and moves first
  board: Board;
  turn: number;
  wager: number;
}

export const connectFour = new ChatInputCommand({
  builder: new SlashCommandBuilder()
    .setName("connectfour")
    .setDescription("Invite others to play a game of Connect Four with you.")
    .setContexts(InteractionContextType.Guild)
    .setDMPermission(false),
  execute: async (interaction) => {
    await interaction.reply(challengeView(interaction.user));
    const response = await interaction.fetchReply();
    awaitChallenger(interaction, response);
  },
});

// Gameplay Logic ───────────────────────────────────────────────────────────────────────────────────────

function awaitChallenger(
  interaction: ChatInputCommandInteraction,
  response: Message,
) {
  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: CHALLENGE_TIMEOUT,
  });

  collector.on("collect", async (buttonInteraction: ButtonInteraction) => {
    if (buttonInteraction.user.id === interaction.user.id) {
      await buttonInteraction.reply({
        content: SELF_CHALLENGE_NOTE,
        ephemeral: true,
      });
      return;
    }

    if (buttonInteraction.customId !== JOIN_BUTTON_ID) return;

    collector.stop("game started");
    await startMatch(interaction, response, buttonInteraction);
  });

  collector.on("end", async (_collected: any, reason: string) => {
    if (reason === "time") {
      await interaction.editReply({
        content: CHALLENGE_EXPIRED_NOTE,
        components: [],
      });
    }
  });
}

async function startMatch(
  interaction: ChatInputCommandInteraction,
  response: Message,
  buttonInteraction: ButtonInteraction,
) {
  const players: [User, User] = [interaction.user, buttonInteraction.user];
  const match: Match = {
    players,
    board: initBoard(),
    turn: 1,
    wager: calculateWager(players),
  };

  await buttonInteraction.update(turnView(match));
  awaitMove(interaction, match, response);
}

function awaitMove(
  interaction: ChatInputCommandInteraction,
  match: Match,
  response: Message,
) {
  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: TURN_TIMEOUT,
  });

  collector.on("collect", async (buttonInteraction: ButtonInteraction) => {
    const problem = checkMoveProblems(match, buttonInteraction);
    if (problem) {
      await buttonInteraction.reply({
        content: problem,
        ephemeral: true,
      });
      return;
    }

    collector.stop("move completed");
    const outcome = await playColumn(
      match,
      columnFromButton(buttonInteraction),
      (view) => buttonInteraction.update(view),
    );

    if (outcome === "continue") awaitMove(interaction, match, response);
  });

  collector.on("end", async (_collected: any, reason: string) => {
    if (reason !== "time") return;

    if (match.turn < CANCEL_MATCH_THRESHOLD) {
      await interaction.editReply(finalView(expiredMessage(match)));
      return;
    }

    const outcome = await playColumn(
      match,
      pickRandomOpenColumn(match.board),
      (view) => interaction.editReply(view),
      IDLE_AUTOPLAY_NOTE,
    );

    if (outcome === "continue") awaitMove(interaction, match, response);
  });
}

async function playColumn(
  match: Match,
  column: number,
  respond: Respond,
  note?: string,
): Promise<TurnOutcome> {
  const outcome = dropPiece(match.board, column, currentPlayerID(match));

  if (outcome === "continue") {
    match.turn++;
    await respond(turnView(match, note));
  } else if (outcome === "win") {
    await respond(finalView(winMessage(match, note)));
    processGameResult(
      currentPlayer(match).id,
      currentOpponent(match).id,
      match.wager,
    );
  } else {
    await respond(finalView(drawMessage(match)));
  }

  return outcome;
}

function checkMoveProblems(
  match: Match,
  buttonInteraction: ButtonInteraction,
): string | undefined {
  if (
    !match.players.some((player) => player.id === buttonInteraction.user.id)
  ) {
    return "You are not part of this match.";
  }

  if (buttonInteraction.user.id !== currentPlayer(match).id) {
    return "It's not your turn!";
  }

  const column = columnFromButton(buttonInteraction);
  if (findOpenRow(match.board, column) === -1) {
    return `Column ${column + 1} is full.`;
  }

  return undefined;
}

// Board Logic ─────────────────────────────────────────────────────────────────────────────────────────

function initBoard(): Board {
  return Array.from({ length: 7 }, () => new Array(6).fill(EMPTY));
}

function findOpenRow(board: Board, column: number): number {
  return board[column].indexOf(EMPTY);
}

function pickRandomOpenColumn(board: Board): number {
  const openColumns = board
    .map((_, column) => column)
    .filter((column) => findOpenRow(board, column) !== -1);
  return openColumns[Math.floor(Math.random() * openColumns.length)];
}

function dropPiece(board: Board, column: number, piece: number): TurnOutcome {
  const row = findOpenRow(board, column);
  board[column][row] = piece;

  if (completesLine(board, column, row, piece)) return "win";
  if (isBoardFull(board)) return "draw";
  return "continue";
}

function isBoardFull(board: Board): boolean {
  return board.every((column) => !column.includes(EMPTY));
}

function completesLine(
  board: Board,
  column: number,
  row: number,
  piece: number,
): boolean {
  return DIRECTIONS.some(([dx, dy]) => {
    const forward = countInDirection(board, column, row, dx, dy, piece);
    const backward = countInDirection(board, column, row, -dx, -dy, piece);
    return 1 + forward + backward >= 4;
  });
}

function countInDirection(
  board: Board,
  column: number,
  row: number,
  dx: number,
  dy: number,
  piece: number,
): number {
  let count = 0;
  for (let i = 1; i < 4; i++) {
    if (board[column + dx * i]?.[row + dy * i] !== piece) break;
    count++;
  }

  return count;
}

function columnFromButton(click: ButtonInteraction): number {
  return parseInt(click.customId.replace(COLUMN_BUTTON_PREFIX, "")) - 1;
}

const currentPlayer = (match: Match) => match.players[(match.turn - 1) % 2];
const currentPlayerID = (match: Match) => (match.turn - 1) % 2;
const currentOpponent = (match: Match) => match.players[match.turn % 2];

// Render Logic ─────────────────────────────────────────────────────────────────────────────────────────

function renderBoard(board: Board): string {
  let boardString = "";
  for (let row = 5; row >= 0; row--) {
    const rowPieces = board.map((column) => PIECES[column[row]]).join("|");
    boardString += `**|${rowPieces}|**\n`;
  }
  return boardString;
}

function buildColumnButtons(): ActionRowBuilder<ButtonBuilder>[] {
  const buttons = Array.from(
    Array.from({ length: 7 }, (_, i) =>
      new ButtonBuilder()
        .setCustomId(`${COLUMN_BUTTON_PREFIX}${i + 1}`)
        .setLabel(`${i + 1}`)
        .setStyle(ButtonStyle.Secondary),
    ),
  );
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons.slice(0, 4)),
    new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons.slice(4)),
  ];
}

function buildJoinButton(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(JOIN_BUTTON_ID)
      .setLabel("Challenge")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("⚔️"),
  );
}

function challengeView(host: User): View {
  return {
    content: `**${host.displayName}** wants to play a game of Connect Four 🔴🟡\n-# ${getMMRData(host.id)} Points`,
    components: [buildJoinButton()],
  };
}

function turnView(match: Match, note?: string): View {
  const lines = [
    `**${match.players[0].displayName}** (🔴) vs. **${match.players[1].displayName}** (🟡)`,
    `Turn: ${match.turn}`,
    `<@${currentPlayer(match).id}>`,
    "",
    renderBoard(match.board),
    note ? `-# ${note}` : null,
  ];
  return { content: lines.join("\n"), components: buildColumnButtons() };
}

function finalView(content: string): View {
  return { content, components: [] };
}

function winMessage(match: Match, note?: string): string {
  const winner = currentPlayer(match);
  const piece = PIECES[currentPlayerID(match)];
  return [
    `**${winner.displayName}** ${piece} wins!`,
    `*${match.turn} Turns*`,
    "",
    renderBoard(match.board) + `> *${matchup(match)}*`,
    note ? `-# ${note}` : null,
    `-# Wager: ${match.wager} points`,
    "-# Victory: +10 points for winning",
  ].join("\n");
}

function drawMessage(match: Match): string {
  return [
    DRAW_NOTE,
    `*${match.turn} Turns*`,
    "",
    renderBoard(match.board) + `> *${matchup(match)}*`,
  ].join("\n");
}

function expiredMessage(match: Match): string {
  return [
    GAME_EXPIRED_NOTE,
    `*${match.turn} Turns*`,
    "",
    renderBoard(match.board) + `> *${matchup(match)}*`,
  ].join("\n");
}

function matchup(match: Match): string {
  return `${match.players[0].displayName} (🔴) vs. ${match.players[1].displayName} (🟡)`;
}

// MMR Logic ─────────────────────────────────────────────────────────────────────────────────────────

function calculateWager(players: [User, User]): number {
  const lowestPoints = Math.min(...players.map((p) => getMMRData(p.id)));
  return Math.floor(lowestPoints * WAGER_RATIO);
}
