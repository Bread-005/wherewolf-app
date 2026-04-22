import {getCardElement, viewCard} from "./functions.js";
import {lobbies, myId} from "./index.js";

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

function showNightAction(roleName, player, message, mayChooseCenter, mayChoosePlayers, cursor) {
    if (!player.role || player.role !== roleName) return;

    document.getElementById("night-action-text").textContent = message;
    document.getElementById("do-nothing-button").style.display = "flex";

    const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));

    for (const card of lobby.cards) {
        if (mayChooseCenter && card.isMiddleCard) getCardElement(card.id).style.cursor = cursor;
        if (mayChoosePlayers && !card.isMiddleCard) getCardElement(card.id).style.cursor = cursor;
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
    showNightAction("Seer", player, "You may view any player´s card or two cards from the center. \n" +
        "Click on the cards to look at them.", true, true, "pointer");
    showNightAction("Robber", player, "You may swap your card, with another player's card and then look at your role.",
        false, true, "grab");
    showNightAction("Troublemaker", player, "You may swap two other players' cards",
        false, true, "grab");
    showNightAction("Drunk", player, "You must choose a center card to swap yours with",
        true, false, "grab");
}

export {werewolfAction, showNightAction, showRoleActions};