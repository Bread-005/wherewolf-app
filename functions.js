import {allRoles, lobbies, myId, socket} from "./index.js";
import {wakeUpMultiple} from "./roleActions.js";

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

    if (lobby.selectedRoles.find(r => r.name === "Alpha Wolf")) {
        const centerCard4 = document.createElement("div");
        centerCard4.className = "center-card";
        centerCard4.id = "card" + lobby.cards.find(card => card.name === "middle-card" + 4).id;
        centerCard4.style.top = "42.5%";
        centerCard4.style.left = "50%";
        centerCard4.style.transform = "translate(-50%, -50%) rotate(-90deg)";
        cardsContainer.append(centerCard4);
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
        {id: 20, name: "Copycat", text: "View a center card. Copy that role"},
        {id: 19, name: "Sentinel", text: "May place a shield token"},
        {id: 16, name: "Doppelganger", text: "View another player's card. Copy their role"},
        {id: 4, name: "Werewolf", text: "See other werewolves. If alone, may view 1 center card"},
        {id: 5, name: "Werewolf", text: "See other werewolves. If alone, may view 1 center card"},
        {id: 21, name: "Alpha Wolf", text: "Swap center wolf card with other player"},
        {id: 15, name: "Minion", text: "Sees other werewolves, but they not him"},
        {id: 11, name: "Mason", text: "See the other Mason"},
        {id: 12, name: "Mason", text: "See the other Mason"},
        {id: 6, name: "Seer", text: "May either view 1 player´s card or 2 center cards"},
        {id: 17, name: "Apprentice Seer", text: "May view 1 center card"},
        {id: 7, name: "Robber", text: "May swap own card with other player. Then view it"},
        {id: 22, name: "Witch", text: "May view 1 center card and swap with any player"},
        {id: 8, name: "Troublemaker", text: "May swap two other players' cards"},
        {id: 9, name: "Drunk", text: "Swap your card with center"},
        {id: 10, name: "Insomniac", text: "Look at your card at night´s end"},
        {id: 18, name: "Revealer", text: "Turn over 1 other player's card if village"},
        {id: 1, name: "Villager", text: "No special ability"},
        {id: 2, name: "Villager", text: "No special ability"},
        {id: 3, name: "Villager", text: "No special ability"},
        {id: 13, name: "Hunter", text: "If killed, player they voted for dies, too"},
        {id: 14, name: "Tanner", text: "Wins if dies"}
    ];

    if (isHost()) {
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
    if (isHost()) {
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
        img.src = "./images/" + role.name.toLowerCase().replace(" ", "_") + ".png";
        img.alt = role.name;

        const ability = document.createElement("div");
        ability.className = "card-ability";
        ability.textContent = role.text;

        container.append(name, img, ability);

        selectRolesScreen.append(container);

        if (isHost()) {
            container.addEventListener("click", () => {
                socket.emit("request-update-selected-roles", {lobbyId: lobby.id, role: role});
            }, {once: true});
        }
    }

    if (lobby.selectedRoles.length === lobby.cards.filter(card => card.name !== "middle-card4").length) {
        createStartButton(lobby);
    }
    validateRoleSelection(lobby);
}

function createStartButton(lobby) {
    if (isHost()) {
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
    img.src = "./images/" + as.toLowerCase().replace(" ", "_") + ".png";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.position = "relative";

    getCardElement(card.id).querySelectorAll("img").forEach(img => img.remove());
    getCardElement(card.id).append(img);
    getCardElement(card.id).style.cursor = "default";
}

function setupButtonEvents() {
    document.getElementById("continue-button").addEventListener("click", () => {
        document.getElementById("continue-button").style.display = "none";
        getCardElement(myId).querySelectorAll("img").forEach(img => img.remove());
        document.getElementById("display-text").textContent = "Wait for the other players to look at their roles";
        socket.emit("check-has-seen-role");
    });
    document.getElementById("confirm-waiting-button").addEventListener("click", () => {
        document.getElementById("confirm-waiting-button").style.display = "none";
        socket.emit("saw-wait-message");
    })
    document.getElementById("do-nothing-button").addEventListener("click", () => {
        socket.emit("has-done-night-action");
        resetNightActionTexts();
    });
    document.getElementById("ok-button").addEventListener("click", () => {
        socket.emit("has-done-night-action");
        resetNightActionTexts();
    });
}

function resetNightActionTexts() {
    const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));
    document.getElementById("confirm-button").style.display = "none";
    document.getElementById("ok-button").style.display = "none";
    document.getElementById("do-nothing-button").style.display = "none";
    document.getElementById("confirm-waiting-button").style.display = "none";
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
            if (lobby.cards.find(card => card.name === nameInput.trim())) {
                showErrorPopup("Name already exists in that Lobby");
                return;
            }
            if (nameInput.trim().includes("middle-card")) {
                showErrorPopup("Your name may not contain 'middle-card'");
                return;
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
        if (isHost() && lobby.cards.length >= 6) {
            document.getElementById("select-roles-button").style.display = "flex";
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
        document.getElementById("confirm-waiting-button").style.display = "none";
        const players = lobby.cards.filter(card => !card.isMiddleCard);
        for (const player of players) {
            getCardElement(player.id).style.background = "#f0f0f0";
            document.getElementById("voted-banner" + player.id).style.display = "none";
            document.getElementById("death-overlay" + player.id).style.display = "none";
        }
        document.getElementById("role-show-stage").style.display = "none";
        document.querySelectorAll(".role-token").forEach(token => token.remove());
        document.getElementById("general-rules-list").querySelectorAll(".dynamic-rule").forEach(element => element.remove());
        document.getElementById("game-summary-button").style.display = "none";
        document.getElementById("game-summary-overlay").style.display = "none";
    }
}

function setCardClickEvent(id) {
    getCardElement(id).addEventListener("click", (event) => {
        const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));
        const card = lobby.cards.find(card => card.id === event.target.id.replace("card", ""));
        if (!card) return;
        if (lobby.state !== "night") return;
        if (document.getElementById("game").style.background !== "royalblue") return;
        if (getCardElement(card.id).style.cursor !== "pointer") return;

        const players = lobby.cards.filter(c => !c.isMiddleCard);
        const player = players.find(p => p.id === myId);

        document.getElementById("confirm-button").style.display = "none";
        if (getCardElement(card.id).classList.contains("selected-card")) {
            getCardElement(card.id).classList.remove("selected-card");
        } else {
            getCardElement(card.id).classList.add("selected-card");
        }
        const selectedCards = lobby.cards.filter(c => getCardElement(c.id).classList.contains("selected-card"));

        if (player.startingRole === "Copycat" || player.startingRole === "Sentinel" || player.startingRole === "Doppelganger" ||
            player.startingRole.toLowerCase().includes("wolf") && players.filter(p => p.startingRole.toLowerCase().includes("wolf")).length === 1 && !player.hasMetWerewolves ||
            player.startingRole === "Alpha Wolf" || player.startingRole === "Seer" && !card.isMiddleCard || player.startingRole === "Apprentice Seer" ||
            player.startingRole === "Robber" || player.startingRole === "Witch" || player.startingRole === "Drunk" ||
            player.startingRole === "Revealer") {
            lobby.cards.filter(c => c.id !== card.id).forEach(c => getCardElement(c.id).classList.remove("selected-card"));
            document.getElementById("night-action-text").textContent = "Would you like to select " + card.name + "?";
            document.getElementById("confirm-button").style.display = "flex";
        }
        if (player.startingRole === "Seer" && card.isMiddleCard) {
            lobby.cards.filter(c => !c.isMiddleCard).forEach(c => getCardElement(c.id).classList.remove("selected-card"));
            if (selectedCards.length < 2) document.getElementById("night-action-text").textContent = "You have to select one more center card";
            if (selectedCards.length > 2) document.getElementById("night-action-text").textContent = "You have to select less center cards";
            if (selectedCards.length === 2) {
                document.getElementById("night-action-text").textContent = "Would you like to view " + selectedCards[0].name + " and " + selectedCards[1].name + "?";
                document.getElementById("confirm-button").style.display = "flex";
            }
        }
        if (player.startingRole === "Troublemaker") {
            if (selectedCards.length < 2) document.getElementById("night-action-text").textContent = "You have to select one more player's card";
            if (selectedCards.length > 2) document.getElementById("night-action-text").textContent = "You have to select less player's cards";
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

    const style1 = window.getComputedStyle(card1Element);
    const style2 = window.getComputedStyle(card2Element);

    const transform1 = style1.transform !== "none" ? style1.transform : "";
    const transform2 = style2.transform !== "none" ? style2.transform : "";

    const deltaX = rect2.left - rect1.left;
    const deltaY = rect2.top - rect1.top;

    return new Promise((resolve) => {
        card1Element.style.transition = `transform ${duration}ms ease-in-out`;
        card2Element.style.transition = `transform ${duration}ms ease-in-out`;

        // move cards
        card1Element.style.transform = `translate(${deltaX}px, ${deltaY}px) ${transform1}`;
        card2Element.style.transform = `translate(${-deltaX}px, ${-deltaY}px) ${transform2}`;

        setTimeout(() => {
            // reset styles after swap
            card1Element.style.transition = "";
            card2Element.style.transition = "";
            card1Element.style.transform = "";
            if (card1.name === "middle-card4") {
                card1Element.style.transform = "translate(-50%, -50%) rotate(-90deg)";
            }
            card2Element.style.transform = "";
            if (card2.name === "middle-card4") {
                card2Element.style.transform = "translate(-50%, -50%) rotate(-90deg)";
            }
            card1Element.classList.remove("selected-card");
            card2Element.classList.remove("selected-card");

            document.getElementById("ok-button").style.display = "flex";
            document.getElementById("night-action-text").textContent = text;

            if (you.startingRole === "Robber") {
                viewCard(you, card2.role);
                document.getElementById("night-action-text").textContent = "You swapped your card with " + card2.name + "\n" +
                    "Now you are " + card2.role;
            }
            if (you.startingRole === "Alpha Wolf" && (you.roleChain[0] === "Doppelganger" || you.roleChain[0] === "Copycat" && you.selectedCards[0]?.role === "Doppelganger")) {
                wakeUpMultiple("Werewolf");
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
            nightOrder: allRoles.find(role1 => role1.name === role.name)?.nightOrder
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
        img.src = "./images/" + role.name.toLowerCase().replace(" ", "_") + ".png";
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
            nightOrder: allRoles.find(role1 => role1.name === role.name)?.nightOrder
        });
    }

    roles.sort((a, b) => a.nightOrder - b.nightOrder);

    if (lobby.selectedRoles.find(role => role.name === "Alpha Wolf")) {
        roles.push({
            name: "Werewolf",
            nightOrder: 2
        });
    }

    roles.forEach((role, index) => {
        const token = document.createElement("div");
        token.className = "role-token";
        token.style.backgroundImage = `url('./images/${role.name.toLowerCase().replace(" ", "_")}.png')`;

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
        const numberOfVotes = document.createElement("div");
        numberOfVotes.textContent = players.filter(p => p.vote === player.name).length;
        numberOfVotes.className = "dynamic-result";
        const voters = document.createElement("div");
        voters.textContent = players.filter(p => p.vote === player.name).map(p => p.name).join(", ");
        voters.className = "dynamic-result";

        document.getElementById("vote-result-display").append(name, numberOfVotes, voters);
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

function validateRoleSelection(lobby) {
    const warningContainer = document.getElementById("roles-warning-container");
    const tooltip = document.getElementById("roles-warning-tooltip");
    let errors = [];

    const counts = {};
    lobby.selectedRoles.forEach(r => counts[r.name] = (counts[r.name] || 0) + 1);

    if (!counts["Werewolf"] && !counts["Alpha Wolf"] && !counts["Minion"]) {
        errors.push("• No evil roles selected!");
    }

    if (counts["Mason"] === 1) {
        errors.push("• A single Mason is useless. Usually, you play with two.");
    }

    if (counts["Insomniac"]) {
        if (!counts["Alpha Wolf"] && !counts["Robber"] && !counts["Troublemaker"]) {
            errors.push("• Insomniac is useless. There are no roles that swap players' cards.");
        }
    }

    if (errors.length > 0 && lobby.selectedRoles.length === lobby.cards.length) {
        warningContainer.style.display = "flex";
        tooltip.innerHTML = errors.join("<br>");
    } else {
        warningContainer.style.display = "none";
    }
}

function setupGeneralInfo(you, selectedRoles) {
    const list = document.getElementById("general-rules-list");

    const yourRoleDescription = document.createElement("li");
    yourRoleDescription.innerHTML = `<b>Your Role: </b>` + allRoles.find(role => role.name === you.role).description;
    yourRoleDescription.className = "dynamic-rule";

    const text = document.createElement("li");
    text.innerHTML = `<b>How you win: </b>`;
    text.className = "dynamic-rule";

    if (you.team === "Villager") {
        text.textContent += "During voting, if a werewolf dies, your team wins.";
    }
    if (you.team === "Werewolf") {
        text.textContent += "During voting, if all werewolves survive";
        if (selectedRoles.find(role => role.name === "Tanner")) {
            text.textContent += " and the Tanner survives";
        }
        text.textContent += ", your team wins.";
    }
    if (you.team === "Tanner") {
        text.textContent += "During voting, if you die, you win.";
    }

    list.append(yourRoleDescription, text);
}

function displaySentinelShieldToken(player) {
    const shieldToken = document.createElement("img");
    shieldToken.src = "./assets/tokens/shield.png";
    shieldToken.className = "shield-token";

    getCardElement(player.id).append(shieldToken);
}

function isHost() {
    const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));
    return !!(lobby && lobby.cards.filter(card => !card.isMiddleCard)[0].id === myId);
}

export {showErrorPopup, displayCards, clickSelectCard, viewCard, setupButtonEvents, getCardElement,
    resetNightActionTexts, createLobbyDisplay, createStartButton, showVoteResults, clearEverything, animateCardSwap,
    updateKickMenu, openRolesDisplay, setupTokens, sendMessage, sendConsoleMessage, loadMessages, receiveMessage,
    showVoteResultBoard, setupGeneralInfo, displaySentinelShieldToken};