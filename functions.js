import {allRoles, lobbies, myId, socket} from "./index.js";

let hasShownTokenHint = false;

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

function displayCards(lobby) {
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

        setupVotingClickEvent(card);
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

function clickSelectCard(lobby) {
    const selectRolesScreen = document.getElementById("select-roles-screen");
    selectRolesScreen.innerHTML = "";
    selectRolesScreen.style.display = "grid";

    const roles = [
        {id: 16, name: "Doppelganger", text: "Look at another player's card. Copy their role"},
        {id: 4, name: "Werewolf", text: "See other werewolves. If alone, may view 1 center card"},
        {id: 5, name: "Werewolf", text: "See other werewolves. If alone, may view 1 center card"},
        {id: 15, name: "Minion", text: "Sees other werewolves, but they not him"},
        {id: 11, name: "Mason", text: "See the other Mason"},
        {id: 12, name: "Mason", text: "See the other Mason"},
        {id: 6, name: "Seer", text: "Either view 1 player´s card or 2 center cards"},
        {id: 7, name: "Robber", text: "May swap own card with other player. Then view it"},
        {id: 8, name: "Troublemaker", text: "May swap two other players' cards"},
        {id: 9, name: "Drunk", text: "Swap your card with center"},
        {id: 10, name: "Insomniac", text: "Look at your card at night´s end"},
        {id: 1, name: "Villager", text: "No special ability"},
        {id: 2, name: "Villager", text: "No special ability"},
        {id: 3, name: "Villager", text: "No special ability"},
        {id: 13, name: "Hunter", text: "If killed, player they voted for dies, too"},
        {id: 14, name: "Tanner", text: "Wins if dies"}
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

    // discuss time
    const div = document.createElement("div");
    div.className = "discuss-time";

    const timerDisplay = document.createElement("label");
    timerDisplay.textContent = "Discussion Time: " + (lobby.discussTime || (lobby.cards.length - 3) * 60) + " secs";
    timerDisplay.htmlFor = "discuss-time-input";

    const discussTimeInput = document.createElement("input");
    discussTimeInput.id = "discuss-time-input";
    discussTimeInput.value = lobby.discussTime || (lobby.cards.length - 3) * 60;
    discussTimeInput.type = "number";

    const discussTimeButton = document.createElement("button");
    discussTimeButton.textContent = "Save";

    discussTimeButton.addEventListener("click", () => {
        let discussTime = Number(discussTimeInput.value) || 0;
        if (discussTime > 900) discussTime = 300;
        socket.emit("change-discuss-time", discussTime);
    });

    const div2 = document.createElement("div");
    div2.append(discussTimeInput, discussTimeButton);

    div.append(timerDisplay);
    if (lobby.cards[3].id === myId) {
        div.append(div2);
    }

    selectRolesScreen.append(div);

    for (const role of roles) {
        const container = document.createElement("div");
        container.className = "card";
        container.style.border = "5px solid " + (lobby.selectedRoles.map(r => r.id).includes(role.id) ? "lightblue" : "brown");

        const name = document.createElement("div");
        name.textContent = role.name;

        const img = document.createElement("img");
        img.src = "./images/" + role.name.toLowerCase() + ".png";
        img.alt = role.name;

        const ability = document.createElement("div");
        ability.className = "card-ability";
        ability.textContent = role.text;

        container.append(name, img, ability);

        selectRolesScreen.append(container);

        if (lobby.cards[3].id === myId) {
            container.addEventListener("click", () => {
                socket.emit("request-update-selected-roles", {lobbyId: lobby.id, role: role});
            }, {once: true});
        }
    }

    if (lobby.selectedRoles.length === lobby.cards.length) {
        createStartButton(lobby);
    }
}

function createStartButton(lobby) {
    if (lobby.cards[3].id === myId) {
        const startButton = document.createElement("button");
        startButton.textContent = "Start Game";
        startButton.className = "start-game-button";
        document.getElementById("select-roles-screen").append(startButton);

        startButton.addEventListener("click", () => {
            sendConsoleMessage("");
            sendConsoleMessage("New Round has started");
            sendConsoleMessage("");
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

function setupButtonEvents() {
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
        document.getElementById("display-text").textContent = "Wait for the other players to look at their roles";

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

function createLobbyDisplay() {
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
        document.getElementById("display-text-3").textContent = "";
        document.getElementById("night-action-text").textContent = "";
        document.getElementById("show-roles-button").style.display = "none";
        document.getElementById("continue-button").style.display = "none";
        document.getElementById("do-nothing-button").style.display = "none";
        document.getElementById("confirm-button").style.display = "none";
        document.getElementById("ok-button").style.display = "none";
        const players = lobby.cards.filter(card => !card.isMiddleCard);
        for (const player of players) {
            getCardElement(player.id).style.background = "#f0f0f0";
            document.getElementById("voted-banner" + player.id).style.display = "none";
            document.getElementById("death-overlay" + player.id).style.display = "none";
        }
        document.getElementById("role-show-stage").style.display = "none";
        document.querySelectorAll(".role-token").forEach(token => token.remove());
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

            if (player.startingRole === "Werewolf" && players.filter(p => p.startingRole === "Werewolf").length === 1 ||
                player.startingRole === "Seer" && !card.isMiddleCard || player.startingRole === "Robber" || player.startingRole === "Drunk" ||
                player.startingRole === "Doppelganger") {
                lobby.cards.filter(c => c.id !== card.id).forEach(c => getCardElement(c.id).classList.remove("selected-card"));
                document.getElementById("night-action-text").textContent = "Would you like to select " + card.name + "?";
                document.getElementById("confirm-button").style.display = "flex";
            }
            if (player.startingRole === "Seer" && card.isMiddleCard) {
                lobby.cards.filter(c => !c.isMiddleCard).forEach(c => getCardElement(c.id).classList.remove("selected-card"));
                if (selectedCards.length < 2) document.getElementById("night-action-text").textContent = "You have to select one more center card";
                if (selectedCards.length > 2) document.getElementById("night-action-text").textContent = "You have to select one less center card";
                if (selectedCards.length === 2) {
                    document.getElementById("night-action-text").textContent = "Would you like to view " + selectedCards[0].name + " and " + selectedCards[1].name + "?";
                    document.getElementById("confirm-button").style.display = "flex";
                }
            }
            if (player.startingRole === "Troublemaker") {
                if (selectedCards.length < 2) document.getElementById("night-action-text").textContent = "You have to select one more player's card";
                if (selectedCards.length > 2) document.getElementById("night-action-text").textContent = "You have to select one less player's card";
                if (selectedCards.length === 2) {
                    document.getElementById("night-action-text").textContent = "Would you like to swap " + selectedCards[0].name + " and " + selectedCards[1].name + "?";
                    document.getElementById("confirm-button").style.display = "flex";
                }
            }
            if (selectedCards.length === 0) {
                document.getElementById("confirm-button").style.display = "none";
                document.getElementById("night-action-text").textContent = allRoles.find(role => role.name === player.startingRole).nightAction;
                if (player.startingRole === "Werewolf") {
                    document.getElementById("night-action-text").textContent = "You are the only werewolf, therefore you may click one center card to view it.";
                }
            }
        }
    });
}

function showVoteResults() {
    document.getElementById("vote-result-display").style.display = "grid";

    const lobby = lobbies.find(l => l.cards.find(player => player.id === myId));
    const players = lobby.cards.filter(card => !card.isMiddleCard);

    showVoteResultBoard(lobby, players);

    for (const player of players) {
        if (player.id !== myId) {
            getCardElement(player.id).style.background = "#f0f0f0";
        }
    }
}

function setupVotingClickEvent(card) {
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
    const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));
    const you = lobby.cards.find(player => player.id === myId);
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

            if (you.startingRole === "Robber") {
                viewCard(you, card2.role);
                document.getElementById("night-action-text").textContent = "You swapped your card with " + card2.name + "\n" +
                    "Now you are " + card2.role;
            }

            resolve();
        }, duration);
    });
}

function updateKickMenu(lobby) {
    const players = lobby.cards.filter(card => !card.isMiddleCard);

    document.getElementById("host-admin-area").style.display = "none";
    if (players.length > 1 && players[0].id === myId && lobby.state !== "voting-results") {
        document.getElementById("host-admin-area").style.display = "flex";
        document.getElementById("kick-list").innerHTML = "";

        for (const player of players) {
            if (player.id === myId) continue;

            const item = document.createElement("div");
            item.className = "kick-item";
            const span = document.createElement("span");
            span.textContent = player.name;
            const icon = document.createElement("i");
            icon.className = "fa-solid fa-circle-xmark kick-symbol";
            icon.addEventListener("click", () => {
                if (confirm("Do you really want to kick this player?")) {
                    socket.emit("kick-player", player.id);
                }
            });
            item.append(span, icon);
            document.getElementById("kick-list").append(item);
        }
    }
}

function openRolesDisplay(lobby) {
    const display = document.getElementById("roles-display");
    display.innerHTML = "";
    display.style.right = "0px";

    const title = document.createElement("p");
    title.id = "roles-display-title";
    title.textContent = "Selected Roles in Wake Up Order";

    display.append(title);

    const roles = [];

    for (const role of lobby.selectedRoles) {
        roles.push({
            name: role.name,
            text: role.text,
            nightOrder: allRoles.find(role1 => role1.name === role.name)?.nightOrder || 100
        });
    }

    roles.sort((a, b) => a.nightOrder - b.nightOrder);

    for (const role of roles) {
        const container = document.createElement("div");
        container.className = "mini-role-card";

        const name = document.createElement("div");
        name.className = "mini-role-name";
        name.textContent = role.name;

        const img = document.createElement("img");
        img.src = "./images/" + role.name.toLowerCase() + ".png";
        img.alt = role.name;
        img.className = "mini-role-img";

        const ability = document.createElement("div");
        ability.className = "mini-role-ability";
        ability.textContent = role.text;

        container.append(name, img, ability);
        display.append(container);
    }
}

function setupTokens(lobby) {
    const container = document.getElementById("tokens-container");
    container.innerHTML = "";

    const centerX = window.innerWidth / 2;
    const totalWidth = lobby.selectedRoles.length * 65;
    const startX = centerX - (totalWidth / 2);

    const roles = [];

    for (const role of lobby.selectedRoles) {
        roles.push({
            name: role.name,
            text: role.text,
            nightOrder: allRoles.find(role1 => role1.name === role.name)?.nightOrder || 150
        });
    }

    roles.sort((a, b) => a.nightOrder - b.nightOrder);

    roles.forEach((role, index) => {
        const token = document.createElement("div");
        token.className = "role-token";
        token.style.backgroundImage = `url('./images/${role.name.toLowerCase()}.png')`;

        const role1 = allRoles.find(role1 => role1.name === role.name);

        if (role1.team === "Werewolf") {
            token.style.border = "2px solid red";
        }
        if (role1.team === "Tanner") {
            token.style.border = "2px solid #f1c40f";
        }

        // start positions
        token.style.left = `${startX + (index * 50)}px`;
        token.style.top = "20%";

        // Drag & Drop logic
        let isDragging = false;
        let offsetX, offsetY;

        token.addEventListener("mousedown", (event) => {
            isDragging = true;
            token.style.zIndex = "1500";
            offsetX = event.clientX - token.offsetLeft;
            offsetY = event.clientY - token.offsetTop;
        });

        document.addEventListener("mousemove", (event) => {
            if (!isDragging) return;

            const rect = document.getElementById("game").getBoundingClientRect();

            const paddingX = rect.width * 0.05;
            const paddingY = rect.height * 0.02;

            let newX = event.clientX - offsetX;
            let newY = event.clientY - offsetY;

            const minX = rect.left - paddingX;
            const maxX = rect.right - token.offsetWidth - paddingX;
            const minY = rect.top - paddingY;
            const maxY = rect.bottom - token.offsetHeight - paddingY;

            newX = Math.max(minX, Math.min(newX, maxX));
            newY = Math.max(minY, Math.min(newY, maxY));

            token.style.left = `${newX}px`;
            token.style.top = `${newY}px`;
        });

        document.addEventListener("mouseup", () => {
            isDragging = false;
            token.style.zIndex = "1400";
        });

        const hint = document.createElement("div");
        hint.className = "token-hint-popup";
        hint.textContent = "If you move a token only you see that";

        token.addEventListener("mouseenter", () => {
            if (!hasShownTokenHint) {
                hint.style.top = "-15px";

                token.append(hint);
                hasShownTokenHint = true;
            }
        });

        token.addEventListener("mouseleave", () => {
            hint.remove();
        });

        container.appendChild(token);
    });
}

function sendMessage() {
    const chatInput = document.getElementById("chat-input");
    const message = chatInput.value.trim();
    if (message) {
        socket.emit("send-chat-message", message);
        chatInput.value = "";
    }
}

function sendConsoleMessage(message) {
    socket.emit("send-console-message", message);
}

function loadMessages(lobby) {
    if (document.getElementById("chat-messages").children.length <= lobby.messages.length) {
        document.getElementById("chat-messages").innerHTML = "";
        for (const message of lobby.messages) {
            receiveMessage(message);
        }
    }
}

function receiveMessage(data) {
    const messagesBox = document.getElementById("chat-messages");
    const div = document.createElement("div");
    div.className = "chat-msg";
    div.innerHTML = `<b>${data.sender}:</b> ${data.message}`;
    messagesBox.appendChild(div);
    messagesBox.scrollTop = messagesBox.scrollHeight;
}

function showVoteResultBoard(lobby, players) {
    document.getElementById("vote-result-display").querySelectorAll(".dynamic-result").forEach(element => element.remove());

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

        document.getElementById("vote-result-display").append(name, role, voters, numberOfVotes);
    }

    document.getElementById("display-text").textContent = lobby.voteResultText;
    document.getElementById("display-text-2").textContent = (lobby.winningTeam !== "No-one" ? "Team " : "") + lobby.winningTeam + " wins";
    document.getElementById("display-text-3").textContent = "You lose";
    for (const team of lobby.winningTeam.split(" and ")) {
        if (team === players.find(p => p.id === myId).team) {
            document.getElementById("display-text-3").textContent = "You win";
        }
    }

    showEndingRoles(lobby);

    setTimeout(() => {
        let showsEndingRoles = true;
        const toggleShowAllRoles = setInterval(() => {
            const lobby1 = lobbies.find(l => l.id === lobby.id);
            if (document.getElementById("role-show-stage").style.display === "none" || !lobby1) {
                clearInterval(toggleShowAllRoles);
                return;
            }
            if (showsEndingRoles) {
                showEndingRoles(lobby1);
            } else {
                showStartingRoles(lobby1);
            }
            showsEndingRoles = !showsEndingRoles;
        }, 10000);
    }, 10000);
}

function showEndingRoles(lobby) {
    for (const card of lobby.cards) {
        viewCard(card);
        document.getElementById("role-show-stage").textContent = "Shows Ending Roles";
        if (card.dies) {
            document.getElementById("death-overlay" + card.id).style.display = "flex";
            getCardElement(card.id).style.filter = "grayscale(80%)";
        }
    }
}

function showStartingRoles(lobby) {
    for (const card of lobby.cards) {
        viewCard(card, card.roleChain[0]);
        document.getElementById("role-show-stage").textContent = "Shows Starting Roles";
        if (!card.isMiddleCard) {
            document.getElementById("death-overlay" + card.id).style.display = "none";
            getCardElement(card.id).style.filter = "";
        }
    }
}

export {showErrorPopup, displayCards, clickSelectCard, viewCard, setupButtonEvents, getCardElement,
    resetNightActionTexts, createLobbyDisplay, createStartButton, showVoteResults, clearEverything, animateCardSwap,
    updateKickMenu, openRolesDisplay, setupTokens, sendMessage, sendConsoleMessage, loadMessages, receiveMessage,
    showVoteResultBoard};