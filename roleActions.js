import {animateCardSwap, getCardElement, viewCard} from "./functions.js";
import {allRoles, lobbies, myId, socket} from "./index.js";

function wakeUpMultiple(roleName) {

    const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));
    const players = lobby.cards.filter(card1 => !card1.isMiddleCard);

    const samePlayers = [];
    players.forEach(p => {
        if (p.startingRole === roleName) {
            samePlayers.push(p.name);
            if (getCardElement(p.id).querySelectorAll("img").length === 0 && p.id !== myId) {
                viewCard(p, roleName);
            }
        }
    });

    if (roleName === "Werewolf") {
        const hasSelectedCard = document.getElementById("cards").querySelectorAll(".selected-card").length > 0;
        if (!hasSelectedCard) {
            document.getElementById("night-action-text").textContent = "These are the werewolves: " + samePlayers.join(", ");
        }
        if (samePlayers.length === 1) {
            if (!hasSelectedCard) {
                document.getElementById("night-action-text").textContent += "\n Because you are the only werewolf, you may click one center card to view it.";
            }
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

function minionSeeWerewolves() {

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
    document.getElementById("confirm-waiting-button").style.display = "none";
    if (lobby.state !== "night") return;
    const players = lobby.cards.filter(card => !card.isMiddleCard);
    const player = players.find(player => player.id === myId);
    if (!player) return;
    if (player.hasDoneNightAction) {
        document.getElementById("ok-button").style.display = "none";
        document.getElementById("do-nothing-button").style.display = "none";
        document.getElementById("night-action-text").textContent = "waiting until every player has done their night actions ...";
        return;
    }
    if (allRoles.find(role => role.name === player.startingRole).nightOrder > 100) {
        document.getElementById("night-action-text").textContent = "You do not have a night action.";
        document.getElementById("ok-button").style.display = "flex";
    }
    if (document.getElementById("ok-button").style.display === "flex") return;
    if (lobby.cards.find(card => getCardElement(card.id).style.transition)) return;

    if (document.getElementById("do-nothing-button").style.display !== "flex" && document.getElementById("confirm-button").style.display !== "flex") {
        document.getElementById("night-action-text").textContent = "waiting for some roles to perform their action before you ...";
    }

    if (players.find(p => p.startingRole === "Sentinel" && !p.hasDoneNightAction) && player.startingRole !== "Sentinel") {
        return;
    }
    if (players.find(p => p.startingRole === "Doppelganger") && players.find(p => p.startingRole === "Sentinel") &&
        player.startingRole !== "Sentinel" && player.startingRole !== "Doppelganger") {
        return;
    }

    const length = players.filter(p => p.hasClickedConfirm || p.sawWaitMessage || p.startingRole === "Werewolf" || p.startingRole === "Minion" ||
        p.startingRole === "Mason").length;

    if (players.find(p => p.startingRole === "Doppelganger") || lobby.cards.find(card => card.isMiddleCard && card.roleChain[0] === "Doppelganger") &&
        (length < players.length - 1 || lobby.nightTimer < (5 + Math.floor(Math.random() * 10)))) {
        if (player.roleChain[0] === "Minion" || player.roleChain[0] === "Mason") {
            return;
        }
    }

    if (players.find(p => p.startingRole === "Doppelganger") ||
        players.find(p => p.roleChain[0] === "Doppelganger" && !p.hasDoneNightAction && (p.startingRole === "Robber" || p.startingRole === "Troublemaker" || p.startingRole === "Drunk")) ||
        lobby.cards.find(card => card.isMiddleCard && card.roleChain[0] === "Doppelganger") && length < players.length - 1) {
        if (player.roleChain[0] === "Werewolf" || player.roleChain[0] === "Seer" || player.roleChain[0] === "Apprentice Seer" ||
            player.roleChain[0] === "Robber") {
            if (!player.sawWaitMessage) {
                document.getElementById("confirm-waiting-button").style.display = "flex";
            }
            return;
        }
    }

    if (player.startingRole === "Insomniac" || player.startingRole === "Revealer") {
        if (length < players.length - 1 || !player.mayDoLateAction || lobby.nightTimer < (10 + Math.floor(Math.random() * 7))) {
            if (!player.sawWaitMessage) {
                document.getElementById("confirm-waiting-button").style.display = "flex";
            }
            return;
        }
    }

    if (!player.sawWaitMessage) {
        socket.emit("saw-wait-message");
    }

    // show night actions (buttons, cards selections, etc.)

    if (player.startingRole === "Sentinel") {
        makeCardsClickable("players");
    }

    if (player.startingRole === "Werewolf") {
        wakeUpMultiple("Werewolf");
    }
    if (player.startingRole === "Minion") {
        minionSeeWerewolves();
    }
    if (player.startingRole === "Mason") {
        wakeUpMultiple("Mason");
    }

    if (player.startingRole === "Doppelganger" || player.startingRole === "Seer" || player.startingRole === "Robber" ||
        player.startingRole === "Troublemaker") {
        makeCardsClickable("players");
    }

    if (player.startingRole === "Seer" || player.startingRole === "Apprentice Seer" || player.startingRole === "Drunk") {
        makeCardsClickable("center");
    }
    if (player.startingRole === "Insomniac") {
        if (player.isSentinelled) {
            document.getElementById("night-action-text").textContent = "There is a shield token on your card. Therefore you cannot perform your night action";
            document.getElementById("ok-button").style.display = "flex";
            return;
        }
        document.getElementById("night-action-text").textContent = "You wake up to see your role. You see " + player.role;
        viewCard(player);
        document.getElementById("ok-button").style.display = "flex";
    }
    if (player.startingRole === "Revealer") {
        makeCardsClickable("players");
    }

    if (player.startingRole === "Drunk" && !player.isSentinelled || player.startingRole === "Doppelganger") {
        document.getElementById("do-nothing-button").style.display = "none";
    }

    function makeCardsClickable(type = "") {
        if (!player.hasClickedConfirm) {
            if (player.isSentinelled && (player.startingRole === "Robber" || player.startingRole === "Drunk")) {
                document.getElementById("night-action-text").textContent = "There is a shield token on your card. Therefore you cannot perform your night action";
                document.getElementById("ok-button").style.display = "flex";
                return;
            }

            const cards = lobby.cards.filter(card => !card.isMiddleCard && type === "players" && card.id !== myId || card.isMiddleCard && type === "center");
            for (const card of cards) {
                if (!card.isSentinelled) {
                    getCardElement(card.id).style.cursor = "pointer";
                }
            }
            if (document.getElementById("cards").querySelectorAll(".selected-card").length === 0) {
                document.getElementById("night-action-text").textContent = allRoles.find(role => role.name === player.startingRole).nightAction;
                document.getElementById("do-nothing-button").style.display = "flex";
            }
        }
    }
}

function confirmButtonAction() {
    const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));
    const players = lobby.cards.filter(card => !card.isMiddleCard);
    const player = players.find(player => player.id === myId);
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

    if (player.startingRole === "Sentinel") {
        socket.emit("set-is-sentinelled", selectedCards.at(-1).name);
        document.getElementById("night-action-text").textContent = "You placed a shield token on " + selectedCards.at(-1).name + "'s card";
        document.getElementById("ok-button").style.display = "flex";
    }

    if (player.startingRole === "Doppelganger" || player.startingRole === "Werewolf" || player.startingRole === "Seer" || player.startingRole === "Apprentice Seer") {
        viewCard(selectedCards[0], selectedCards[0].viewableStartingRole);
        if (selectedCards.length > 1) {
            viewCard(selectedCards[1], selectedCards[1].viewableStartingRole);
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
    if (player.startingRole === "Revealer") {
        viewCard(selectedCards.at(-1));
        document.getElementById("ok-button").style.display = "flex";
        if (selectedCards.at(-1).team === "Villager") {
            socket.emit("turn-over-card");
        }
    }

    socket.emit("has-clicked-confirm");
}

export {wakeUpMultiple, showRoleActions, confirmButtonAction};