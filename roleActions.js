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
    document.getElementById("night-action").style.display = "flex";
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

function setupRoleAction(roleName, card, nightActionText, maxChooseCenter, mayChoosePlayers, cursor) {
    if (!card.role || card.role !== roleName) return;

    document.getElementById("night-action").style.display = "flex";
    document.getElementById("night-action-text").textContent = nightActionText;
    document.getElementById("do-nothing-button").style.display = "flex";
    const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));

    for (const card1 of lobby.cards) {
        if (maxChooseCenter && card1.isMiddleCard) getCardElement(card1.id).style.cursor = cursor;
        if (mayChoosePlayers && !card1.isMiddleCard) getCardElement(card1.id).style.cursor = cursor;
    }
    if (card.role === "Troublemaker") {
        getCardElement(card.id).style.cursor = "default";
    }
    if (card.role === "Drunk") {
        document.getElementById("do-nothing-button").style.display = "none";
    }
}

export {werewolfAction, setupRoleAction};