import {
    showErrorPopup, createLobbyDisplay, displayCards, setupButtonEvents, clickSelectCard, viewCard,
    resetNightActionTexts, showVoteResults, clearEverything, getCardElement, updateKickMenu, openRolesDisplay,
    setupTokens, sendMessage, receiveMessage, loadMessages, sendConsoleMessage, showVoteResultBoard
} from "./functions.js";
import {confirmButtonAction, showRoleActions} from "./roleActions.js";

let lobbies = [];
let myId = "";
let allRoles = [];
const socket = io("https://wherewolf-server-bhut.onrender.com");

document.addEventListener("DOMContentLoaded", async () => {
    let lobby = {};
    allRoles = await fetch("./roles.json").then(res => res.json());
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

    document.getElementById("open-kick-menu-button").addEventListener("click", () => {
        document.getElementById("kick-menu-overlay").style.display = "flex";
    });

    document.addEventListener("click", (event) => {
        if (!document.getElementById("kick-menu-content").contains(event.target) &&
            document.getElementById("open-kick-menu-button") !== event.target) {
            document.getElementById("kick-menu-overlay").style.display = "none";
        }
        if (document.getElementById("show-roles-button") !== event.target) {
            document.getElementById("roles-display").style.right = "-350px";
        }
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

    setupButtonEvents();

    document.getElementById("restart-game-button").addEventListener("click", () => {
        socket.emit("reset-lobby");
    });

    socket.on("update-lobbies", (serverLobbies) => {
        lobbies = serverLobbies;
        lobby = lobbies.find(l => l.cards.find(card => card.id === myId));
        if (!lobby) {
            document.getElementById("lobby-page").style.display = "flex";
            document.getElementById("game").style.display = "none";
            createLobbyDisplay();
        }
        if (lobby) {
            const players = lobby.cards.filter(card => !card.isMiddleCard);
            const you = players.find(p => p.id === myId);
            document.getElementById("game").style.display = "flex";
            document.getElementById("lobby-page").style.display = "none";
            document.getElementById("cards").style.display = "flex";
            document.getElementById("select-roles-button").style.display = "none";
            document.getElementById("select-roles-screen").style.display = "none";
            document.getElementById("restart-game-button").style.display = "none";
            document.getElementById("skip-to-vote-button").style.display = "none";
            document.getElementById("vote-result-display").style.display = "none";
            document.getElementById("role-show-stage").style.display = "none";
            document.getElementById("game").style.background = "lightblue";
            document.getElementById("chat-container").style.display = "flex";
            for (const player of players) {
                if (!document.getElementById("card" + player.id)) {
                    displayCards(lobby);
                    showRoleActions();
                }
            }
            updateKickMenu(lobby);
            if (lobby.state === "waiting") {
                displayCards(lobby);
                clearEverything();
            }
            if (lobby.state === "select-roles") {
                document.getElementById("select-roles-screen").style.display = "grid";
                document.getElementById("show-roles-button").style.display = "none";
                clickSelectCard(lobby);
            }
            if (lobby.state === "look-at-role") {
                document.getElementById("show-roles-button").style.display = "flex";
                if (!you.hasSeenRole) {
                    document.getElementById("display-text").textContent = "Look at your role, by clicking your card";
                } else {
                    document.getElementById("display-text").textContent = "Wait for the other players to look at their cards";
                }
                getCardElement(myId).style.cursor = you.hasSeenRole ? "default" : "pointer";
                getCardElement(myId).addEventListener("click", () => {
                    const lobby = lobbies.find(l => l.cards.find(player => player.id === myId));
                    if (lobby && lobby.state === "look-at-role" && getCardElement(myId).style.cursor === "pointer") {
                        viewCard(lobby.cards.find(player => player.id === myId));
                        document.getElementById("continue-button").style.display = "flex";
                    }
                }, {once: true});
                document.getElementById("chat-container").style.display = "none";
            }
            if (lobby.state === "night") {
                document.getElementById("game").style.background = "royalblue";
                document.getElementById("display-text").textContent = lobby.displayText;

                if (you.startingRole === "Insomniac" && players.every(p => p.hasDoneNightAction || p.startingRole === "Insomniac") &&
                    !getCardElement(myId).querySelector("img") && you.mayLookAtTheirCard && !you.hasDoneNightAction &&
                    (!lobby.cards.find(card => card.role === "Doppelganger") || lobby.nightTimer > 20)) {
                    document.getElementById("night-action-text").textContent = "You wake up to see your role. You see " + you.role;
                    viewCard(you);
                    document.getElementById("ok-button").style.display = "flex";
                }

                if (you.hasDoneNightAction) {
                    document.getElementById("night-action-text").textContent = "waiting until every player has done their night actions ...";
                }
                if (you.nightActionText) {
                    document.getElementById("night-action-text").textContent = you.nightActionText;
                }
                document.getElementById("chat-container").style.display = "none";
            }
            if (lobby.state === "day") {
                document.getElementById("game").style.background = "lightblue";
                document.getElementById("display-text").textContent = lobby.displayText;
                document.getElementById("night-action-text").textContent = "";
                if (document.getElementById("tokens-container").children.length === 0) {
                    setupTokens(lobby);
                }
                if (!you.hasSkippedToVote) {
                    document.getElementById("skip-to-vote-button").style.display = "flex";
                }
            }
            if (lobby.state === "voting") {
                document.querySelectorAll(".role-token").forEach(token => token.remove());
                document.getElementById("game").style.background = "orange";
                if (!you.vote) {
                    document.getElementById("display-text").textContent = "Click on another player to vote for them.";
                } else {
                    document.getElementById("display-text").textContent = "You voted for " + you.vote;
                }
                for (const player of players) {
                    if (player.id !== myId) {
                        if (!you.vote) {
                            getCardElement(player.id).style.cursor = "pointer";
                        } else {
                            getCardElement(player.id).style.cursor = "default";
                            getCardElement(player.id).style.background = "gray";
                        }
                    }
                    if (player.vote) {
                        document.getElementById("voted-banner" + player.id).style.display = "flex";
                    }
                }
                document.getElementById("chat-container").style.display = "none";
            }
            if (lobby.state === "voting-results") {
                displayCards(lobby);
                document.getElementById("vote-result-display").style.display = "grid";
                document.getElementById("role-show-stage").style.display = "flex";
                if (players.filter(p => !p.id.includes("-disconnected"))[0].id === myId) {
                    document.getElementById("restart-game-button").style.display = "flex";
                }
                for (const player of players) {
                    document.getElementById("voted-banner" + player.id).style.display = "none";
                }
                showVoteResultBoard(lobby, players);
            }
            loadMessages(lobby);
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

    document.getElementById("confirm-button").addEventListener("click", () => confirmButtonAction());

    document.getElementById("show-roles-button").addEventListener("click", () => {
        const lobby = lobbies.find(lobby => lobby.cards.find(card => card.id === myId));
        if (lobby) {
            if (document.getElementById("roles-display").style.right === "0px") {
                document.getElementById("roles-display").style.right = "-350px";
            } else {
                openRolesDisplay(lobby);
            }
        }
    });

    document.getElementById("skip-to-vote-button").addEventListener("click", () => {
        document.getElementById("skip-to-vote-button").style.display = "none";
        sendConsoleMessage(lobby.cards.find(p => p.id === myId).name + " has skipped to vote " + (lobby.cards.filter(p => p.hasSkippedToVote).length + 1) + "/" + (lobby.cards.length - 3));
        socket.emit("skip-to-vote");
    });

    document.getElementById("send-chat-button").addEventListener("click", sendMessage);
    document.getElementById("chat-input").addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            sendMessage();
        }
    });

    socket.on("receive-chat-message", (data) => {
        receiveMessage(data);
    });

    socket.on("doppelganger-show-role-night-action", () => {
        showRoleActions();
    });
});

export {lobbies, myId, allRoles, socket};