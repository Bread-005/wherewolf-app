const STORAGE_KEY = "wherewolf-app";

export {getSavedName, saveName};

/**
 * Reads the whole wherewolf-app object from localStorage.
 * Returns an empty object if nothing is stored or the data is broken.
 */
function readAppData() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
    } catch {
        return {};
    }
}

/**
 * Returns the player name saved by the last create-lobby or join-game.
 * @returns {string} The saved name or an empty string.
 */
function getSavedName() {
    return readAppData()["saved-name"] ?? "";
}

/**
 * Saves the player name in the wherewolf-app object in localStorage.
 * @param {string} name The validated player name.
 */
function saveName(name) {
    const appData = readAppData();
    appData["saved-name"] = name;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}
