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

export {sendMessage, sendConsoleMessage, receiveMessage, loadMessages};
