import {getCardElement, getPlayers} from "./functions.js";

function werewolfAction(card, player, lobby) {
    if (!card.role || card.role !== "Werewolf") return;

    const werewolfPlayers = [player.name];
    for (const player1 of getPlayers(lobby)) {
        if (player.id === player1.id) continue;
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

function seerAction(card, lobby) {
    if (!card.role || card.role !== "Seer") return;

    const nightAction = document.getElementById("night-action");
    nightAction.style.display = "flex";
    document.getElementById("night-action-text").textContent = "You may view any player´s card or two cards from the center. \n" +
        "Click on the cards to look at them.";
    document.getElementById("do-nothing-button").style.display = "flex";
    lobby.cards.forEach(c => getCardElement(c.id).style.cursor = "pointer");
}

export {werewolfAction, seerAction};