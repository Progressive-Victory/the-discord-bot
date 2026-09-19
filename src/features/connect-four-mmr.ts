/****************
 * CONNECT FOUR MMR
 *        created by Pita
 *
 * Point values are calculated very simply, and are just meant as a simple incentive to play the game.
 *
 * At the start of every challenge, the challenging user's point value is broadcasted so challengers understand how expensive a game is.
 * When a challenger accepts the game, we evaluate the wager by taking the lower of the two players' MMR, and taking 20% of that as the wager for the game.
 * The wager is awarded to the winner, and subtracted from the loser.
 *
 * Additionally, the winner of every game is awarded 10 points for winning, regardless of the wager.
 *
 ***************/

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE_PATH = path.join(__dirname, "connect-four-mmr-data.json");
const DEFAULT_MMR = 0;
const WIN_BONUS = 10;

interface MMRDatabase {
  [playerId: string]: number;
}

function readDatabase(): MMRDatabase {
  try {
    if (!fs.existsSync(DATA_FILE_PATH)) {
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify({}, null, 2), "utf-8");
      return {};
    }
    const fileContent = fs.readFileSync(DATA_FILE_PATH, "utf-8");
    if (!fileContent.trim()) {
      return {};
    }
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Error reading Connect 4 MMR data file:", error);
    return {};
  }
}

function writeDatabase(data: MMRDatabase): void {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing Connect 4 MMR data file:", error);
  }
}

export function getMMRData(playerID: string): number {
  const db = readDatabase();
  return db[playerID] ?? DEFAULT_MMR;
}

export function processGameResult(
  winner: string,
  loser: string,
  wager: number,
): void {
  const db = readDatabase();

  const winnerCurrent = db[winner] ?? DEFAULT_MMR;
  const loserCurrent = db[loser] ?? DEFAULT_MMR;

  const newLoserScore = Math.max(0, loserCurrent - wager);

  const actualStolen = loserCurrent - newLoserScore;
  const newWinnerScore = winnerCurrent + actualStolen + WIN_BONUS;

  db[winner] = newWinnerScore;
  db[loser] = newLoserScore;

  writeDatabase(db);
}
