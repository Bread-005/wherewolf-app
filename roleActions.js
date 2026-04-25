import {animateCardSwap, getCardElement, viewCard} from "./functions.js";
import {allRoles, lobbies, myId, socket} from "./index.js";

function werewolfAction(card) {
    if (!card.role || card.role !== "Werewolf") return;

    const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));
    const players = lobby.cards.filter(card1 => !card1.isMiddleCard);

    const werewolfPlayers = [];
    for (const player of players) {
        if (player.role === "Werewolf") {
            werewolfPlayers.push(player.name);
            viewCard(player, "Werewolf");
        }
    }
    document.getElementById("night-action-text").textContent = "These are the werewolves: " + werewolfPlayers.join(", ");
    if (werewolfPlayers.length === 1) {
        document.getElementById("night-action-text").textContent += "\n Because you are the only werewolf, you may click one center card to view it.";
        document.getElementById("do-nothing-button").style.display = "flex";
        lobby.cards.filter(c => c.isMiddleCard).forEach(c => getCardElement(c.id).style.cursor = "pointer");
    }
    if (werewolfPlayers.length > 1) {
        document.getElementById("ok-button").style.display = "flex";
    }
}

function showNightAction(roleName, player, mayChooseCenter, mayChoosePlayers) {
    if (!player.role || player.role !== roleName) return;

    document.getElementById("night-action-text").textContent = allRoles.find(role => role.name === roleName).nightAction;
    document.getElementById("do-nothing-button").style.display = "flex";

    const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));

    for (const card of lobby.cards) {
        if (mayChooseCenter && card.isMiddleCard) getCardElement(card.id).style.cursor = "pointer";
        if (mayChoosePlayers && !card.isMiddleCard) getCardElement(card.id).style.cursor = "pointer";
    }
    if (player.role === "Robber" || player.role === "Troublemaker") {
        getCardElement(player.id).style.cursor = "default";
    }
    if (player.role === "Drunk") {
        document.getElementById("do-nothing-button").style.display = "none";
    }
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
    werewolfAction(player);
    showNightAction("Seer", player, true, true);
    showNightAction("Robber", player, false, true);
    showNightAction("Troublemaker", player, false, true);
    showNightAction("Drunk", player, true, false);
}

function confirmButtonAction() {
    const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));
    const player = lobby.cards.find(player => player.id === myId);
    const selectedCards = lobby.cards.filter(c => getCardElement(c.id).classList.contains("selected-card"));

    lobby.cards.forEach(card => getCardElement(card.id).style.cursor = "default");
    document.getElementById("do-nothing-button").style.display = "none";
    document.getElementById("confirm-button").style.display = "none";

    if (player.role === "Werewolf" || player.role === "Seer") {
        viewCard(selectedCards[0]);
        if (selectedCards.length > 1) {
            viewCard(selectedCards[1]);
        }
        document.getElementById("ok-button").style.display = "flex";
    }
    if (player.role === "Robber") {
        socket.emit("add-swap", {priority: 6, swap: [player, selectedCards[0]]});
        animateCardSwap(player, selectedCards[0]);
        return;
    }
    if (player.role === "Troublemaker") {
        socket.emit("add-swap", {priority: 7, swap: selectedCards});
        animateCardSwap(selectedCards[0], selectedCards[1], "You swapped " + selectedCards[0].name + " and " + selectedCards[1].name);
    }
    if (player.role === "Drunk") {
        socket.emit("add-swap", {priority: 8, swap: [player, selectedCards[0]]});
        animateCardSwap(player, selectedCards[0], "You swapped your card with " + selectedCards[0].name);
    }
}

export {werewolfAction, showNightAction, showRoleActions, confirmButtonAction};