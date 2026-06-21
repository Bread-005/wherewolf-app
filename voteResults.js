import {myId} from "./index.js";
import {getCurrentLobby} from "./lobby.js";
import {viewCard, getCardElement} from "./functions.js";

/**
 * Reveals all role cards and displays the vote result board.
 */
function showVoteResults() {
    document.getElementById("vote-result-display").style.display = "grid";

    const lobby = getCurrentLobby();
    const players = lobby.cards.filter(card => !card.isMiddleCard);

    showVoteResultBoard(lobby, players);

    for (const player of players) {
        getCardElement(player.id).style.background = "#f0f0f0";
    }
}

/**
 * Populates the vote result grid and sets up the role-stage toggle button.
 * @param {object} lobby
 * @param {object[]} players
 */
function showVoteResultBoard(lobby, players) {
    if (document.getElementById("vote-result-display").querySelectorAll(".dynamic-result").length === 0) {
        document.getElementById("toggle-show-stage-button").addEventListener("click", () => {
            const currentLobby = getCurrentLobby();
            if (document.getElementById("role-show-stage").textContent === "Shows Ending Roles") {
                showStartingRoles(currentLobby);
            } else {
                showEndingRoles(currentLobby);
            }
        });
    }

    document.getElementById("vote-result-display").querySelectorAll(".dynamic-result").forEach(element => element.remove());

    for (const player of players) {
        const name = document.createElement("div");
        name.textContent = player.name;
        name.className = "dynamic-result";
        const numberOfVotes = document.createElement("div");
        numberOfVotes.textContent = players.filter(p => p.vote === player.name).length;
        numberOfVotes.className = "dynamic-result";
        const voters = document.createElement("div");
        voters.textContent = players.filter(p => p.vote === player.name).map(p => p.name).join(", ");
        voters.className = "dynamic-result";

        document.getElementById("vote-result-display").append(name, numberOfVotes, voters);
    }

    document.getElementById("display-text").textContent = lobby.voteResultText;
    document.getElementById("display-text-2").textContent = (lobby.winningTeam !== "No-one" ? "Team " : "") + lobby.winningTeam + " wins";
    document.getElementById("display-text-3").textContent = "You lose";
    for (const team of lobby.winningTeam.split(" and ")) {
        if (team === players.find(p => p.id === myId).team) {
            document.getElementById("display-text-3").textContent = "You win";
        }
    }

    showEndingRoles(lobby);
}

function showEndingRoles(lobby) {
    for (const card of lobby.cards) {
        viewCard(card);
        document.getElementById("role-show-stage").textContent = "Shows Ending Roles";
        if (card.dies) {
            document.getElementById("death-overlay" + card.id).style.display = "flex";
            getCardElement(card.id).style.filter = "grayscale(80%)";
        }
    }
}

function showStartingRoles(lobby) {
    for (const card of lobby.cards) {
        viewCard(card, card.roleChain[0]);
        document.getElementById("role-show-stage").textContent = "Shows Starting Roles";
        if (!card.isMiddleCard) {
            document.getElementById("death-overlay" + card.id).style.display = "none";
            getCardElement(card.id).style.filter = "";
        }
    }
}

export {showVoteResults, showVoteResultBoard};
