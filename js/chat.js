import {socket} from "./index.js";

/**
 * Sends the current chat input value to the server and clears the input.
 */
function sendMessage() {
    const chatInput = document.getElementById("chat-input");
    const message = chatInput.value.trim();
    if (message) {
        socket.emit("send-chat-message", message);
        chatInput.value = "";
    }
}

/**
 * Emits a console-style message visible to all players in the lobby.
 * @param {string} message
 */
function sendConsoleMessage(message) {
    socket.emit("send-console-message", message);
}

/**
 * Appends a single received message to the chat box.
 * @param {{sender: string, message: string}} data
 */
function receiveMessage(data) {
    const messagesBox = document.getElementById("chat-messages");
    const div = document.createElement("div");
    div.className = "chat-msg";
    div.innerHTML = `<b>${data.sender}:</b> ${data.message}`;
    messagesBox.appendChild(div);
    messagesBox.scrollTop = messagesBox.scrollHeight;
}

/**
 * Reloads all lobby messages into the chat box when the server state updates.
 * @param {object} lobby
 */
function loadMessages(lobby) {
    if (document.getElementById("chat-messages").children.length <= lobby.messages.length) {
        document.getElementById("chat-messages").innerHTML = "";
        for (const message of lobby.messages) {
            receiveMessage(message);
        }
    }
}

/**
 * Returns the position of #game's padding edge in viewport coordinates.
 * Absolutely positioned children are offset from the padding edge, not the border edge
 * that getBoundingClientRect() reports, so the border width must be added back in.
 * @returns {{left: number, top: number}}
 */
function getGamePaddingOrigin() {
    const gameContainer = document.getElementById("game");
    const gameRect = gameContainer.getBoundingClientRect();
    const gameStyle = getComputedStyle(gameContainer);

    return {
        left: gameRect.left + parseFloat(gameStyle.borderLeftWidth),
        top: gameRect.top + parseFloat(gameStyle.borderTopWidth),
    };
}

/**
 * Starts a resize drag on the chat box, anchoring its bottom-right corner in place
 * and growing/shrinking towards the top-left, matching the resize handle's position.
 * @param {number} startX
 * @param {number} startY
 */
function startChatResize(startX, startY) {
    const chatContainer = document.getElementById("chat-container");
    const chatRect = chatContainer.getBoundingClientRect();
    const gameOrigin = getGamePaddingOrigin();

    const startWidth = chatRect.width;
    const startHeight = chatRect.height;
    const fixedRight = chatRect.right;
    const fixedBottom = chatRect.bottom;

    // #chat-container has "margin: 10px auto" for its default centered/anchored CSS
    // position. As soon as top/left are set explicitly (right/bottom "auto"), the browser
    // still adds margin-top on top of the computed "top" value, shifting the box further
    // down than intended. Clearing the margin once we take over positioning avoids that.
    chatContainer.style.margin = "0";

    function doDrag(currentX, currentY) {
        const deltaX = startX - currentX;
        const deltaY = startY - currentY;

        const requestedWidth = startWidth + deltaX;
        const requestedHeight = startHeight + deltaY;

        const clampedWidth = Math.min(requestedWidth, fixedRight);
        const clampedHeight = Math.min(requestedHeight, fixedBottom);

        chatContainer.style.width = clampedWidth + "px";
        chatContainer.style.height = clampedHeight + "px";

        const actualWidth = chatContainer.offsetWidth;
        const actualHeight = chatContainer.offsetHeight;

        chatContainer.style.left = Math.floor(fixedRight - actualWidth - gameOrigin.left) + "px";
        chatContainer.style.top = Math.floor(fixedBottom - actualHeight - gameOrigin.top) + "px";
        chatContainer.style.right = "auto";
        chatContainer.style.bottom = "auto";
        chatContainer.style.transform = "none";
    }

    function doDragMouse(e) {
        doDrag(e.clientX, e.clientY);
    }

    function doDragTouch(e) {
        e.preventDefault();
        doDrag(e.touches[0].clientX, e.touches[0].clientY);
    }

    function stopDrag() {
        document.documentElement.removeEventListener("mousemove", doDragMouse);
        document.documentElement.removeEventListener("mouseup", stopDrag);
        document.documentElement.removeEventListener("touchmove", doDragTouch);
        document.documentElement.removeEventListener("touchend", stopDrag);
    }

    document.documentElement.addEventListener("mousemove", doDragMouse);
    document.documentElement.addEventListener("mouseup", stopDrag);
    document.documentElement.addEventListener("touchmove", doDragTouch, {passive: false});
    document.documentElement.addEventListener("touchend", stopDrag);
}

const CHAT_DRAG_EDGE_HEIGHT = 20;

/**
 * Checks whether a touch/click point lies within the chat box's draggable top edge.
 * @param {number} clientY
 * @param {EventTarget} target
 * @returns {boolean}
 */
function isChatTopEdge(clientY, target) {
    const chatContainer = document.getElementById("chat-container");
    const rect = chatContainer.getBoundingClientRect();
    return target.id !== "resize-handle" && (clientY - rect.top) <= CHAT_DRAG_EDGE_HEIGHT;
}

/**
 * Starts a move drag on the chat box, keeping it fully within the visible viewport.
 * @param {number} startClientX
 * @param {number} startClientY
 */
function startChatMove(startClientX, startClientY) {
    const chatContainer = document.getElementById("chat-container");
    const chatRect = chatContainer.getBoundingClientRect();
    const gameOrigin = getGamePaddingOrigin();

    const startLeft = chatRect.left - gameOrigin.left;
    const startTop = chatRect.top - gameOrigin.top;
    const startViewportLeft = chatRect.left;
    const startViewportTop = chatRect.top;
    const maxViewportLeft = document.documentElement.clientWidth - chatRect.width;
    const maxViewportTop = document.documentElement.clientHeight - chatRect.height;

    chatContainer.style.margin = "0";
    chatContainer.style.left = startLeft + "px";
    chatContainer.style.top = startTop + "px";
    chatContainer.style.right = "auto";
    chatContainer.style.bottom = "auto";
    chatContainer.style.transform = "none";

    function doMove(currentX, currentY) {
        const deltaX = currentX - startClientX;
        const deltaY = currentY - startClientY;

        const clampedViewportLeft = Math.min(Math.max(startViewportLeft + deltaX, 0), Math.max(maxViewportLeft, 0));
        const clampedViewportTop = Math.min(Math.max(startViewportTop + deltaY, 0), Math.max(maxViewportTop, 0));

        chatContainer.style.left = Math.floor(clampedViewportLeft - gameOrigin.left) + "px";
        chatContainer.style.top = Math.floor(clampedViewportTop - gameOrigin.top) + "px";
    }

    function doMoveTouch(e) {
        e.preventDefault();
        doMove(e.touches[0].clientX, e.touches[0].clientY);
    }

    function stopMove() {
        document.documentElement.removeEventListener("touchmove", doMoveTouch);
        document.documentElement.removeEventListener("touchend", stopMove);
    }

    document.documentElement.addEventListener("touchmove", doMoveTouch, {passive: false});
    document.documentElement.addEventListener("touchend", stopMove);
}

/**
 * @returns {boolean} whether the current viewport matches the mobile breakpoint
 */
function isMobileViewport() {
    return window.matchMedia("(max-width: 600px)").matches;
}

/**
 * Wires up resizing, moving (mobile only, via the top edge), and focus-on-click
 * behavior for the chat box.
 */
function setupChatBoxInteractions() {
    document.getElementById("resize-handle").addEventListener("mousedown", (e) => {
        e.preventDefault();
        startChatResize(e.clientX, e.clientY);
    });

    document.getElementById("resize-handle").addEventListener("touchstart", (e) => {
        e.preventDefault();
        startChatResize(e.touches[0].clientX, e.touches[0].clientY);
    }, {passive: false});

    document.getElementById("chat-container").addEventListener("touchstart", (e) => {
        if (!isMobileViewport()) {
            return;
        }

        const touch = e.touches[0];
        if (!isChatTopEdge(touch.clientY, e.target)) {
            return;
        }
        e.preventDefault();
        startChatMove(touch.clientX, touch.clientY);
    }, {passive: false});

    document.getElementById("chat-container").addEventListener("click", () => {
        document.getElementById("chat-input").focus();
    });
}

export {sendMessage, sendConsoleMessage, receiveMessage, loadMessages, setupChatBoxInteractions};
