import {isHost} from "./functions.js";
import {allRoles, socket} from "./index.js";

function validateRoleSelection(lobby) {
    const warningContainer = document.getElementById("roles-warning-container");
    const tooltip = document.getElementById("roles-warning-tooltip");
    const errors = [];

    const counts = {};
    lobby.selectedRoles.forEach(role => { counts[role.name] = (counts[role.name] || 0) + 1; });

    if (!counts["Werewolf"] && !counts["Alpha Wolf"] && !counts["Mystic Wolf"] && !counts["Dream Wolf"] && !counts["Minion"]) {
        errors.push("• No evil roles selected!");
    }
    if (counts["Mason"] === 1) {
        errors.push("• A single Mason is useless. Usually, you play with two.");
    }
    if (counts["Insomniac"]) {
        if (!counts["Alpha Wolf"] && !counts["Robber"] && !counts["Witch"] && !counts["Troublemaker"]) {
            errors.push("• Insomniac is useless. There are no roles that swap players' cards.");
        }
    }
    if (counts["Bodyguard"] && lobby.cards.filter(card => !card.isMiddleCard).length < 5) {
        errors.push("• It is not advised to have a Bodyguard with less than 5 players.");
    }
    if (counts["Beholder"] && !counts["Seer"] && !counts["Apprentice Seer"]) {
        errors.push("• The Beholder does not do anything without any Seer.");
    }

    if (errors.length > 0 && lobby.selectedRoles.length === lobby.cards.filter(card => card.name !== "middle-card4").length && lobby.cards.filter(card => !card.isMiddleCard).length >= 3) {
        warningContainer.style.display = "flex";
        tooltip.innerHTML = errors.join("<br>");
    } else {
        warningContainer.style.display = "none";
    }
}

function setupRoleSelection() {
    const rolesList = document.getElementById("roles-list");
    rolesList.innerHTML = "";
    rolesList.style.display = "grid";

    document.getElementById("close-button").addEventListener("click", () => {
        socket.emit("update-state", "waiting");
    });

    for (const input of document.getElementById("edition-filters").querySelectorAll("input")) {
        input.addEventListener("click", () => {
            if (isHost()) {
                socket.emit("request-update-selected-editions", input.value);
            } else {
                input.checked = !input.checked;
            }
        });
    }

    document.getElementById("discuss-time-save-button").addEventListener("click", () => {
        let discussTime = Number(document.getElementById("discuss-time-input").value) || 0;
        if (discussTime > 900) discussTime = 600;
        socket.emit("change-discuss-time", discussTime);
    });

    document.getElementById("discuss-time-input").addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            let discussTime = Number(document.getElementById("discuss-time-input").value) || 0;
            if (discussTime > 900) discussTime = 600;
            socket.emit("change-discuss-time", discussTime);
        }
    });

    for (const role of allRoles) {
        const roleCard = document.createElement("div");
        roleCard.className = "card";
        roleCard.style.border = "5px solid brown";
        roleCard.id = role.id + "-" + role.name + "-select-role";

        const img = document.createElement("img");
        img.src = "./images/" + role.name.toLowerCase().replace(" ", "_") + ".png";
        img.alt = role.name;

        const ability = document.createElement("div");
        ability.className = "card-ability";
        ability.textContent = role.text;

        roleCard.append(img, ability);
        roleCard.style.display = role.edition === "base game" ? "flex" : "none";

        rolesList.append(roleCard);

        roleCard.addEventListener("click", () => {
            if (isHost()) {
                socket.emit("request-update-selected-roles", role);
            }
        });
    }
}

function updateSelectedRoles(lobby) {
    document.getElementById("discuss-time-label").textContent = "Discussion Time: " + (lobby.discussTime || 300) + " secs";
    document.getElementById("discuss-time-input").value = lobby.discussTime || 300;

    const players = lobby.cards.filter(card => !card.isMiddleCard);

    for (const input of document.getElementById("edition-filters").querySelectorAll("input")) {
        input.checked = lobby.selectedEditions.includes(input.value);
    }

    for (const role of allRoles) {
        const roleCard = document.getElementById(role.id + "-" + role.name + "-select-role");
        roleCard.style.display = lobby.selectedEditions.includes(role.edition) || lobby.selectedRoles.find(role1 => role1.id === role.id && role1.randomlyAdded) ? "flex" : "none";
        if (roleCard) {
            if (lobby.selectedRoles.find(role => role.id.toString() === roleCard.id.split("-")[0])) {
                roleCard.style.border = "5px solid lightblue";
            } else {
                roleCard.style.border = "5px solid brown";
            }
        }
    }

    if (isHost()) {
        document.getElementById("select-roles-other-components").style.display = "flex";
        for (const roleCard of document.getElementById("roles-list").children) {
            roleCard.style.cursor = "pointer";
        }
    }

    document.getElementById("start-game-button").style.display = "none";
    if (lobby.selectedRoles.length === lobby.cards.filter(card => card.name !== "middle-card4").length && players.length >= 3) {
        document.getElementById("start-game-button").style.display = "flex";
    }
    validateRoleSelection(lobby);
    document.getElementById("role-count-display").textContent = lobby.selectedRoles.length + "/" + lobby.cards.filter(card => card.name !== "middle-card4").length + " Roles selected";
}

export {setupRoleSelection, updateSelectedRoles};