import {animateCardSwap, getCardElement, viewCard} from "./functions.js";
import {allRoles, lobbies, myId, socket} from "./index.js";

function wakeUpMultiple(roleName) {

    const lobby = lobbies.find(lobby => lobby.cards.find(player => player.id === myId));
    const players = lobby.cards.filter(card1 => !card1.isMiddleCard);

    const samePlayers = [];
    players.forEach(p => {
        if (p.startingRole === roleName || roleName === "Werewolf" && p.startingRole.toLowerCase().includes("wolf")) {
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
        if (lobby.selectedRoles.find(role => role.name === "Cow") && !hasSelectedCard) {
            document.getElementById("night-action-text").style.top = "25%";
            if (lobby.selectedRoles.find(role => role.name === "Alpha Wolf")) {
                document.getElementById("night-action-text").style.top = "15%";
            }
            if (players.find(p => p.startingRole === "Cow")) {
                for (const player of players) {
                    if (player.startingRole === "Cow") {
                        viewCard(player, "Cow");
                        document.getElementById("night-action-text").textContent += "\n" + player.name + " is a Cow";
                    }
                }
            } else {
                document.getElementById("night-action-text").textContent += "\nThere is no Cow";
            }
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
        if (p.startingRole.toLowerCase().includes("wolf")) {
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
    const players = lobby.cards.filter(card => !card.isMiddleCard);
    const centerCards = lobby.cards.filter(card => card.isMiddleCard);
    const player = players.find(player => player.id === myId);
    if (!player) return;
    if (player.hasDoneNightAction) {
        document.getElementById("ok-button").style.display = "none";
        document.getElementById("do-nothing-button").style.display = "none";
        document.getElementById("night-action-text").textContent = "waiting until every player has done their night actions ...";
        lobby.cards.forEach(card => getCardElement(card.id).querySelectorAll("img").forEach(img => img.remove()));
        return;
    }
    if (allRoles.find(role => role.name === player.startingRole).nightOrder > 100 && !document.getElementById("night-action-text").textContent.startsWith("You look at")) {
        document.getElementById("night-action-text").textContent = "You do not have a night action.";
        document.getElementById("ok-button").style.display = "flex";
    }
    if (document.getElementById("ok-button").style.display === "flex") return;
    if (lobby.cards.find(card => getCardElement(card.id).style.transition)) return;

    if (document.getElementById("do-nothing-button").style.display !== "flex" && document.getElementById("confirm-button").style.display !== "flex") {
        document.getElementById("night-action-text").textContent = "waiting for some roles to perform their action before you ...";
    }
    if (document.getElementById("confirm-waiting-button").style.display === "flex") return;

    if (players.find(p => p.startingRole === "Copycat") && centerCards.find(card => card.startingRole === "Sentinel") && player.startingRole !== "Copycat") {
        return;
    }
    if (players.find(p => p.startingRole === "Sentinel" && !p.hasDoneNightAction) && player.startingRole !== "Copycat" && player.startingRole !== "Sentinel") {
        return;
    }
    if (players.find(p => p.startingRole === "Doppelganger") && players.find(p => p.startingRole === "Sentinel") &&
        player.startingRole !== "Sentinel" && player.startingRole !== "Doppelganger") {
        return;
    }

    if (player.startingRole === "Doppelganger" &&
        (players.find(p => p.startingRole === "Copycat") || centerCards.find(card => card.startingRole === "Copycat") && lobby.nightTimer < (3 + Math.floor(Math.random() * 5)))) {
        return;
    }

    const length = players.filter(p => p.hasClickedConfirm || p.sawWaitMessage || p.startingRole === "Cow" || p.startingRole === "Minion" || p.startingRole === "Mason").length;

    if (players.find(p => p.startingRole === "Copycat" || p.roleChain[0] === "Copycat" && p.selectedCards[0].role === "Doppelganger" && !p.hasCopiedRole || p.startingRole === "Doppelganger") ||
        (lobby.cards.find(card => card.isMiddleCard && card.roleChain[0] === "Copycat") || lobby.cards.find(card => card.isMiddleCard && card.roleChain[0] === "Doppelganger")) &&
        (length < players.length - 1 || lobby.nightTimer < (5 + Math.floor(Math.random() * 10)))) {
        if (player.startingRole === "Cow" || player.startingRole === "Minion" || player.startingRole === "Mason") {
            return;
        }
    }

    function isUnusedSwapper(p) {
        return !p.hasDoneNightAction && (p.startingRole === "Alpha Wolf" || p.startingRole === "Robber" || p.startingRole === "Witch" ||
            p.startingRole === "Troublemaker" || p.startingRole === "Drunk");
    }

    function mustWait(p, role) {
        return p.roleChain[0] === role || p.roleChain[0] === "Copycat" && p.selectedCards[0]?.role !== "Doppelganger" && p.startingRole === role;
    }

    if (players.find(p => p.startingRole === "Copycat" && centerCards.find(card => card.startingRole === "Sentinel" || card.startingRole === "Doppelganger" || card.startingRole === "Alpha Wolf") ||
            p.roleChain[0] === "Copycat" && p.selectedCards[0]?.role === "Doppelganger" && isUnusedSwapper(p) ||
            p.startingRole === "Doppelganger" || p.roleChain[0] === "Doppelganger" && isUnusedSwapper(p) && player.roleChain[0] !== "Doppelganger" ||
            p.startingRole === "Alpha Wolf" && !p.hasDoneNightAction && (!player.startingRole.toLowerCase().includes("wolf") || player.startingRole === "Mystic Wolf")) ||
        lobby.cards.find(card => card.isMiddleCard && (card.roleChain[0] === "Doppelganger" ||
            card.startingRole === "Alpha Wolf" && (!player.startingRole.toLowerCase().includes("wolf") || player.startingRole === "Mystic Wolf"))) &&
        (length < players.length - 1 || lobby.nightTimer < (7 + Math.floor(Math.random() * 5)))) {
        if (player.startingRole.toLowerCase().includes("wolf") || mustWait(player, "Mystic Wolf") || mustWait(player, "Seer") ||
            mustWait(player, "Apprentice Seer") || mustWait(player, "Robber") || mustWait(player, "Witch")) {
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

    if ((player.roleChain[0] === "Doppelganger" || player.roleChain[0] === "Copycat" && player.selectedCards[0]?.role === "Doppelganger") &&
        (player.startingRole === "Alpha Wolf" || player.startingRole === "Mystic Wolf") && !player.hasDoneExtraWolfAction) {
        makeCardsClickable("players");
        if (player.startingRole === "Alpha Wolf") {
            document.getElementById("do-nothing-button").style.display = "none";
        }
        return;
    }

    if (player.startingRole.toLowerCase().includes("wolf") && !player.hasMetWerewolves) {
        wakeUpMultiple("Werewolf");
        return;
    }

    if (player.startingRole === "Cow") {
        const tempPlayers = [].concat(players);
        document.getElementById("night-action-text").textContent = "You were not tapped! Both your neighbors are not Werewolves";
        if (tempPlayers[0].name === player.name) {
            tempPlayers.unshift(tempPlayers.at(-1));
        }
        if (tempPlayers.at(-1).name === player.name) {
            tempPlayers.push(tempPlayers[0]);
        }
        tempPlayers.forEach((p, index) => {
            if (p.startingRole === "Cow") {
                if (tempPlayers[index - 1].startingRole.toLowerCase().includes("wolf") || tempPlayers[index + 1].startingRole.toLowerCase().includes("wolf")) {
                    document.getElementById("night-action-text").textContent = "You were tapped! At least one of your neighbors is a Werewolf";
                }
            }
        });
        document.getElementById("ok-button").style.display = "flex";
    }

    if (player.startingRole === "Minion") {
        minionSeeWerewolves();
    }
    if (player.startingRole === "Mason") {
        wakeUpMultiple("Mason");
    }

    if (player.startingRole === "Doppelganger" || player.startingRole === "Alpha Wolf" || player.startingRole === "Mystic Wolf" ||
        player.startingRole === "Seer" || player.startingRole === "Robber" || player.startingRole === "Witch" && player.didFirstPart ||
        player.startingRole === "Troublemaker") {
        makeCardsClickable("players");
    }

    if (player.startingRole === "Copycat" || player.startingRole === "Seer" || player.startingRole === "Apprentice Seer" ||
        player.startingRole === "Witch" && !player.didFirstPart || player.startingRole === "Drunk") {
        makeCardsClickable("center");
    }
    if (player.startingRole === "Insomniac") {
        if (player.isSentinelled) {
            document.getElementById("night-action-text").textContent = "There is a shield token on your card. Therefore you cannot perform your night action.";
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

    if (player.startingRole === "Copycat" || player.startingRole === "Doppelganger" || player.startingRole === "Alpha Wolf" && player.hasMetWerewolves ||
        player.startingRole === "Witch" && player.didFirstPart || player.startingRole === "Drunk" && !player.isSentinelled) {
        document.getElementById("do-nothing-button").style.display = "none";
    }

    function makeCardsClickable(type = "") {
        if (!player.hasClickedConfirm) {
            if (player.isSentinelled && (player.startingRole === "Robber" || player.startingRole === "Drunk")) {
                document.getElementById("night-action-text").textContent = "There is a shield token on your card. Therefore you cannot perform your night action.";
                document.getElementById("ok-button").style.display = "flex";
                return;
            }

            const cards = lobby.cards.filter(card => !card.isMiddleCard && type === "players" && card.id !== myId || card.isMiddleCard && type === "center");
            for (const card of cards) {
                if (!card.isSentinelled) {
                    getCardElement(card.id).style.cursor = "pointer";
                }
            }
            if (player.startingRole === "Witch" && player.didFirstPart) {
                getCardElement(myId).style.cursor = "pointer";
            }
            if (document.getElementById("cards").querySelectorAll(".selected-card").length === 0) {
                document.getElementById("night-action-text").textContent = allRoles.find(role => role.name === player.startingRole).nightAction;
                if (player.startingRole === "Witch" && player.didFirstPart) {
                    document.getElementById("night-action-text").textContent = "You now must swap " + player.selectedCards.at(-1).name + " with any player.";
                }
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

    if (player.startingRole === "Sentinel") {
        socket.emit("set-is-sentinelled", selectedCards[0].name);
        document.getElementById("night-action-text").textContent = "You placed a shield token on " + selectedCards[0].name + "'s card";
        document.getElementById("ok-button").style.display = "flex";
    }

    if (player.startingRole === "Copycat" || player.startingRole === "Doppelganger" || player.startingRole.toLowerCase().includes("wolf") && selectedCards[0].isMiddleCard ||
        player.startingRole === "Mystic Wolf" || player.startingRole === "Seer" || player.startingRole === "Apprentice Seer" ||
        player.startingRole === "Witch" && !player.didFirstPart) {
        viewCard(selectedCards[0], selectedCards[0].viewableStartingRole);
        if (selectedCards.length > 1) {
            viewCard(selectedCards[1], selectedCards[1].viewableStartingRole);
        }
        document.getElementById("ok-button").style.display = "flex";
        if (player.startingRole === "Copycat" || player.startingRole === "Doppelganger") {
            document.getElementById("night-action-text").textContent = "You look at " + selectedCards[0].name + "'s card and see " + selectedCards[0].role;
        }
    }
    const isInstantSwap = player.roleChain[0] === "Doppelganger" || player.roleChain[0] === "Copycat" && player.selectedCards[0]?.role === "Doppelganger" || player.startingRole === "Alpha Wolf";

    if (player.startingRole === "Alpha Wolf" && !selectedCards[0].isMiddleCard) {
        const wolfCard = lobby.cards.find(card => card.name === "middle-card4");
        socket.emit("perform-swap", {priority: 2.1, swap: [{name: wolfCard.name, role: wolfCard.role, team: wolfCard.team}, selectedCards[0]]});
        animateCardSwap(wolfCard, selectedCards[0], "You swapped the center werewolf card with " + selectedCards[0].name);
    }

    if (player.startingRole === "Robber") {
        socket.emit(isInstantSwap ? "perform-swap" : "add-swap", {priority: 6, swap: [player, selectedCards[0]]});
        animateCardSwap(player, selectedCards[0]);
    }
    if (player.startingRole === "Witch" && player.didFirstPart) {
        const centerSelected = lobby.cards.find(card => card.name === player.selectedCards.at(-1).name);
        socket.emit(isInstantSwap ? "perform-swap" : "add-swap", {priority: 6.1, swap: [centerSelected, selectedCards[0]]});
        animateCardSwap(centerSelected, selectedCards[0], "You swapped " + centerSelected.name + " and " + selectedCards[0].name);
    }
    if (player.startingRole === "Troublemaker") {
        socket.emit(isInstantSwap ? "perform-swap" : "add-swap", {priority: 7, swap: selectedCards});
        animateCardSwap(selectedCards[0], selectedCards[1], "You swapped " + selectedCards[0].name + " and " + selectedCards[1].name);
    }
    if (player.startingRole === "Drunk") {
        socket.emit(isInstantSwap ? "perform-swap" : "add-swap", {priority: 8, swap: [player, selectedCards[0]]});
        animateCardSwap(player, selectedCards[0], "You swapped your card with " + selectedCards[0].name);
    }
    if (player.startingRole === "Revealer") {
        viewCard(selectedCards[0]);
        document.getElementById("ok-button").style.display = "flex";
        if (selectedCards[0].team === "Villager") {
            socket.emit("turn-over-card", selectedCards[0].name);
        }
    }

    socket.emit("add-selected-cards", selectedCards.map(card => {
        return {
            name: card.name,
            role: card.role,
            team: card.team
        }
    }));
    socket.emit("has-clicked-confirm");
}

export {wakeUpMultiple, showRoleActions, confirmButtonAction};