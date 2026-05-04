import {allRoles, lobbies, myId} from "./index.js";
import {getCardElement} from "./functions.js";

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
            player.startingRole === "Alpha Wolf" || player.startingRole === "Mystic Wolf" || player.startingRole === "Seer" && !card.isMiddleCard || player.startingRole === "Apprentice Seer" ||
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

export {setCardClickEvent};