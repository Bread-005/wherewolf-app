import {allRoles} from "./index.js";

let hasShownTokenHint = false;

/**
 * Renders draggable role tokens into the tokens container for the day phase.
 * @param {object} lobby
 */
function setupTokens(lobby) {
    const container = document.getElementById("tokens-container");
    container.innerHTML = "";

    const roles = [];

    for (const role of lobby.selectedRoles) {
        roles.push({
            name: role.name,
            nightOrder: allRoles.find(role1 => role1.name === role.name)?.nightOrder
        });
    }

    roles.sort((a, b) => a.nightOrder - b.nightOrder);

    if (lobby.selectedRoles.find(role => role.name === "Alpha Wolf")) {
        roles.push({
            name: "Werewolf",
            nightOrder: 2
        });
    }

    roles.forEach((role) => {
        const token = document.createElement("div");
        token.className = "role-token";
        token.style.backgroundImage = `url('./images/${role.name.toLowerCase().replace(" ", "_")}.png')`;

        const role1 = allRoles.find(role1 => role1.name === role.name);

        if (role1.team === "Werewolf") {
            token.style.border = "2px solid red";
        }
        if (role1.team === "Tanner") {
            token.style.border = "2px solid #f1c40f";
        }
        if (role1.team === "Mortician") {
            token.style.border = "2px solid #24150a";
        }
        if (role1.team === "Blob") {
            token.style.border = "2px solid #54533a";
        }

        setupDragAndDrop(token);
        setupTokenHint(token);

        container.appendChild(token);
    });

    requestAnimationFrame(() => {
        if (container.children.length > 0) {
            const rect = container.getBoundingClientRect();
            container.style.width = rect.width + "px";
            container.style.height = rect.height + "px";
        }
    });
}

function setupDragAndDrop(token) {
    let isDragging = false;
    let offsetX, offsetY;

    function startDrag(clientX, clientY) {
        isDragging = true;

        const rect = token.getBoundingClientRect();

        offsetX = clientX - rect.left;
        offsetY = clientY - rect.top;

        if (!token.classList.contains("dragging")) {
            token.style.left = rect.left + "px";
            token.style.top = rect.top + "px";

            document.body.append(token);
            token.classList.add("dragging");
        }
    }

    function moveDrag(clientX, clientY) {
        if (!isDragging) { return; }

        let x = clientX - offsetX;
        let y = clientY - offsetY;

        const minX = 0;
        const minY = 0;
        const maxX = window.innerWidth - token.offsetWidth;
        const maxY = window.innerHeight - token.offsetHeight;

        x = Math.max(minX, Math.min(x, maxX));
        y = Math.max(minY, Math.min(y, maxY));

        token.style.left = x + "px";
        token.style.top = y + "px";
    }

    function stopDrag() {
        isDragging = false;
        token.style.zIndex = "1400";
    }

    token.addEventListener("mousedown", (event) => {
        startDrag(event.clientX, event.clientY);
    });

    document.addEventListener("mousemove", (event) => {
        moveDrag(event.clientX, event.clientY);
    });

    document.addEventListener("mouseup", stopDrag);

    token.addEventListener("touchstart", (event) => {
        event.preventDefault();
        startDrag(event.touches[0].clientX, event.touches[0].clientY);
    }, {passive: false});

    document.addEventListener("touchmove", (event) => {
        if (!isDragging) { return; }
        event.preventDefault();
        moveDrag(event.touches[0].clientX, event.touches[0].clientY);
    }, {passive: false});

    document.addEventListener("touchend", stopDrag);
}

function setupTokenHint(token) {
    const hint = document.createElement("div");
    hint.className = "token-hint-popup";
    hint.textContent = "If you move a token only you see that";

    token.addEventListener("mouseenter", () => {
        if (!hasShownTokenHint) {
            hint.style.top = "-15px";
            token.append(hint);
            hasShownTokenHint = true;
        }
    });

    token.addEventListener("mouseleave", () => {
        hint.remove();
    });
}

export {setupTokens};
