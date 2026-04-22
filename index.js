import {
    showErrorPopup, createLobbyDisplay, displayCards, setupButtonEvents, clickSelectCard, viewCard,
    resetNightActionTexts, initialiseVoting, showVoteResults, clearEverything, getCardElement
} from "./functions.js";

let lobbies = [];
let myId = "";

document.addEventListener("DOMContentLoaded", async () => {
    let lobby = {};
    const socket = io("https://wherewolf-server-bhut.onrender.com");
    document.getElementById("lobby-page").style.display = "flex";
    document.getElementById("game").style.display = "none";

    socket.on("connect", () => {
        document.getElementById("loading-screen").style.display = "none";
    });

    socket.on("init", (id) => {
        const savedId = sessionStorage.getItem("saved-id");
        myId = id;
        sessionStorage.setItem("saved-id", myId);
        if (savedId) {
            socket.emit("reconnect-player", savedId);
        }
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
        socket.emit("leave");
        clearEverything();
    });

    setupButtonEvents(socket);

    document.getElementById("restart-game-button").addEventListener("click", () => {
        socket.emit("reset-lobby");
    });

    socket.on("update-lobbies", (serverLobbies) => {
        lobbies = serverLobbies;
        lobby = lobbies.find(l => l.cards.find(card => card.id === myId));
        if (!lobby) {
            document.getElementById("lobby-page").style.display = "flex";
            document.getElementById("game").style.display = "none";
            createLobbyDisplay(lobbies, socket);
        }
        if (lobby) {
            const players = lobby.cards.filter(card => !card.isMiddleCard);
            const you = players.find(p => p.id === myId);
            document.getElementById("game").style.display = "flex";
            document.getElementById("cards").style.display = "flex";
            document.getElementById("lobby-page").style.display = "none";
            document.getElementById("select-roles-button").style.display = "none";
            document.getElementById("select-roles-screen").style.display = "none";
            document.getElementById("restart-game-button").style.display = "none";
            document.getElementById("vote-result-display").style.display = "none";
            document.getElementById("role-show-stage").style.display = "none";
            document.getElementById("game").style.background = "lightblue";
            for (const player of players) {
                if (!document.getElementById("card" + player.id)) {
                    displayCards(lobby, socket);
                    showRoleActions();
                }
            }
            if (lobby.state === "waiting") {
                displayCards(lobby, socket);
                clearEverything();
            }
            if (lobby.state === "select-roles") {
                document.getElementById("select-roles-screen").style.display = "grid";
                clickSelectCard(lobby, socket);
            }
            if (lobby.state === "look-at-role") {
                document.getElementById("display-text").textContent = "Look at your role, by clicking your card";
                getCardElement(myId).style.cursor = you.hasSeenRole ? "default" : "pointer";
                getCardElement(myId).addEventListener("click", () => {
                    const lobby = lobbies.find(l => l.cards.find(player => player.id === myId));
                    if (lobby && lobby.state === "look-at-role" && getCardElement(myId).style.cursor === "pointer") {
                        viewCard(lobby.cards.find(player => player.id === myId));
                        document.getElementById("continue-button").style.display = "flex";
                    }
                }, {once: true});
            }
            if (lobby.state === "night") {
                document.getElementById("game").style.background = "royalblue";
                document.getElementById("display-text").textContent = lobby.displayText;
                if (you.hasDoneNightAction) {
                    document.getElementById("night-action-text").textContent = "waiting until every player has done their night actions ...";
                }
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
                document.getElementById("vote-result-display").style.display = "grid";
                document.getElementById("role-show-stage").style.display = "flex";
                if (lobby.cards[3].id === myId) {
                    document.getElementById("restart-game-button").style.display = "flex";
                }
                const players = lobby.cards.filter(card => !card.isMiddleCard);
                for (const player of players) {
                    document.getElementById("voted-banner" + player.id).style.display = "none";
                }
            }
        }
    });

    socket.on("reset-night-action-texts", () => {
        resetNightActionTexts();
    });

    socket.on("everyone-voted", () => {
        showVoteResults();
    });

    socket.on("broadcast-message", (message) => {
        showErrorPopup(message);
    });

    socket.on("setup-night", () => {
        showRoleActions();
    });
});

export {lobbies, myId};