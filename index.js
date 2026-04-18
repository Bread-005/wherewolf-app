import {
    showErrorPopup, createLobbyDisplay, displayCards, setupButtonEvents, clickSelectCard, viewCard,
    resetNightActionTexts, initialiseVoting, showVoteResults, clearEverything, getCardElement
} from "./functions.js";

let lobbies = [];
let myId = "";

document.addEventListener("DOMContentLoaded", async () => {
    let lobby = {};
    const socket = io("https://wherewolf-server.onrender.com");
    let lobbyId = null;
    document.getElementById("lobby-page").style.display = "flex";
    document.getElementById("game").style.display = "none";

    socket.on("connect", () => {
        document.getElementById("loading-screen").style.display = "none";
    });

    socket.on("init", (id) => {
        myId = id;
    });

    document.getElementById("create-lobby-button").addEventListener("click", () => {
        const userName = document.getElementById("enter-name-input").value;
        if (!userName.trim()) {
            showErrorPopup("You have to enter a name");
            return;
        }
        if (userName.length > 15) {
            showErrorPopup("Name may not be longer than 15 letters");
            return;
        }
        socket.emit("create-lobby", userName.trim());
    });

    document.getElementById("select-roles-button").addEventListener("click", () => {
        socket.emit("update-state", {id: lobby.id, state: "select-roles"});
    });

    document.getElementById("leave-game-button").addEventListener("click", () => {
        document.getElementById("lobby-page").style.display = "flex";
        document.getElementById("game").style.display = "none";
        clearEverything();
        socket.emit("leave");
    });

    document.getElementById("restart-game-button").addEventListener("click", () => {
        socket.emit("reset-lobby");
    });

    socket.on("send-to-game", (id) => {
        document.getElementById("lobby-page").style.display = "none";
        document.getElementById("game").style.display = "flex";
        lobbyId = id;
    });

    socket.on("update-lobbies", (serverLobbies) => {
        lobbies = serverLobbies;
        if (document.getElementById("lobby-page").style.display === "flex") {
            createLobbyDisplay(lobbies, socket);
        }

        if (document.getElementById("game").style.display === "flex") {
            if (!myId) return;
            lobby = lobbies.find(l => l.cards.find(card => card.id === myId));
            document.getElementById("select-roles-button").style.display = "none";
            document.getElementById("select-roles-screen").style.display = "none";
            document.getElementById("game").style.background = "lightblue";
            if (lobby.state === "waiting") {
                const gameContainer = document.getElementById("game");
                const existingCards = gameContainer.querySelectorAll(".player-card, .center-card");
                existingCards.forEach(card => card.remove());
                displayCards(lobby, gameContainer);
                clearEverything();
            }
            if (lobby.state === "select-roles") {
                document.getElementById("select-roles-screen").style.display = "grid";
                clickSelectCard(lobby, socket);
            }
            if (lobby.state === "look-at-role") {
                document.getElementById("display-text").textContent = "Look at your role, by clicking your card";
                document.getElementById("card" + myId).style.cursor = lobby.cards.find(card => card.id === myId).hasSeenRole ? "default" : "pointer";
                getCardElement(myId).addEventListener("click", () => {
                    const lobby = lobbies.find(l => l.cards.find(player => player.id === myId));
                    if (lobby && lobby.state === "look-at-role" && getCardElement(myId).style.cursor === "pointer") {
                        viewCard(getCardElement(myId), lobby.cards.find(player => player.id === myId));
                        document.getElementById("continue-button").style.display = "flex";
                        setupButtonEvents(socket, lobby);
                    }
                }, {once: true});
            }
            if (lobby.state === "night") {
                document.getElementById("game").style.background = "royalblue";
                document.getElementById("display-text").textContent = lobby.displayText;
            }
            if (lobby.state === "day") {
                document.getElementById("game").style.background = "lightblue";
                document.getElementById("display-text").textContent = lobby.displayText;
                document.getElementById("night-action-text").style.display = "none";
            }
            if (lobby.state === "voting") {
                document.getElementById("game").style.background = "orange";
                for (const player of lobby.cards) {
                    if (player.vote) {
                        document.getElementById("voted-banner" + player.id).style.display = "flex";
                    }
                }
            }
            if (lobby.state === "voting-results") {
                document.getElementById("restart-game-button").style.display = "none";
                if (lobby.cards[3].id === myId) {
                    document.getElementById("restart-game-button").style.display = "flex";
                }
            }
        }
    });

    socket.on("reset-night-action-texts", () => {
        resetNightActionTexts(lobby);
    });

    socket.on("initialise-voting", () => {
        initialiseVoting(lobby, socket);
    });

    socket.on("everyone-voted", () => {
        showVoteResults();
    });
});

export {lobbies, myId};