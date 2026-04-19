import {getCardElement, getPlayers} from "./functions.js";
import {lobbies, myId} from "./index.js";

function werewolfAction(card) {
    if (!card.role || card.role !== "Werewolf") return;

    const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));
    const werewolfPlayers = [card.name];
    for (const player1 of getPlayers(lobby)) {
        if (card.id === player1.id) continue;
        const card1 = lobby.cards.find(c => c.id === player1.id);
        if (card1.role === "Werewolf") {
            document.getElementById("card" + card1.id).style.border = "5px solid red";
            werewolfPlayers.push(player1.name);
        }
    }
    const nightAction = document.getElementById("night-action");
    nightAction.style.display = "flex";
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
}

export {werewolfAction, setupRoleAction};