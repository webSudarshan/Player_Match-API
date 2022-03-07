const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const intializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};

intializeDbAndServer();

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
    player_id AS playerId,
    player_name AS playerName
    FROM player_details`;

  const playersList = await db.all(getPlayersQuery);
  response.send(playersList);
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerQuery = `
    SELECT
    player_id AS playerId,
    player_name AS playerName
    FROM player_details
    WHERE player_id = ${playerId}`;

  const player = await db.get(getPlayerQuery);
  response.send(player);
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;

  const updatePlayerQuery = `
    UPDATE player_details
    SET player_name = '${playerName}'
    WHERE player_id = ${playerId}`;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
    SELECT match_id AS matchId,
    match AS match,
    year AS year
    FROM match_details
    WHERE match_id = ${matchId}`;

  const matchDetails = await db.get(getMatchDetailsQuery);
  response.send(matchDetails);
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT 
    match_details.match_id AS matchId,
    match_details.match AS match,
    match_details.year AS year
    FROM match_details
    INNER JOIN player_match_score
    ON match_details.match_id = player_match_score.match_id
    WHERE player_match_score.player_id = ${playerId}`;

  const playerMatchDetails = await db.all(getPlayerMatchesQuery);
  response.send(playerMatchDetails);
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName
    FROM player_details
    INNER JOIN player_match_score
    ON player_details.player_id = player_match_score.player_id
    WHERE player_match_score.match_id = ${matchId}`;

  const playersDetails = await db.all(getMatchPlayersQuery);
  response.send(playersDetails);
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStatsQuery = `
    SELECT 
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM player_match_score
    INNER JOIN player_details
    ON player_match_score.player_id = player_details.player_id
    WHERE player_match_score.player_id = ${playerId}`;

  const playerStats = await db.all(getPlayerStatsQuery);
  response.send(playerStats);
});

module.exports = app;
