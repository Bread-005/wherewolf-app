import {allRoles, myId} from "./index.js";
import {getCurrentLobby} from "./lobby.js";
import {
    getCardElement, getMarkElement, getMarkTitle, isDoppelganger, playerHasStartingRoleOf, resetMarkCursors,
    setMarkFace
} from "./functions.js";

function setCardClickEvent(id) {
    getCardElement(id).addEventListener("click", (event) => {
        const lobby = getCurrentLobby();
        const card = lobby.cards.find(card => card.id === event.target.id.replace("card", ""));
        if (!card) return;
        if (lobby.state !== "night" && lobby.state !== "dusk") return;
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

        if (player.roleChain[0] === "Oracle") {
            if (lobby.oracleAnswer.includes("go ahead") || lobby.oracleAnswer.includes("you may view") || lobby.oracleAnswer.includes("You may look at one")) {
                lobby.cards.filter(c => c.id !== card.id).forEach(c => getCardElement(c.id).classList.remove("selected-card"));
                document.getElementById("night-action-text").textContent = "Would you like to select " + card.name + "?";
                document.getElementById("confirm-button").style.display = "flex";
            }
        }

        if (playerHasStartingRoleOf(player, ["Copycat", "Sentinel", "Doppelganger", "Alpha Wolf",
                "Mystic Wolf", "Apprentice Seer", "Paranormal Investigator", "Robber", "Witch", "Drunk", "Revealer",
                "Exposer", "Thing"]) ||
            player.startingRole.toLowerCase().includes("wolf") && players.filter(p => p.startingRole.toLowerCase().includes("wolf")).length === 1 && !player.hasMetWerewolves ||
            player.startingRole === "Seer" && !card.isMiddleCard ||
            player.startingRole === "Mortician" && !isDoppelganger(player) && lobby.randomActions.find(action => action.role === "Mortician")?.action.includes("on") ||
            player.startingRole === "Mortician" && isDoppelganger(player) && lobby.randomActions.find(action => action.role === "Doppelganger-Mortician")?.action.includes("on")) {
            lobby.cards.filter(c => c.id !== card.id).forEach(c => getCardElement(c.id).classList.remove("selected-card"));
            document.getElementById("night-action-text").textContent = "Would you like to select " + card.name + "?";
            document.getElementById("confirm-button").style.display = "flex";
        }
        if (player.roleChain[0] === "Oracle" && lobby.oracleAnswer === "You may look at two other center cards instead." ||
            player.startingRole === "Seer" && card.isMiddleCard ||
            player.startingRole === "Mortician" && !isDoppelganger(player) && lobby.randomActions.find(action => action.role === "Mortician")?.action.includes("both") ||
            player.startingRole === "Mortician" && isDoppelganger(player) && lobby.randomActions.find(action => action.role === "Doppelganger-Mortician")?.action.includes("both")) {
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
        if (player.startingRole === "Village Idiot" && selectedCards.length > 0) {
            lobby.cards.filter(c => c.id !== card.id).forEach(c => getCardElement(c.id).classList.remove("selected-card"));
            const myIndex = players.findIndex(p => p.id === player.id);
            document.getElementById("night-action-text").textContent = "Would you like to move everyone's card (except your own) to the ";
            if (players[(myIndex + 1) % players.length].name === card.name) {
                document.getElementById("night-action-text").textContent += "left?";
            }
            if (players[(myIndex - 1 + players.length) % players.length].name === card.name) {
                document.getElementById("night-action-text").textContent += "right?";
            }
            document.getElementById("confirm-button").style.display = "flex";
        }
        if (selectedCards.length === 0) {
            document.getElementById("confirm-button").style.display = "none";
            document.getElementById("night-action-text").textContent = allRoles.find(role => role.name === player.startingRole).nightAction;
            if (lobby.randomActions.find(action => action.role === player.startingRole)) {
                document.getElementById("night-action-text").textContent = lobby.randomActions.find(action => action.role === player.startingRole).action;
            }
            if (lobby.randomActions.find(action => action.role === player.startingRole) && isDoppelganger(player)) {
                document.getElementById("night-action-text").textContent = lobby.randomActions.find(action => action.role === "Doppelganger-" + player.startingRole).action;
            }
            if (player.startingRole === "Werewolf") {
                document.getElementById("night-action-text").textContent = "You are the only werewolf, therefore you may click one center card to view it.";
            }
        }
    });
}

/**
 * Dusk: the local player turns their own mark face-up.
 */
function lookAtOwnMark(you) {
    setMarkFace(myId, you.mark);
    resetMarkCursors();
    document.getElementById("night-action-text").textContent = "You have the mark of " + getMarkTitle(you.mark);
    document.getElementById("continue-button").style.display = "flex";
}

/**
 * Dusk: a mark giver (Assassin, Instigator) selects the player who gets their mark.
 * Only one mark can be selected.
 */
function selectMarkForMarkGiver(lobby, idPlayer) {
    const markGiverRole = lobby.cards.find(card => card.id === myId).startingRole;
    const markElement = getMarkElement(idPlayer);
    const wasSelected = markElement.classList.contains("selected-mark");
    document.querySelectorAll(".selected-mark").forEach(selectedMark => selectedMark.classList.remove("selected-mark"));
    document.getElementById("confirm-button").style.display = "none";
    if (wasSelected) {
        document.getElementById("night-action-text").textContent = allRoles.find(role => role.name === markGiverRole).nightAction;
        return;
    }
    markElement.classList.add("selected-mark");
    const target = lobby.cards.find(card => card.id === idPlayer);
    document.getElementById("night-action-text").textContent =
        "Would you like to give the mark of " + getMarkTitle(markGiverRole) + " to " + target.name + "?";
    document.getElementById("confirm-button").style.display = "flex";
}

function setMarkClickEvent(idPlayer) {
    getMarkElement(idPlayer).addEventListener("click", (event) => {
        event.stopPropagation();
        const lobby = getCurrentLobby();
        if (lobby.state !== "dusk" || getMarkElement(idPlayer).style.cursor !== "pointer") {
            return;
        }
        if (lobby.duskActionsDone) {
            lookAtOwnMark(lobby.cards.find(card => card.id === myId));
            return;
        }
        selectMarkForMarkGiver(lobby, idPlayer);
    });
}

export {setCardClickEvent, setMarkClickEvent};