import {
    showErrorPopup, createLobbyDisplay, displayCards, setupButtonEvents,
    viewCard, resetNightActionTexts, showVoteResults, clearEverything, getCardElement,
    updateKickMenu, openRolesDisplay, setupTokens, sendMessage, receiveMessage, loadMessages,
    sendConsoleMessage, showVoteResultBoard, setupGeneralInfo, displaySentinelShieldToken,
    setupRoleSelection, isHost, validateRoleSelection
} from "./functions.js";
import {confirmButtonAction, showRoleActions} from "./roleActions.js";
import {buildGameSummary} from "./gameSummary.js";

let lobbies = [];
let myId = "";
let allRoles = [];
const socket = io("https://wherewolf-server-bhut.onrender.com", {
    transports: ["websocket"]
});

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
        socket.emit("update-state", "select-roles");
    });

    document.getElementById("leave-game-button").addEventListener("click", () => {
        document.getElementById("lobby-page").style.display = "flex";
        document.getElementById("game").style.display = "none";
        socket.emit("leave");
        clearEverything();
        document.getElementById("chat-messages").innerHTML = "";
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
            document.getElementById("game").style.display = "flex";
            document.getElementById("lobby-page").style.display = "none";
            const players = lobby.cards.filter(card => !card.isMiddleCard);
            const you = players.find(p => p.id === myId);
            document.body.style.backgroundImage = `url("./assets/wherewolf_background_day.png")`;
            document.getElementById("cards").style.display = "flex";
            document.getElementById("select-roles-button").style.display = "none";
            document.getElementById("select-roles-screen").style.display = "none";
            document.getElementById("restart-game-button").style.display = "none";
            document.getElementById("skip-to-vote-button").style.display = "none";
            document.getElementById("vote-result-display").style.display = "none";
            document.getElementById("role-show-stage-container").style.display = "none";
            document.getElementById("chat-container").style.display = "flex";
            document.getElementById("roles-warning-container").style.display = "none";
            document.getElementById("select-roles-other-components").style.display = "none";
            document.getElementById("display-text").style.color = "black";
            document.getElementById("night-action-text").style.color = "black";
            document.getElementById("tokens-container").style.display = "none";
            for (const card of lobby.cards) {
                if (!document.getElementById("card" + card.id)) {
                    displayCards(lobby);
                }
            }
            for (const player of players) {
                if (player.isSentinelled && getCardElement(player.id).querySelectorAll(".shield-token").length === 0) {
                    displaySentinelShieldToken(player);
                }
            }
            updateKickMenu(lobby);
            if (document.getElementById("general-rules-list").querySelectorAll(".dynamic-rule").length === 0 && you.role) {
                setupGeneralInfo(you, lobby.selectedRoles);
            }
            document.getElementById("select-roles-button").style.top = "40%";
            document.getElementById("night-action-text").style.top = "30%";
            document.getElementById("game-buttons").style.top = "37.5%";
            if (lobby.selectedRoles.find(role => role.name === "Alpha Wolf")) {
                document.getElementById("select-roles-button").style.top = "22.5%";
                document.getElementById("night-action-text").style.top = "17.5%";
                document.getElementById("game-buttons").style.top = "22.5%";
            }

            if (lobby.state === "waiting") {
                displayCards(lobby);
                clearEverything();
            }
            if (lobby.state === "select-roles") {
                displayCards(lobby);
                getCardElement(myId).style.opacity = "0%";
                document.getElementById("select-roles-screen").style.display = "grid";
                document.getElementById("show-roles-button").style.display = "none";
                updateSelectRolesScreen(lobby);
            }
            if (lobby.state === "look-at-role") {
                getCardElement(myId).style.opacity = "100%";
                document.getElementById("show-roles-button").style.display = "flex";
                if (!you.hasSeenRole) {
                    document.getElementById("display-text").textContent = "Look at your role, by clicking your card";
                } else {
                    document.getElementById("display-text").textContent = "Wait for the other players to look at their cards";
                }
                getCardElement(myId).style.cursor = you.hasSeenRole ? "default" : "pointer";
                document.getElementById("chat-container").style.display = "none";
                for (const player of players) {
                    if (player.hasSeenRole) {
                        document.getElementById("ready-banner" + player.id).style.display = "flex";
                    }
                }
            }
            if (lobby.state === "night") {
                for (const player of players) {
                    document.getElementById("ready-banner" + player.id).style.display = "none";
                }
                document.body.style.backgroundImage = `url("./assets/wherewolf_background_night.png")`;
                document.getElementById("display-text").textContent = lobby.displayText;
                if (lobby.nightTimer > 2) {
                    showRoleActions();
                }
                document.getElementById("chat-container").style.display = "none";
                document.getElementById("display-text").style.color = "white";
                document.getElementById("night-action-text").style.color = "white";
            }
            if (lobby.state === "day") {
                document.getElementById("display-text").textContent = lobby.displayText;
                document.getElementById("night-action-text").textContent = "";
                document.getElementById("tokens-container").style.display = "flex";
                if (document.getElementById("tokens-container").children.length === 0 && document.body.querySelectorAll(".role-token").length === 0) {
                    setupTokens(lobby);
                }
                if (!you.hasSkippedToVote) {
                    document.getElementById("skip-to-vote-button").style.display = "flex";
                }
                for (const card of lobby.cards) {
                    if (card.isRevealed && getCardElement(card.id).querySelectorAll("img").length === 0) {
                        viewCard(card);
                    }
                }
            }
            if (lobby.state === "voting") {
                document.body.style.backgroundImage = `url("./assets/wherewolf_background_voting.png")`;
                document.querySelectorAll(".role-token").forEach(token => token.remove());
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
                document.getElementById("role-show-stage-container").style.display = "flex";
                if (players.filter(p => !p.id.includes("-disconnected"))[0].id === myId) {
                    document.getElementById("restart-game-button").style.display = "flex";
                }
                for (const player of players) {
                    document.getElementById("voted-banner" + player.id).style.display = "none";
                }
                showVoteResultBoard(lobby, players);
                buildGameSummary(lobby);
            }
            loadMessages(lobby);
        }
    });

    socket.on("start-day", () => {
        resetNightActionTexts();
    });

    socket.on("everyone-voted", () => {
        showVoteResults();
    });

    socket.on("broadcast-message", (message) => {
        showErrorPopup(message);
    });

    document.getElementById("confirm-button").addEventListener("click", confirmButtonAction);

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
        const lobby = lobbies.find(lobby => lobby.cards.find(card => card.id === myId));
        document.getElementById("skip-to-vote-button").style.display = "none";
        sendConsoleMessage(lobby.cards.find(p => p.id === myId).name + " has skipped to vote " + (lobby.cards.filter(p => p.hasSkippedToVote).length + 1) + "/" + (lobby.cards.filter(card => !card.isMiddleCard).length));
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

    document.getElementById("game-rules-icon").addEventListener("mouseover", () => {
        document.getElementById("game-rules-popup").style.display = "flex";
    });

    document.getElementById("game-rules-icon").addEventListener("mouseout", () => {
        document.getElementById("game-rules-popup").style.display = "none";
    });

    document.getElementById("how-to-play-icon").addEventListener("mouseover", () => {
        document.getElementById("how-to-play-text").style.display = "block";
    });

    document.getElementById("how-to-play-icon").addEventListener("mouseout", () => {
        document.getElementById("how-to-play-text").style.display = "none";
    });

    document.getElementById("game-summary-button").addEventListener("click", () => {
        document.getElementById("game-summary-overlay").style.display = "flex";
    });

    document.getElementById("close-summary").addEventListener("click", () => {
        document.getElementById("game-summary-overlay").style.display = "none";
    });

    document.getElementById("start-game-button").addEventListener("click", () => {
        sendConsoleMessage("");
        sendConsoleMessage("New Round has started");
        sendConsoleMessage("");
        socket.emit("start-game");
    });

    setupRoleSelection();

    socket.on("update-select-roles-screen", (lobby) => {
        updateSelectRolesScreen(lobby);
    });

    function updateSelectRolesScreen(lobby) {
        document.getElementById("discuss-time-label").textContent = "Discussion Time: " + (lobby.discussTime || 300) + " secs";
        document.getElementById("discuss-time-input").value = lobby.discussTime || 300;

        const players = lobby.cards.filter(card => !card.isMiddleCard);

        for (const roleCard of document.getElementById("select-roles-screen").children) {
            if (lobby.selectedRoles.find(role => role.id.toString() === roleCard.id.split("-")[0])) {
                roleCard.style.border = "5px solid lightblue";
            } else {
                roleCard.style.border = "5px solid brown";
            }
        }

        if (isHost()) {
            document.getElementById("select-roles-other-components").style.display = "flex";
            for (const roleCard of document.getElementById("select-roles-screen").children) {
                roleCard.style.cursor = "pointer";
            }
        }

        document.getElementById("start-game-button").style.display = "none";
        if (lobby.selectedRoles.length === lobby.cards.filter(card => card.name !== "middle-card4").length && players.length >= 3) {
            document.getElementById("start-game-button").style.display = "flex";
        }
        validateRoleSelection(lobby);
        document.getElementById("role-count-display").textContent = lobby.selectedRoles.length + "/" + lobby.cards.filter(card => card.name !== "middle-card4").length + " Roles";
    }

    document.getElementById("resize-handle").addEventListener("mousedown", (e) => {
        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = document.getElementById("chat-container").offsetWidth;
        const startHeight = document.getElementById("chat-container").offsetHeight;

        function doDrag(e) {
            const deltaX = startX - e.clientX;
            const deltaY = startY - e.clientY;

            document.getElementById("chat-container").style.width = (startWidth + deltaX) + "px";
            document.getElementById("chat-container").style.height = (startHeight + deltaY) + "px";
        }

        function stopDrag() {
            document.documentElement.removeEventListener("mousemove", doDrag);
            document.documentElement.removeEventListener("mouseup", stopDrag);
        }
        document.documentElement.addEventListener("mousemove", doDrag);
        document.documentElement.addEventListener("mouseup", stopDrag);
    });

    document.getElementById("chat-container").addEventListener("click", () => {
        document.getElementById("chat-input").focus();
    });
});

export {lobbies, myId, allRoles, socket};