import {animateCardSwap, getCardElement, viewCard} from "./functions.js";
import {allRoles, lobbies, myId, socket} from "./index.js";

function wakeUpMultiple(player, roleName) {
    if (player.roleChain[0] !== roleName) return;

    const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));
    const players = lobby.cards.filter(card1 => !card1.isMiddleCard);

    const samePlayers = [];
    players.forEach(p => {
        if (p.roleChain[0] === roleName) {
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

function showNightAction(roleName, player, mayChooseCenter, mayChoosePlayers) {
    if (player.roleChain[0] !== roleName) return;

    document.getElementById("night-action-text").textContent = allRoles.find(role => role.name === roleName).nightAction;
    document.getElementById("do-nothing-button").style.display = "flex";

    const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));

    for (const card of lobby.cards) {
        if (mayChooseCenter && card.isMiddleCard) getCardElement(card.id).style.cursor = "pointer";
        if (mayChoosePlayers && !card.isMiddleCard) getCardElement(card.id).style.cursor = "pointer";
    }
    if (player.roleChain[0] === "Robber" || player.roleChain[0] === "Troublemaker") {
        getCardElement(player.id).style.cursor = "default";
    }
    if (player.roleChain[0] === "Drunk" || player.roleChain[0] === "Insomniac") {
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
    wakeUpMultiple(player, "Werewolf");
    wakeUpMultiple(player, "Mason");
    showNightAction("Seer", player, true, true);
    showNightAction("Robber", player, false, true);
    showNightAction("Troublemaker", player, false, true);
    showNightAction("Drunk", player, true, false);
    if (player.roleChain[0] === "Insomniac") {
        document.getElementById("night-action-text").textContent = "wait until everyone else has done their night actions ...";
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

    if (player.roleChain[0] === "Werewolf" || player.roleChain[0] === "Seer") {
        viewCard(selectedCards[0]);
        if (selectedCards.length > 1) {
            viewCard(selectedCards[1]);
        }
        document.getElementById("ok-button").style.display = "flex";
    }
    if (player.roleChain[0] === "Robber") {
        socket.emit("add-swap", {priority: 6, swap: [player, selectedCards[0]]});
        animateCardSwap(player, selectedCards[0]);
        return;
    }
    if (player.roleChain[0] === "Troublemaker") {
        socket.emit("add-swap", {priority: 7, swap: selectedCards});
        animateCardSwap(selectedCards[0], selectedCards[1], "You swapped " + selectedCards[0].name + " and " + selectedCards[1].name);
    }
    if (player.roleChain[0] === "Drunk") {
        socket.emit("add-swap", {priority: 8, swap: [player, selectedCards[0]]});
        animateCardSwap(player, selectedCards[0], "You swapped your card with " + selectedCards[0].name);
    }
}

export {wakeUpMultiple, showNightAction, showRoleActions, confirmButtonAction};