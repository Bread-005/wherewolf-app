import {allRoles, lobbies, myId, socket} from "./index.js";
import {wakeUpMultiple} from "./roleActions.js";
import {setCardClickEvent} from "./CardClickEvent.js";

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

    lobby.cards.forEach((card1, index) => {
        const card = document.createElement("div");
        card.id = "card" + card1.id;
        if (!card1.isMiddleCard) {
            card.textContent = card1.name;
            card.className = "player-card";
            if (card1.id === myId) {
                card.classList.add("you-card");
            }
        }

        if (card1.isMiddleCard) {
            card.className = "center-card";
            card.style.left = (34 + (index * 12)) + "%";

            if (card1.name === "middle-card4") {
                card.style.top = "45%";
                card.style.left = "50%";
                card.style.transform = "translate(-50%, -50%) rotate(-90deg)";
            }
        }

        cardsContainer.append(card);
    });

    for (const player of players) {
        const readyBanner = document.createElement("div");
        readyBanner.id = "ready-banner" + player.id;
        readyBanner.className = "ready-banner";
        readyBanner.textContent = "Is Ready";

        const votedBanner = document.createElement("div");
        votedBanner.id = "voted-banner" + player.id;
        votedBanner.className = "voted-banner";
        votedBanner.textContent = "Voted";

        const deathOverlay = document.createElement("div");
        deathOverlay.id = "death-overlay" + player.id;
        deathOverlay.className = "death-overlay";

        document.getElementById("card" + player.id).append(votedBanner, deathOverlay, readyBanner);
        setupVotingClickEvent(document.getElementById("card" + player.id));
    }
    setupLookAtRole();

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
    const verticalGap = 25;

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

    // set night action events
    for (const card of lobby.cards) {
        setCardClickEvent(card.id);
    }
}

function viewCard(card, as = card.role) {
    const img = document.createElement("img");
    img.src = "./images/" + as.toLowerCase().replace(" ", "_") + ".png";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.position = "relative";

    if (getCardElement(card.id).querySelectorAll("img")[0]?.src !== img.src) {
        removeAllImg(card.id);
        getCardElement(card.id).append(img);
        getCardElement(card.id).style.cursor = "default";
    }
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
        socket.emit("has-clicked-ok-or-do-nothing", false);
        resetNightActionTexts();
    });
    document.getElementById("ok-button").addEventListener("click", () => {
        socket.emit("has-clicked-ok-or-do-nothing", true);
        resetNightActionTexts();
    });
    document.getElementById("confirm-seen-button").addEventListener("click", () => {
        document.getElementById("confirm-seen-button").style.display = "none";
        socket.emit("confirm-seen-random-action");
    });
}

function resetNightActionTexts() {
    const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));
    document.getElementById("confirm-button").style.display = "none";
    document.getElementById("ok-button").style.display = "none";
    document.getElementById("do-nothing-button").style.display = "none";
    document.getElementById("confirm-waiting-button").style.display = "none";
    document.getElementById("confirm-seen-button").style.display = "none";
    document.getElementById("night-action-text").textContent = "waiting until every player has done their night actions ...";

    for (const card of lobby.cards) {
        getCardElement(card.id).classList.remove("selected-card");
        removeAllImg(card.id);
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
        joinButton.className = "join-lobby-button";

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
            if (lobby.cards.find(card => card.name === nameInput.trim())) {
                showErrorPopup("Name already exists in that Lobby");
                return;
            }
            if (nameInput.trim().includes("middle-card")) {
                showErrorPopup("Your name may not contain 'middle-card'");
                return;
            }
            if (lobby.cards.filter(card => !card.isMiddleCard).length >= 10) {
                showErrorPopup("There cannot be more than 10 players in one game!");
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
        const players = lobby.cards.filter(card => !card.isMiddleCard);
        document.body.style.backgroundImage = `url("./assets/wherewolf_background_day.png")`;
        document.getElementById("cards").querySelectorAll("img").forEach(img => img.remove());
        if (isHost()) {
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
        document.getElementById("confirm-seen-button").style.display = "none";
        for (const player of players) {
            document.getElementById("voted-banner" + player.id).style.display = "none";
            document.getElementById("death-overlay" + player.id).style.display = "none";
        }
        document.getElementById("role-show-stage-container").style.display = "none";
        document.querySelectorAll(".role-token").forEach(token => token.remove());
        document.getElementById("general-rules-list").querySelectorAll(".dynamic-rule").forEach(element => element.remove());
        document.getElementById("game-summary-button").style.display = "none";
        document.getElementById("game-summary-overlay").style.display = "none";
    }
}

function showVoteResults() {
    document.getElementById("vote-result-display").style.display = "grid";

    const lobby = lobbies.find(l => l.cards.find(player => player.id === myId));
    const players = lobby.cards.filter(card => !card.isMiddleCard);

    showVoteResultBoard(lobby, players);

    for (const player of players) {
        getCardElement(player.id).style.background = "#f0f0f0";
    }
}

function setupVotingClickEvent(card) {
    if (card.id !== "card" + myId) {
        card.addEventListener("click", () => {
            const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));
            if (lobby.state !== "voting") return;
            if (card.style.cursor !== "pointer") {
                showErrorPopup("You have already voted!");
                return;
            }
            for (const card1 of lobby.cards) {
                if (card1.isMiddleCard) continue;

                getCardElement(card1.id).style.cursor = "default";
            }
            const votedPlayer = lobby.cards.find(p => p.id === card.id.replace("card", ""));
            socket.emit("set-has-voted", votedPlayer.name);
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
            if (you.startingRole === "Alpha Wolf" && isDoppelganger(you)) {
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

    roles.forEach((role) => {
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
        if (role1.team === "Mortician") {
            token.style.border = "2px solid #24150a";
        }
        if (role1.team === "Blob") {
            token.style.border = "2px solid #54533a";
        }

        // Drag & Drop logic
        let isDragging = false;
        let offsetX, offsetY;

        token.addEventListener("mousedown", (event) => {
            isDragging = true;

            const rect = token.getBoundingClientRect();

            offsetX = event.clientX - rect.left;
            offsetY = event.clientY - rect.top;

            if (!token.classList.contains("dragging")) {
                token.style.left = rect.left + "px";
                token.style.top = rect.top + "px";

                document.body.append(token);
                token.classList.add("dragging");
            }
        });

        document.addEventListener("mousemove", (event) => {
            if (!isDragging) return;

            let x = event.clientX - offsetX;
            let y = event.clientY - offsetY;

            const minX = 0;
            const minY = 0;
            const maxX = window.innerWidth - token.offsetWidth;
            const maxY = window.innerHeight - token.offsetHeight;

            x = Math.max(minX, Math.min(x, maxX));
            y = Math.max(minY, Math.min(y, maxY));

            token.style.left = x + "px";
            token.style.top = y + "px";
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

    requestAnimationFrame(() => {
        if (container.children.length > 0) {
            const rect = container.getBoundingClientRect();
            container.style.width = rect.width + "px";
            container.style.height = rect.height + "px";
        }
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

    if (document.getElementById("vote-result-display").querySelectorAll(".dynamic-result").length === 0) {
        document.getElementById("toggle-show-stage-button").addEventListener("click", () => {
            const lobby1 = lobbies.find(l => l.cards.find(player => player.id === myId));
            if (document.getElementById("role-show-stage").textContent === "Shows Ending Roles") {
                showStartingRoles(lobby1);
            } else {
                showEndingRoles(lobby1);
            }
        });
    }

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
}

function validateRoleSelection(lobby) {
    const warningContainer = document.getElementById("roles-warning-container");
    const tooltip = document.getElementById("roles-warning-tooltip");
    let errors = [];

    const counts = {};
    lobby.selectedRoles.forEach(r => counts[r.name] = (counts[r.name] || 0) + 1);

    if (!counts["Werewolf"] && !counts["Alpha Wolf"] && !counts["Mystic Wolf"] && !counts["Dream Wolf"] && !counts["Minion"]) {
        errors.push("• No evil roles selected!");
    }

    if (counts["Mason"] === 1) {
        errors.push("• A single Mason is useless. Usually, you play with two.");
    }

    if (counts["Insomniac"]) {
        if (!counts["Alpha Wolf"] && !counts["Robber"] && !counts["Witch"] && !counts["Troublemaker"]) {
            errors.push("• Insomniac is useless. There are no roles that swap players' cards.");
        }
    }

    if (counts["Bodyguard"] && lobby.cards.filter(card => !card.isMiddleCard).length < 5) {
        errors.push("• It is not advised to have a Bodyguard with less than 5 players.");
    }

    if (errors.length > 0 && lobby.selectedRoles.length === lobby.cards.filter(card => card.name !== "middle-card4").length && lobby.cards.filter(card => !card.isMiddleCard).length >= 3) {
        warningContainer.style.display = "flex";
        tooltip.innerHTML = errors.join("<br>");
    } else {
        warningContainer.style.display = "none";
    }
}

function setupGeneralInfo(you, selectedRoles) {
    const list = document.getElementById("general-rules-list");

    const yourRoleDescription = document.createElement("li");
    const yourRole = allRoles.find(role => role.name === you.roleChain[0]);
    yourRoleDescription.innerHTML = `<b>Your Role: </b>` + yourRole.description;
    yourRoleDescription.className = "dynamic-rule";

    const text = document.createElement("li");
    text.innerHTML = `<b>How you win: </b>`;
    text.className = "dynamic-rule";

    if (yourRole.team === "Villager") {
        text.textContent += "During voting, if a werewolf dies, your team wins.";
    }
    if (yourRole.team === "Werewolf") {
        text.textContent += "During voting, if all werewolves survive";
        if (selectedRoles.find(role => role.name === "Tanner")) {
            text.textContent += " and the Tanner survives";
        }
        text.textContent += ", your team wins.";
    }
    if (yourRole.team === "Tanner") {
        text.textContent += "During voting, if you die, you win.";
    }
    if (yourRole.team === "Mortician") {
        text.textContent += "During voting, if any of your neighbor dies, you win.";
    }
    if (yourRole.team === "Blob") {
        text.textContent += "During voting, if all specific players (announced by the website) survive, you win.";
    }

    list.append(yourRoleDescription, text);
}

function displaySentinelShieldToken(players) {
    for (const player of players) {
        if (player.isSentinelled && getCardElement(player.id).querySelectorAll(".shield-token").length === 0) {
            const shieldToken = document.createElement("img");
            shieldToken.src = "./assets/tokens/shield.png";
            shieldToken.className = "shield-token";

            getCardElement(player.id).append(shieldToken);
        }
    }
}

function isHost() {
    const lobby1 = lobbies.find(lobby1 => lobby1.cards.find(player => player.id === myId));
    return !!(lobby1 && lobby1.cards.filter(card => !card.isMiddleCard)[0].id === myId);
}

function isDoppelganger(player) {
    return player.roleChain[0] === "Doppelganger" || player.roleChain[0] === "Copycat" && player.selectedCards[0]?.role === "Doppelganger";
}

function setupLookAtRole() {
    getCardElement(myId).addEventListener("click", () => {
        const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));
        if (lobby && lobby.state === "look-at-role" && getCardElement(myId).style.cursor === "pointer") {
            viewCard(lobby.cards.find(player => player.id === myId));
            document.getElementById("continue-button").style.display = "flex";
        }
    });
}

function removeAllImg(id) {
    getCardElement(id).querySelectorAll("img").forEach(img => {
        if (img.className !== "shield-token") {
            img.remove();
        }
    });
}

export {showErrorPopup, displayCards, viewCard, setupButtonEvents, getCardElement,
    resetNightActionTexts, createLobbyDisplay, showVoteResults, clearEverything, animateCardSwap,
    updateKickMenu, openRolesDisplay, setupTokens, sendMessage, sendConsoleMessage, loadMessages, receiveMessage,
    showVoteResultBoard, setupGeneralInfo, displaySentinelShieldToken, isDoppelganger, isHost,
    validateRoleSelection, removeAllImg};