import {animateCardSwap, getCardElement, viewCard} from "./functions.js";
import {allRoles, lobbies, myId, socket} from "./index.js";

function wakeUpMultiple(player, roleName) {
    if (player.startingRole !== roleName) return;

    const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));
    const players = lobby.cards.filter(card1 => !card1.isMiddleCard);

    const samePlayers = [];
    players.forEach(p => {
        if (p.startingRole === roleName) {
            samePlayers.push(p.name);
            viewCard(p, roleName);
        }
    });

    if (roleName === "Werewolf") {
        document.getElementById("night-action-text").textContent = "These are the werewolves: " + samePlayers.join(", ");
        if (samePlayers.length === 1) {
            document.getElementById("night-action-text").textContent += "\n Because you are the only werewolf, you may click one center card to view it.";
            document.getElementById("do-nothing-button").style.display = "flex";
            lobby.cards.filter(c => c.isMiddleCard).forEach(c => getCardElement(c.id).style.cursor = "pointer");
        }
        if (samePlayers.length > 1) {
            document.getElementById("ok-button").style.display = "flex";
        }
    }
    if (roleName === "Mason") {
        document.getElementById("night-action-text").textContent = "These players are Masons: " + samePlayers.join(", ");
        document.getElementById("ok-button").style.display = "flex";
    }
}

function minionSeeWerewolves(player) {
    if (player.startingRole !== "Minion") return;

    const lobby = lobbies.find(lobby => lobby.cards.find(p => p.id === myId));
    const players = lobby.cards.filter(card1 => !card1.isMiddleCard);

    const werewolfPlayers = [];

    for (const p of players) {
        if (p.startingRole === "Werewolf") {
            werewolfPlayers.push(p.name);
            viewCard(p, "Werewolf");
        }
    }
    document.getElementById("night-action-text").textContent = "These players are werewolves: " + werewolfPlayers.join(", ");
    if (werewolfPlayers.length === 0) {
        document.getElementById("night-action-text").textContent = "There are no werewolves";
    }
    document.getElementById("ok-button").style.display = "flex";
}

function showRoleActions() {
    const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));
    if (!lobby) return;
    if (lobby.state !== "night") return;
    const player = lobby.cards.find(player => player.id === myId);
    if (!player) return;
    if (player.hasDoneNightAction) {
        document.getElementById("night-action-text").textContent = "waiting until every player has done their night actions ...";
        return;
    }
    wakeUpMultiple(player, "Werewolf");
    wakeUpMultiple(player, "Mason");
    minionSeeWerewolves(player);

    if (player.startingRole === "Insomniac") {
        document.getElementById("night-action-text").textContent = "wait until everyone else has done their night actions ...";
    }

    if (player.startingRole !== "Seer" && player.startingRole !== "Robber" && player.startingRole !== "Troublemaker" && player.startingRole !== "Drunk") {
        return;
    }

    const middleCards = lobby.cards.filter(card => card.isMiddleCard);
    const playerCards = lobby.cards.filter(card => !card.isMiddleCard);

    if (player.startingRole === "Seer" || player.startingRole === "Drunk") {
        for (const card of middleCards) {
            getCardElement(card.id).style.cursor = "pointer";
        }
    }

    if (player.startingRole === "Seer" || player.startingRole === "Robber" || player.startingRole === "Troublemaker") {
        for (const card of playerCards) {
            getCardElement(card.id).style.cursor = "pointer";
        }
    }

    document.getElementById("night-action-text").textContent = allRoles.find(role => role.name === player.startingRole).nightAction;
    document.getElementById("do-nothing-button").style.display = "flex";

    if (player.startingRole === "Robber" || player.startingRole === "Troublemaker") {
        getCardElement(player.id).style.cursor = "default";
    }
    if (player.startingRole === "Drunk") {
        document.getElementById("do-nothing-button").style.display = "none";
    }
}

function confirmButtonAction() {
    const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));
    const player = lobby.cards.find(player => player.id === myId);
    const selectedCards = lobby.cards.filter(c => getCardElement(c.id).classList.contains("selected-card"));

    lobby.cards.forEach(card => getCardElement(card.id).style.cursor = "default");
    document.getElementById("do-nothing-button").style.display = "none";
    document.getElementById("confirm-button").style.display = "none";

    socket.emit("set-selected-cards", selectedCards.map(card => card.name));

    if (player.startingRole === "Werewolf" || player.startingRole === "Seer") {
        viewCard(selectedCards[0]);
        if (selectedCards.length > 1) {
            viewCard(selectedCards[1]);
        }
        document.getElementById("ok-button").style.display = "flex";
    }
    if (player.startingRole === "Robber") {
        socket.emit("add-swap", {priority: 6, swap: [player, selectedCards[0]]});
        animateCardSwap(player, selectedCards[0]);
        return;
    }
    if (player.startingRole === "Troublemaker") {
        socket.emit("add-swap", {priority: 7, swap: selectedCards});
        animateCardSwap(selectedCards[0], selectedCards[1], "You swapped " + selectedCards[0].name + " and " + selectedCards[1].name);
    }
    if (player.startingRole === "Drunk") {
        socket.emit("add-swap", {priority: 8, swap: [player, selectedCards[0]]});
        animateCardSwap(player, selectedCards[0], "You swapped your card with " + selectedCards[0].name);
    }
}

export {wakeUpMultiple, showRoleActions, confirmButtonAction};