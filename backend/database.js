import {setAllRoles} from "./server.js";
import "dotenv/config";
import {MongoClient} from "mongodb";
import {readFile} from "fs/promises";
import {fileURLToPath} from "url";
import path from "path";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const rolesFilePath = path.join(currentDirectory, "roles.json");

const connectionString = "mongodb+srv://" + process.env.DATABASE_USERNAME + ":" + process.env.DATABASE_PASSWORD + "@cluster0.rwh4ibp.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(connectionString);
let database;

async function connectDatabase() {
    try {
        await client.connect();
        database = client.db("Wherewolf");
        setAllRoles(JSON.parse(await readFile(rolesFilePath, "utf-8")));
        console.log("MongoDB connected");
    }
    catch (error) {
        console.error("MongoDB Connection Error", error);
    }
}

async function saveGameToDatabase(lobby) {
    const connection = database.collection("games");
    const games = await connection.find().toArray();
    connection.insertOne({
        id: games.length + 1,
        lobbyName: lobby.name,
        selectedRoles: lobby.selectedRoles.map(role => role.name),
        cards: lobby.cards.map(card => {
            return {
                name: card.name,
                roles: card.roleChain,
                team: card.team,
                vote: card.vote,
                voteAmount: lobby.cards.filter(card1 => card1.vote === card.name).length,
                isAlive: !card.dies,
                selectedCards: card.selectedCards.map(card => card.name),
                marks: [] // card.markChain
            }
        }),
        winningTeams: lobby.winningTeam,
        discussTime: lobby.discussTime,
        nightLength: lobby.nightTimer,
        messages: lobby.tempMessages.map(message => message.sender + ": " + message.message),
        randomActions: lobby.randomActions.map(action => {
            return {
                role: action.role,
                action: action.action
            }
        }),
        startTime: lobby.startTime,
        endTime: new Date()
    });
}

async function getGames() {
    return await database.collection("games").find().toArray();
}

export {connectDatabase, saveGameToDatabase, getGames};
