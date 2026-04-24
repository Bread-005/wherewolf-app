import {allRoles, lobbies, myId} from "./index.js";

function showErrorPopup(message) {
    const container = document.getElementById("toast-container");

    const toast = document.createElement("div");
    toast.className = "toast";

    toast.innerHTML = `
        <div>${message}</div>
        <div class="toast-progress progress-animation"></div>
    `;

    container.append(toast);

    setTimeout(() => {
        toast.style.animation = "slideIn 0.5s ease reverse forwards";
        setTimeout(() => toast.remove(), 500);
    }, 5000);
}

function displayCards(lobby, socket) {
    const players = lobby.cards.filter(card => !card.isMiddleCard);
    const cardsContainer = document.getElementById("cards");
    cardsContainer.innerHTML = "";

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

        const deathOverlay = document.createElement("div");
        deathOverlay.id = "death-overlay" + player.id;
        deathOverlay.className = "death-overlay";

        card.append(votedBanner, deathOverlay);
        cardsContainer.append(card);

        setupVotingClickEvent(card, socket);
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
        cardsContainer.append(centerCard);
    }

    // set night action events
    for (const card of lobby.cards) {
        setCardClickEvent(card.id);
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
        {id: 9, name: "Drunk", text: "Swap your card with center"},
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

function viewCard(card, as = card.role) {
    const img = document.createElement("img");
    img.src = "./images/" + as.toLowerCase() + ".png";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.position = "relative";

    getCardElement(card.id).querySelectorAll("img").forEach(img => img.remove());
    getCardElement(card.id).append(img);
    getCardElement(card.id).style.cursor = "default";
}

function setupButtonEvents(socket) {
    document.getElementById("ok-button").addEventListener("click", () => {
        socket.emit("has-done-night-action");
        resetNightActionTexts();
    });
    document.getElementById("do-nothing-button").addEventListener("click", () => {
        socket.emit("has-done-night-action");
        resetNightActionTexts();
    });

    document.getElementById("continue-button").addEventListener("click", () => {
        document.getElementById("continue-button").style.display = "none";
        getCardElement(myId).querySelectorAll("img").forEach(img => img.remove());

        socket.emit("check-has-seen-role");
    });
}

function resetNightActionTexts() {
    const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));
    document.getElementById("confirm-button").style.display = "none";
    document.getElementById("ok-button").style.display = "none";
    document.getElementById("do-nothing-button").style.display = "none";
    document.getElementById("night-action-text").textContent = "waiting until every player has done their night actions ...";

    for (const card of lobby.cards) {
        getCardElement(card.id).classList.remove("selected-card");
        getCardElement(card.id).querySelectorAll("img").forEach(img => img.remove());
        getCardElement(card.id).style.cursor = "default";
    }
}

function getCardElement(id) {
    return document.getElementById("card" + id);
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
        joinButton.textContent = lobby.state === "waiting" || lobby.state === "select-roles" ? "Join" : "Spectate";

        joinButton.addEventListener("click", () => {
            if (joinButton.textContent === "Spectate") {
                showErrorPopup("Spectating is currently not available");
                return;
            }
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
        document.getElementById("cards").querySelectorAll("img").forEach(img => img.remove());
        document.getElementById("game").style.background = "lightblue";
        if (lobby.cards[3].id === myId && lobby.cards.length >= 6) {
            document.getElementById("select-roles").style.display = "flex";
            document.getElementById("select-roles-button").style.display = "flex";
        }
        document.getElementById("display-text").textContent = "";
        document.getElementById("display-text-2").textContent = "";
        document.getElementById("night-action-text").textContent = "";
        const players = lobby.cards.filter(card => !card.isMiddleCard);
        for (const player of players) {
            getCardElement(player.id).style.background = "#f0f0f0";
            document.getElementById("voted-banner" + player.id).style.display = "none";
            document.getElementById("death-overlay" + player.id).style.display = "none";
        }
        document.getElementById("role-show-stage").style.display = "none";
    }
}

function setCardClickEvent(id) {
    getCardElement(id).addEventListener("click", (event) => {
        const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));
        const card = lobby.cards.find(card => card.id === event.target.id.replace("card", ""));
        if (!card) return;
        if (lobby.state !== "night") return;
        if (document.getElementById("game").style.background !== "royalblue") return;

        const players = lobby.cards.filter(c => !c.isMiddleCard);
        const player = players.find(p => p.id === myId);
        if (getCardElement(card.id).style.cursor === "pointer") {
            document.getElementById("confirm-button").style.display = "none";
            if (getCardElement(card.id).classList.contains("selected-card")) {
                getCardElement(card.id).classList.remove("selected-card");
            } else {
                getCardElement(card.id).classList.add("selected-card");
            }
            const selectedCards = lobby.cards.filter(c => getCardElement(c.id).classList.contains("selected-card"));

            if (player.role === "Werewolf" && players.filter(p => p.role === "Werewolf").length === 1 ||
                player.role === "Seer" && !card.isMiddleCard || player.role === "Robber" || player.role === "Drunk") {
                lobby.cards.filter(c => c.id !== card.id).forEach(c => getCardElement(c.id).classList.remove("selected-card"));
                document.getElementById("night-action-text").textContent = "Would you like to select " + card.name + "?";
                document.getElementById("confirm-button").style.display = "flex";
            }
            if (player.role === "Seer" && card.isMiddleCard) {
                lobby.cards.filter(c => !c.isMiddleCard).forEach(c => getCardElement(c.id).classList.remove("selected-card"));
                if (selectedCards.length < 2) document.getElementById("night-action-text").textContent = "You have to select one more center card";
                if (selectedCards.length > 2) document.getElementById("night-action-text").textContent = "You have to select one less center card";
                if (selectedCards.length === 2) {
                    document.getElementById("night-action-text").textContent = "Would you like to view " + selectedCards[0].name + " and " + selectedCards[1].name + "?";
                    document.getElementById("confirm-button").style.display = "flex";
                }
            }
            if (player.role === "Troublemaker") {
                if (selectedCards.length < 2) document.getElementById("night-action-text").textContent = "You have to select one more player's card";
                if (selectedCards.length > 2) document.getElementById("night-action-text").textContent = "You have to select one less player's card";
                if (selectedCards.length === 2) {
                    document.getElementById("night-action-text").textContent = "Would you like to swap " + selectedCards[0].name + " and " + selectedCards[1].name + "?";
                    document.getElementById("confirm-button").style.display = "flex";
                }
            }
            if (selectedCards.length === 0) {
                document.getElementById("confirm-button").style.display = "none";
                document.getElementById("night-action-text").textContent = allRoles.find(role => role.name === player.role).nightAction;
                if (player.role === "Werewolf") {
                    document.getElementById("night-action-text").textContent = "You are the only werewolf, therefore you may click one center card to view it.";
                }
            }
        }
    });
}

function showVoteResults() {
    const voteResultDisplay = document.getElementById("vote-result-display");
    voteResultDisplay.querySelectorAll(".dynamic-result").forEach(element => element.remove());
    voteResultDisplay.style.display = "grid";

    const lobby = lobbies.find(l => l.cards.find(player => player.id === myId));
    const players = lobby.cards.filter(card => !card.isMiddleCard);

    for (const card of lobby.cards) {
        viewCard(card);
    }

    for (const player of players) {
        const name = document.createElement("div");
        name.textContent = player.name;
        name.className = "dynamic-result";
        const role = document.createElement("div");
        role.textContent = player.roleChain.join(" -> ");
        role.className = "dynamic-result";
        const voters = document.createElement("div");
        voters.textContent = players.filter(p => p.vote === player.name).map(p => p.name).join(", ");
        voters.className = "dynamic-result";
        const numberOfVotes = document.createElement("div");
        numberOfVotes.textContent = players.filter(p => p.vote === player.name).length;
        numberOfVotes.className = "dynamic-result";

        voteResultDisplay.append(name, role, voters, numberOfVotes);
    }

    document.getElementById("display-text").textContent = lobby.voteResultText;
    document.getElementById("display-text-2").textContent = "Team " + lobby.winningTeam + " wins";

    for (const player of players) {
        if (player.id !== myId) {
            getCardElement(player.id).style.background = "#f0f0f0";
        }
        if (player.dies) {
            document.getElementById("death-overlay" + player.id).style.display = "flex";
            getCardElement(player.id).style.filter = "grayscale(80%)";
        }
    }

    setTimeout(() => {
        let showsEndingRoles = true;
        const toggleShowAllRoles = setInterval(() => {
            if (document.getElementById("role-show-stage").style.display === "none") {
                clearInterval(toggleShowAllRoles);
                return;
            }
            if (showsEndingRoles) {
                for (const card of lobby.cards) {
                    viewCard(card, card.roleChain[0]);
                    document.getElementById("role-show-stage").textContent = "Shows Starting Roles";
                    if (!card.isMiddleCard) {
                        document.getElementById("death-overlay" + card.id).style.display = "none";
                        getCardElement(card.id).style.filter = "";
                    }
                    showsEndingRoles = false;
                }
            } else {
                for (const card of lobby.cards) {
                    viewCard(card);
                    document.getElementById("role-show-stage").textContent = "Shows Ending Roles";
                    if (card.dies) {
                        document.getElementById("death-overlay" + card.id).style.display = "flex";
                        getCardElement(card.id).style.filter = "grayscale(80%)";
                    }
                    showsEndingRoles = true;
                }
            }
        }, 10000);
    }, 10000);
}

function setupVotingClickEvent(card, socket) {
    if (card.id !== "card" + myId) {
        card.addEventListener("click", () => {
            const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));
            if (card.style.cursor !== "pointer") return;
            if (lobby.state !== "voting") return;
            if (card.style.background === "gray") {
                showErrorPopup("You have already voted!");
                return;
            }
            for (const card1 of lobby.cards) {
                if (card1.isMiddleCard) continue;

                getCardElement(card1.id).style.cursor = "default";
                getCardElement(card1.id).style.background = "gray";
            }
            socket.emit("set-has-voted", card.textContent.replace("Voted", ""));
        });
    }
}

function animateCardSwap(card1, card2, text = "", duration = 2000) {
    const card1Element = getCardElement(card1.id);
    const card2Element = getCardElement(card2.id);

    if (!card1Element || !card2Element) return Promise.resolve();

    const rect1 = card1Element.getBoundingClientRect();
    const rect2 = card2Element.getBoundingClientRect();

    const diffX1 = rect2.left - rect1.left;
    const diffY1 = rect2.top - rect1.top;

    const diffX2 = rect1.left - rect2.left;
    const diffY2 = rect1.top - rect2.top;

    return new Promise((resolve) => {
        card1Element.style.transition = `transform ${duration}ms ease-in-out`;
        card2Element.style.transition = `transform ${duration}ms ease-in-out`;

        // move cards
        card1Element.style.transform = `translate(${diffX1}px, ${diffY1}px)`;
        card2Element.style.transform = `translate(${diffX2}px, ${diffY2}px)`;

        setTimeout(() => {
            // reset styles after swap
            card1Element.style.transition = "";
            card2Element.style.transition = "";
            card1Element.style.transform = "";
            card2Element.style.transform = "";
            card1Element.classList.remove("selected-card");
            card2Element.classList.remove("selected-card");

            document.getElementById("ok-button").style.display = "flex";
            document.getElementById("night-action-text").textContent = text;

            if (card1.role === "Robber") {
                const yourRole = card1.role;
                card1.role = card2.role;
                card2.role = yourRole;
                viewCard(card1);
                document.getElementById("night-action-text").textContent = "You swapped your card with " + card2.name + "\n" +
                    "Now you are " + card1.role;
            }

            resolve();
        }, duration);
    });
}

export {showErrorPopup, displayCards, clickSelectCard, viewCard, setupButtonEvents, getCardElement,
    resetNightActionTexts, createLobbyDisplay, createStartButton, showVoteResults, clearEverything, animateCardSwap};