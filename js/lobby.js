import {lobbies, myId} from "./index.js";

/**
 * Returns the lobby the current player is in, or undefined if not in any lobby.
 */
function getCurrentLobby() {
    return lobbies.find(lobby => lobby.cards.find(card => card.id === myId));
}

/**
 * Returns all player cards (non-middle-cards) of a lobby.
 * @param {object} lobby
 */
function getCurrentPlayers(lobby) {
    return lobby.cards.filter(card => !card.isMiddleCard);
}

/**
 * Returns the current player's card object within a lobby.
 * @param {object} lobby
 */
function getMyPlayer(lobby) {
    return lobby.cards.find(card => card.id === myId);
}

export {getCurrentLobby, getCurrentPlayers, getMyPlayer};
