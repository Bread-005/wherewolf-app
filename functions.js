import {setupRoleAction, werewolfAction} from "./roleActions.js";
import {lobbies, myId} from "./index.js";

function showErrorPopup(message) {
    const container = document.getElementById("toast-container");

    const toast = document.createElement("div");
    toast.className = "toast";

    toast.innerHTML = `
        <div class="toast-content">${message}</div>
        <div class="toast-progress progress-animation"></div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "slideIn 0.5s ease reverse forwards";
        setTimeout(() => toast.remove(), 500);
    }, 5000);
}

function displayCards(lobby, gameContainer) {
    const players = lobby.cards.filter(card => !card.isMiddleCard);

    for (const player of players) {
        const card = document.createElement("div");
        card.id = "card" + player.id;
        card.textContent = player.name;
        card.className = "player-card";
        if (player.id === myId) {
            card.classList.add("you-card");
        }

        const votedBanner = document.createElement("div");
        votedBanner.id = "voted-banner" + player.id;
        votedBanner.className = "voted-banner";
        votedBanner.textContent = "Voted";
        votedBanner.style.top = "-2.5%";
        card.append(votedBanner);

        gameContainer.append(card);
    }
    const youIndex = players.findIndex(player => player.id === myId);
    const laterOthers = [];
    const others = [];
    for (let i = 0; i < players.length; i++) {
        if (i < youIndex) {
            laterOthers.push(players[i]);
        }
        if (i > youIndex) {
            others.push(players[i]);
        }
    }
    const otherPlayers = others.concat(laterOthers);

    const leftPlayers = [];
    const rightPlayers = [];

    for (let i = 0; i < otherPlayers.length; i++) {
        if (i < Math.ceil(otherPlayers.length / 2)) {
            leftPlayers.push(otherPlayers[i]);
        } else {
            rightPlayers.push(otherPlayers[i]);
        }
    }

    const centerY = 40;
    const verticalGap = 20;

    leftPlayers.reverse().forEach((player, index) => {
        const groupHeight = (leftPlayers.length - 1) * verticalGap;
        const startTop = centerY - (groupHeight / 2);
        document.getElementById("card" + player.id).style.left = "5%";
        document.getElementById("card" + player.id).style.top = (startTop + (index * verticalGap)) + "%";
    });

    rightPlayers.forEach((player, index) => {
        const groupHeight = (rightPlayers.length - 1) * verticalGap;
        const startTop = centerY - (groupHeight / 2);
        document.getElementById("card" + player.id).style.right = "5%";
        document.getElementById("card" + player.id).style.top = (startTop + (index * verticalGap)) + "%";
    });

    // center cards
    for (let i = 0; i < 3; i++) {
        const centerCard = document.createElement("div");
        centerCard.className = "center-card";
        centerCard.id = "card" + lobby.cards.find(card => card.name === "middle-card" + (i + 1)).id;
        centerCard.style.left = (35 + (i * 12)) + "%";
        gameContainer.append(centerCard);
    }
}

function clickSelectCard(lobby, socket) {
    const selectRolesScreen = document.getElementById("select-roles-screen");
    selectRolesScreen.innerHTML = "";
    selectRolesScreen.style.display = "grid";

    const roles = [
        {id: 4, name: "Werewolf", text: "See other werewolves. If alone, may view 1 center card"},
        {id: 5, name: "Werewolf", text: "See other werewolves. If alone, may view 1 center card"},
        {id: 6, name: "Seer", text: "Either view 1 player´s card or 2 center cards"},
        {id: 7, name: "Robber", text: "May swap own card with other player. Then view it"},
        {id: 8, name: "Troublemaker", text: "May swap two other players' cards"},
        {id: 1, name: "Villager", text: "No special ability"},
        {id: 2, name: "Villager", text: "No special ability"},
        {id: 3, name: "Villager", text: "No special ability"}
    ];

    if (lobby.cards[3].id === myId) {
        const closeButton = document.createElement("button");
        closeButton.textContent = "Close";
        closeButton.className = "close-button";
        closeButton.addEventListener("click", () => {
            socket.emit("update-state", ({id: lobby.id, state: "waiting"}));
        });
        selectRolesScreen.append(closeButton);
    }

    for (const role of roles) {
        const container = document.createElement("div");
        container.className = "card";
        container.style.border = "5px solid " + (lobby.selectedRoles.map(r => r.id).includes(role.id) ? "lightblue" : "brown");

        const name = document.createElement("div");
        name.textContent = role.name;

        const img = document.createElement("img");
        img.className = "card-img";
        img.src = "./images/" + role.name.toLowerCase() + ".png";
        img.alt = role.name;

        // 3. Role text at the bottom
        const ability = document.createElement("div");
        ability.className = "card-ability";
        ability.textContent = role.text;

        container.append(name, img, ability);

        selectRolesScreen.append(container);

        if (lobby.selectedRoles.length === lobby.cards.length) {
            createStartButton(lobby, socket);
        }

        if (lobby.cards[3].id === myId) {
            container.addEventListener("click", () => {
                socket.emit("request-update-selected-roles", {lobbyId: lobby.id, role: role});
            }, {once: true});
        }
    }
}

function createStartButton(lobby, socket) {
    if (lobby.cards[3].id === myId) {
        const startButton = document.createElement("button");
        startButton.textContent = "Start Game";
        startButton.className = "start-game-button";
        document.getElementById("select-roles-screen").append(startButton);

        startButton.addEventListener("click", () => {
            socket.emit("set-roles-for-all-cards", lobby.id);
        });
    }
}

function viewCard(cardElement, card) {
    const name = document.createElement("span");
    name.textContent = card.role;
    name.style.position = "absolute";
    name.style.textAlign = "center";
    name.style.top = "20%";
    name.style.left = "50%";

    const img = document.createElement("img");
    img.src = "./images/" + name.textContent.toLowerCase() + ".png";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.position = "relative";

    img.append(name);
    cardElement.append(img);
    cardElement.style.cursor = "default";
}

//const storage = JSON.parse(localStorage.getItem("wherewolf-app"));

// function saveLocalStorage() {
//     localStorage.setItem("wherewolf-app", JSON.stringify(storage));
// }

function setupButtonEvents(socket, lobby) {
    document.getElementById("ok-button").addEventListener("click", () => {
        socket.emit("has-done-night-action");
        resetNightActionTexts(lobby);
    });
    document.getElementById("do-nothing-button").addEventListener("click", () => {
        socket.emit("has-done-night-action");
        resetNightActionTexts(lobby);
    });

    document.getElementById("continue-button").addEventListener("click", () => {
        document.getElementById("continue-button").style.display = "none";
        getCardElement(myId).querySelectorAll("img").forEach(img => img.remove());

        socket.emit("check-has-seen-role");

        setTimeout(() => {
            setupEventListenerForCards(socket);
            const player = lobby.cards.find(player => player.id === myId);
            werewolfAction(player);
            setupRoleAction("Seer", player, "You may view any player´s card or two cards from the center. \n" +
                "Click on the cards to look at them.", true, true, "pointer");
            setupRoleAction("Robber", player, "You may swap your card, with another player's card and then look at your role.",
                false, true, "grab");
            setupRoleAction("Troublemaker", player, "You may swap two other players' cards",
                false, true, "grab");
        }, 2000);
    });
}

function resetNightActionTexts(lobby) {
    document.getElementById("ok-button").style.display = "none";
    document.getElementById("do-nothing-button").style.display = "none";

    for (const card of lobby.cards) {
        getCardElement(card.id).classList.remove("selected-card");
        getCardElement(card.id).querySelectorAll("img").forEach(img => img.remove());
        getCardElement(card.id).style.cursor = "default";
    }
    document.getElementById("night-action-text").textContent = "waiting until every player has done their night actions ...";
}

function getCardElement(id) {
    return document.getElementById("card" + id);
}

function initialiseVoting(lobby, socket) {
    document.getElementById("display-text").textContent = "Click on another player to vote for them.";

    lobby.cards.filter(card => !card.isMiddleCard).forEach(card => {
        if (card.id === myId) return;
        getCardElement(card.id).style.cursor = "pointer";
        getCardElement(card.id).addEventListener("click", () => {
            document.getElementById("display-text").textContent = "You voted for " + card.name;
            for (const card1 of lobby.cards) {
                if (!card1.isMiddleCard && card1.id !== myId) {
                    getCardElement(card.id).style.display = "gray";
                }
            }
            getCardElement(card.id).style.display = "gray";
            socket.emit("set-has-voted", card.name);
        });
    });
}

function getPlayers(lobby) {
    return lobby.cards.filter(card => !card.isMiddleCard);
}

function createLobbyDisplay(lobbies, socket) {
    const lobbyDiv = document.getElementById("lobby");
    lobbyDiv.innerHTML = `<div>Name</div><div>Players</div><div>State</div><div>Action</div>`;

    for (const lobby of lobbies) {
        const realPlayerCount = lobby.cards.filter(card => !card.isMiddleCard).length;

        const lobbyName = document.createElement("div");
        lobbyName.textContent = lobby.name || "Unbenannte Lobby";

        const playerCount = document.createElement("div");
        playerCount.textContent = realPlayerCount + " / 10";

        const state = document.createElement("div");
        state.textContent = lobby.state;

        const joinButton = document.createElement("button");
        joinButton.textContent = lobby.state === "waiting" ? "Join" : "Spectate";

        joinButton.addEventListener("click", () => {
            const nameInput = document.getElementById("enter-name-input").value;
            if (!nameInput.trim()) {
                showErrorPopup("You have to enter a name");
                return;
            }
            if (nameInput.length > 15) {
                showErrorPopup("Name may not be longer than 15 letters");
                return;
            }
            for (const card of lobby.cards) {
                if (card.name === nameInput.trim()) {
                    showErrorPopup("Name already exists in that Lobby");
                    return;
                }
            }
            socket.emit("join-game", { name: nameInput.trim(), lobbyId: lobby.id });
        });
        lobbyDiv.append(lobbyName, playerCount, state, joinButton);
    }
}

function clearEverything() {
    const lobby = lobbies.find(l => l.cards.find(player => player.id === myId));
    if (lobby) {
        document.getElementById("vote-result-screen").style.display = "none";
        document.getElementById("game").style.background = "lightblue";
        if (lobby.cards[3].id === myId && lobby.cards.length >= 6) {
            document.getElementById("select-roles").style.display = "flex";
            document.getElementById("select-roles-button").style.display = "flex";
        }
        document.getElementById("display-text").textContent = "";
        document.getElementById("night-action-text").style.display = "flex";
        document.getElementById("night-action-text").textContent = "";
        const players = lobby.cards.filter(card => !card.isMiddleCard);
        for (const player of players) {
            document.getElementById("voted-banner" + player.id).style.display = "none";
        }
    }
}

function setupEventListenerForCards(socket) {
    const lobby = lobbies.find(l => l.cards.find(player => player.id === myId));
    if (!lobby) return;
    for (const card of lobby.cards) {
        getCardElement(card.id).addEventListener("click", () => {
            if (document.getElementById("game").style.background !== "royalblue") return;

            const player = lobby.cards.find(c => c.id === myId);
            if (getCardElement(card.id).style.cursor === "pointer") {
                if (player.role === "Werewolf" && lobby.cards.filter(c => !c.isMiddleCard && c.role === "Werewolf").length === 1 || player.role === "Seer") {
                    viewCard(getCardElement(card.id), card);

                    if (player.role === "Werewolf" || player.role === "Seer" && !card.isMiddleCard) {
                        lobby.cards.forEach(c => getCardElement(c.id).style.cursor = "default");
                        document.getElementById("ok-button").style.display = "flex";
                        document.getElementById("do-nothing-button").style.display = "none";
                    }
                    if (player.role === "Seer" && card.isMiddleCard) {
                        lobby.cards.filter(c => !c.isMiddleCard).forEach(c => getCardElement(c.id).style.cursor = "default");
                        document.getElementById("ok-button").style.display = "flex";
                        document.getElementById("do-nothing-button").style.display = "none";
                    }
                    if (player.role === "Seer" && lobby.cards.filter(c => c.isMiddleCard && getCardElement(c.id).style.cursor === "default").length === 2) {
                        lobby.cards.forEach(c => getCardElement(c.id).style.cursor = "default");
                        document.getElementById("ok-button").style.display = "flex";
                        document.getElementById("do-nothing-button").style.display = "none";
                    }
                }
            }
            if (getCardElement(card.id).style.cursor === "grab") {
                if (player.role === "Robber") {
                    document.getElementById("night-action-text").textContent = "You swapped your card with " + card.name + "\n" +
                        "Now you are " + player.role;
                    socket.emit("add-swap", {priority: 6, swap: [player, card]});
                    const yourRole = player.role;
                    player.role = card.role;
                    card.role = yourRole;
                    lobby.cards.forEach(c => getCardElement(c.id).style.cursor = "default");
                    document.getElementById("ok-button").style.display = "flex";
                    document.getElementById("do-nothing-button").style.display = "none";
                    viewCard(getCardElement(player.id), player);
                }
                if (player.role === "Troublemaker" && lobby.cards.filter(c => getCardElement(c.id).classList.contains("selected-card")).length < 2) {
                    document.getElementById("ok-button").style.display = "none";
                    document.getElementById("do-nothing-button").style.display = "flex";
                    if (getCardElement(card.id).classList.contains("selected-card")) {
                        getCardElement(card.id).classList.remove("selected-card");
                    } else {
                        getCardElement(card.id).classList.add("selected-card");
                    }
                    const selectedCards = lobby.cards.filter(c => getCardElement(c.id).classList.contains("selected-card"));
                    if (selectedCards.length === 2) {
                        socket.emit("add-swap", {priority: 7, swap: selectedCards});
                        document.getElementById("ok-button").style.display = "flex";
                        document.getElementById("do-nothing-button").style.display = "none";
                        document.getElementById("night-action-text").textContent = "You swapped " + selectedCards[0].name + " and " + selectedCards[1].name;
                    }
                }
            }
        });
    }
}

function showVoteResults() {
    const voteResultScreen = document.getElementById("vote-result-screen");
    voteResultScreen.querySelectorAll(".dynamic-result").forEach(element => element.remove());
    voteResultScreen.style.display = "grid";
    const lobby = lobbies.find(l => l.cards.find(player => player.id === myId));
    const players = lobby.cards.filter(card => !card.isMiddleCard);

    for (const player of players) {
        const name = document.createElement("div");
        name.textContent = player.name;
        name.className = "dynamic-result";
        const role = document.createElement("div");
        role.textContent = player.role;
        role.className = "dynamic-result";
        const voters = document.createElement("div");
        voters.textContent = players.filter(p => p.vote === player.name).map(p => p.name).join(", ");
        voters.className = "dynamic-result";
        const numberOfVotes = document.createElement("div");
        numberOfVotes.textContent = players.filter(p => p.vote === player.name).length;
        numberOfVotes.className = "dynamic-result";

        voteResultScreen.append(name, role, voters, numberOfVotes);
    }

    document.getElementById("vote-result-text").textContent = lobby.voteResultText;
    document.getElementById("vote-result-winning-team").textContent = "Team " + lobby.winningTeam + " wins";
}

export {showErrorPopup, displayCards, clickSelectCard, viewCard, setupButtonEvents, getCardElement,
    resetNightActionTexts, createLobbyDisplay, setupEventListenerForCards, getPlayers, createStartButton,
    initialiseVoting, showVoteResults, clearEverything};