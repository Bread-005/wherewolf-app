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
    lobby.cards.forEach(card => getCardElement(card.id).style.cursor = "default");
    if (lobby.state !== "night") return;
    const player = lobby.cards.find(player => player.id === myId);
    if (!player) return;
    if (lobby.cards.find(card => card.role === "Doppelganger") && lobby.nightTimer < 21 && player.roleChain[0] !== "Doppelganger") {
        document.getElementById("night-action-text").textContent = "waiting for a potential Doppelganger to perform their action ...";
        return;
    }
    if (player.hasDoneNightAction) {
        document.getElementById("night-action-text").textContent = "waiting until every player has done their night actions ...";
        return;
    }
    if (player.roleChain[0] !== "Doppelganger" || lobby.nightTimer > 20) {
        wakeUpMultiple(player, "Werewolf");
        wakeUpMultiple(player, "Mason");
        minionSeeWerewolves(player);
    }

    if (player.startingRole === "Insomniac") {
        document.getElementById("night-action-text").textContent = "wait until everyone else has done their night actions ...";
    }

    if (player.startingRole !== "Seer" && player.startingRole !== "Robber" && player.startingRole !== "Troublemaker" && player.startingRole !== "Drunk" &&
        player.startingRole !== "Doppelganger") {
        return;
    }

    const middleCards = lobby.cards.filter(card => card.isMiddleCard);
    const otherPlayerCards = lobby.cards.filter(card => !card.isMiddleCard && card.id !== myId);

    if (player.startingRole === "Seer" || player.startingRole === "Drunk") {
        for (const card of middleCards) {
            getCardElement(card.id).style.cursor = "pointer";
        }
    }

    if (player.startingRole === "Seer" || player.startingRole === "Robber" || player.startingRole === "Troublemaker" ||
        player.startingRole === "Doppelganger") {
        for (const card of otherPlayerCards) {
            getCardElement(card.id).style.cursor = "pointer";
        }
    }

    document.getElementById("night-action-text").textContent = allRoles.find(role => role.name === player.startingRole).nightAction;
    document.getElementById("do-nothing-button").style.display = "flex";

    if (player.startingRole === "Drunk" || player.startingRole === "Doppelganger") {
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

    socket.emit("add-selected-cards", selectedCards.map(card => {
        return {
            name: card.name,
            role: card.role,
            team: card.team
        }
    }));

    if (player.startingRole === "Werewolf" || player.startingRole === "Seer" || player.startingRole === "Doppelganger") {
        viewCard(selectedCards[0]);
        if (selectedCards.length > 1) {
            viewCard(selectedCards[1]);
        }
        document.getElementById("ok-button").style.display = "flex";
        if (player.startingRole === "Doppelganger") {
            document.getElementById("night-action-text").textContent = "You look at " + selectedCards[0].name + "'s card and see " + selectedCards[0].role;
        }
    }
    if (player.startingRole === "Robber") {
        socket.emit(player.roleChain[0] === "Doppelganger" ? "perform-swap" : "add-swap", {priority: 6, swap: [player, selectedCards[0]]});
        animateCardSwap(player, selectedCards[0]);
    }
    if (player.startingRole === "Troublemaker") {
        socket.emit(player.roleChain[0] === "Doppelganger" ? "perform-swap" : "add-swap", {priority: 7, swap: selectedCards});
        animateCardSwap(selectedCards[0], selectedCards[1], "You swapped " + selectedCards[0].name + " and " + selectedCards[1].name);
    }
    if (player.startingRole === "Drunk") {
        socket.emit(player.roleChain[0] === "Doppelganger" ? "perform-swap" : "add-swap", {priority: 8, swap: [player, selectedCards[0]]});
        animateCardSwap(player, selectedCards[0], "You swapped your card with " + selectedCards[0].name);
    }
}

export {wakeUpMultiple, showRoleActions, confirmButtonAction};