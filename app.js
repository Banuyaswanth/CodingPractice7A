const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

let db = null;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

//Connecting the DB and Starting the Server
let initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server started at http://localhost:3000/");
    });
  } catch (err) {
    console.log(`DB Error: ${err.message}`);
    process.exit(1);
  }
};
initializeDBandServer();

//API 1
app.get("/players/", async (request, response) => {
  const getAllPlayers = `select * from player_details;`;
  let playersList = await db.all(getAllPlayers);
  const convertPlayersList = (playersList) => {
    return playersList.map((each) => {
      return {
        playerId: each.player_id,
        playerName: each.player_name,
      };
    });
  };
  response.send(convertPlayersList(playersList));
});

//API 2
app.get("/players/:playerId/", async (request, response) => {
  let { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details
    WHERE player_id = ${playerId};`;
  let player = await db.get(getPlayerQuery);
  const convertPlayer = (player) => {
    return {
      playerId: player.player_id,
      playerName: player.player_name,
    };
  };
  response.send(convertPlayer(player));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  let { playerId } = request.params;
  let playerDetails = request.body;
  let { playerName } = playerDetails;
  const updatePlayerQuery = `UPDATE player_details
    SET player_name = '${playerName}';`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  let { matchId } = request.params;
  const getMatchDetails = `SELECT * FROM match_details
    WHERE match_id = ${matchId};`;
  let matchDetails = await db.get(getMatchDetails);
  const convertMatchDetails = (matchDetails) => {
    return {
      matchId: matchDetails.match_id,
      match: matchDetails.match,
      year: matchDetails.year,
    };
  };
  response.send(convertMatchDetails(matchDetails));
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  let { playerId } = request.params;
  const getPlayerMatches = `select match_details.match_id as matchId,
    match_details.match as match,
    match_details.year as year from 
    match_details inner join player_match_score on match_details.match_id = player_match_score.match_id
    where player_id = ${playerId};`;
  let playerMatchList = await db.all(getPlayerMatches);
  console.log(playerMatchList);
  response.send(playerMatchList);
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  let { matchId } = request.params;
  let getPlayersOfMatch = `SELECT player_details.player_id as playerId,
    player_details.player_name as playerName
     FROM 
    player_details NATURAL JOIN player_match_score
    WHERE player_match_score.match_id = ${matchId};`;
  let playersMatchList = await db.all(getPlayersOfMatch);
  response.send(playersMatchList);
});

//API 7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  let { playerId } = request.params;
  const getPlayerStats = `SELECT 
    player_details.player_id as playerId,
    player_details.player_name as playerName,
    SUM(player_match_score.score) as totalScore,
    SUM(fours) as totalFours,
    SUM(sixes) as totalSixes
    FROM 
    player_details INNER JOIN player_match_score 
    ON player_details.player_id = player_match_score.player_id
    WHERE 
    player_details.player_id = ${playerId};`;
  let playerStats = await db.get(getPlayerStats);
  response.send(playerStats);
});

module.exports = app;
