import {allRoles} from "./index.js";

function buildGameSummary(lobby) {
    document.getElementById("game-summary-button").style.display = "flex";

    const summaryList = document.getElementById("summary-list");
    summaryList.innerHTML = "";

    const createSummaryCard = (name, roleName, isViewed = true, isMiddleCard = false) => {
        const cardDiv = document.createElement("div");
        cardDiv.className = "summary-card";

        if (isViewed) {
            const img = document.createElement("img");
            const fileName = roleName.toLowerCase().replace(/ /g, "_");
            img.src = `./images/${fileName}.png`;
            img.className = "summary-card-img";
            cardDiv.append(img);
        }
        if (!isMiddleCard) {
            const nameLabel = document.createElement("span");
            nameLabel.className = "summary-card-name";
            nameLabel.textContent = name;
            cardDiv.append(nameLabel);
        }
        return cardDiv;
    };

    const roles = [{nightOrder: 2, name: "Werewolf"}];
    for (const role of lobby.selectedRoles) {
        if (!roles.find(r => r.name === role.name)) {
            roles.push({
                nightOrder: allRoles.find(r => r.name === role.name)?.nightOrder,
                name: role.name,
            });
        }
    }
    roles.sort((a, b) => a.nightOrder - b.nightOrder);

    const cards = lobby.cards.map(card => {
        return {
            name: card.name,
            role: card.roleChain[0],
            selectedCards: card.selectedCards,
            beginningRole: card.roleChain[0],
            doppelgangerCopy: card.roleChain[0] === "Doppelganger" ? card.selectedCards[0]?.role : "",
            startRole: card.roleChain[0]
        }
    });

    for (const role of roles) {
        const player = cards.find(card => !card.name.includes("middle-card") && card.beginningRole === role.name ||
            role.name === "Werewolf" && lobby.cards.find(card1 => card1.name === card.name && card1.startingRole.toLowerCase().includes("wolf")));
        if (!player) continue;
        if (role.nightOrder > 100) continue;

        const itemDiv = document.createElement("div");
        itemDiv.className = "summary-item";

        // build actionText
        const actionText = document.createElement("span");
        actionText.className = "summary-action-text";
        actionText.textContent = "selected";
        if (player.beginningRole === "Copycat" || player.beginningRole === "Doppelganger") {
            actionText.textContent = "copied";
        }
        if (player.beginningRole === "Sentinel") {
            actionText.textContent = "placed a shield token onto";
        }
        if (player.beginningRole === "Seer" || player.beginningRole === "Apprentice Seer" || player.beginningRole === "Revealer") {
            actionText.textContent = "looked at";
        }
        if (player.beginningRole === "Robber" || player.beginningRole === "Drunk") {
            actionText.textContent = "swapped with";
        }
        if (player.beginningRole === "Alpha Wolf" || player.beginningRole === "Witch" || player.beginningRole === "Troublemaker") {
            actionText.textContent = "swapped";
        }
        if (player.selectedCards.length === 0) {
            actionText.textContent = "did nothing";
        }
        if (player.beginningRole === "Insomniac") {
            actionText.textContent = "woke up as";
        }

        itemDiv.append(createSummaryCard(player.name, player.startRole));
        if (player.startRole !== player.beginningRole) {
            itemDiv.append(createSummaryCard("", player.beginningRole));
        }
        itemDiv.append(actionText);

        // build selectedCards
        const targetsContainer = document.createElement("div");
        targetsContainer.className = "summary-targets";

        // Doppelganger exception
        if (role.name === "Doppelganger") {
            targetsContainer.append(createSummaryCard(player.selectedCards[0].name, player.selectedCards[0].role));
            if (player.selectedCards.length > 1) {
                const andText = document.createElement("span");
                andText.className = "summary-and-text";
                andText.textContent = "and then selected";
                targetsContainer.append(andText);
            }
            player.selectedCards.shift();
        }

        // Alpha Wolf exception
        if (role.name === "Alpha Wolf" && player.beginningRole === "Alpha Wolf") {
            if (player.selectedCards[0].name.includes("middle-card")) {
                player.selectedCards.shift();
            }
            buildCenterCards(player.selectedCards, targetsContainer, true);
            const withText = document.createElement("span");
            withText.className = "summary-and-text";
            withText.textContent = "with";
            targetsContainer.append(withText);
        }

        if (role.name === "Werewolf" || role.name === "Mason") {
            const others = lobby.cards.filter(card => !card.isMiddleCard &&
                (card.startingRole === role.name || role.name === "Werewolf" && card.startingRole.toLowerCase().includes("wolf")) && card.name !== player.name);
            if (others.length === 0) {
                actionText.textContent = "woke alone";
                if (role.name === "Werewolf") {
                    if (player.selectedCards[0]?.name.includes("middle-card")) {
                        actionText.textContent = "woke alone and viewed";
                    } else {
                        actionText.textContent = "woke alone and did nothing";
                    }
                }
            }
            if (others.length > 0) {
                actionText.textContent = "woke together";

                others.forEach((other) => {
                    const andText = document.createElement("span");
                    andText.className = "summary-and-text";
                    andText.textContent = "and";
                    targetsContainer.append(andText);
                    targetsContainer.append(createSummaryCard(other.name, other.roleChain[0]));
                });
                itemDiv.append(actionText);
            }
        }

        if (role.name === "Minion") {
            const werewolves = lobby.cards.filter(card => !card.isMiddleCard && card.startingRole.toLowerCase().includes("wolf"));
            actionText.textContent = "saw";
            if (werewolves.length === 0) {
                actionText.textContent += " no werewolves";
            }

            werewolves.forEach((werewolf, index) => {
                targetsContainer.append(createSummaryCard(werewolf.name, werewolf.roleChain[0]));

                if (index < werewolves.length - 1) {
                    const andText = document.createElement("span");
                    andText.className = "summary-and-text";
                    andText.textContent = "and";
                    targetsContainer.append(andText);
                }
            });
        }

        if (player.selectedCards.length > 0) {
            if (role.name !== "Copycat") {
                if (role.name === "Seer" && player.selectedCards.at(-1).name.includes("middle-card") && player.selectedCards.at(-2).name.includes("middle-card")) {
                    buildCenterCards([player.selectedCards.at(-2), player.selectedCards.at(-1)], targetsContainer);
                } else {
                    player.selectedCards.forEach((selected, index) => {
                        if (selected.name.includes("middle-card")) {
                            buildCenterCards([selected], targetsContainer);
                        }
                        if (role.name !== "Werewolf") {
                            if (!selected.name.includes("middle-card")) {
                                targetsContainer.append(createSummaryCard(selected.name, cards.find(card => card.name === selected.name).role));
                            }

                            if (index < player.selectedCards.length - 1 && player.selectedCards.length > 1) {
                                const andText = document.createElement("span");
                                andText.className = "summary-and-text";
                                andText.textContent = "and";
                                targetsContainer.append(andText);
                            }
                        }
                    });
                }
            }
            if (role.name === "Copycat") {
                buildCenterCards([player.selectedCards[0]], targetsContainer);
                player.beginningRole = player.selectedCards[0].role;
                player.selectedCards.shift();
                if (player.beginningRole === "Doppelganger") {
                    player.doppelgangerCopy = player.selectedCards[0].role;
                }
            }
            if (role.name === "Alpha Wolf" || player.doppelgangerCopy === "Alpha Wolf") {
                const centerCard4Role = cards.find(card => card.name === "middle-card4").role;
                cards.find(card => card.name === "middle-card4").role = cards.find(card => card.name === player.selectedCards.at(-1).name).role;
                cards.find(card => card.name === player.selectedCards.at(-1).name).role = centerCard4Role;
            }
            if (role.name === "Robber" || player.doppelgangerCopy === "Robber" || role.name === "Drunk" || player.doppelgangerCopy === "Drunk") {
                const youRole = player.role;
                player.role = cards.find(card => card.name === player.selectedCards.at(-1).name).role;
                cards.find(card => card.name === player.selectedCards.at(-1).name).role = youRole;
            }
            if (role.name === "Witch" || player.doppelgangerCopy === "Witch" || role.name === "Troublemaker" || player.doppelgangerCopy === "Troublemaker") {
                const player1Role = cards.find(card => card.name === player.selectedCards.at(-1).name).role;
                cards.find(card => card.name === player.selectedCards.at(-1).name).role = cards.find(card => card.name === player.selectedCards.at(-2).name).role;
                cards.find(card => card.name === player.selectedCards.at(-2).name).role = player1Role;
            }
        }
        if (actionText.textContent === "woke together") {
            targetsContainer.append(actionText);
        }
        if (role.name === "Insomniac") {
            targetsContainer.append(createSummaryCard(player.name, player.role));
        }
        itemDiv.append(targetsContainer);
        summaryList.append(itemDiv);
    }

    function buildCenterCards(selectedCards, targetsContainer, isAlphaWolf = false) {
        const allMiddleCards = cards.filter(card => card.name.includes("middle-card"));
        const middleLogWrapper = document.createElement("div");
        middleLogWrapper.className = "summary-middle-wrapper";

        const centerCard4 = allMiddleCards.find(card => card.name === "middle-card4");
        if (centerCard4) {
            const alphaRow = document.createElement("div");
            alphaRow.className = "summary-alpha-row";

            const viewed = selectedCards.find(selected => selected.name === centerCard4.name);
            let cardElement = createSummaryCard(centerCard4.name, viewed ? viewed.role : "", !!viewed, true);
            if (isAlphaWolf) {
                cardElement = createSummaryCard(centerCard4.name, centerCard4.role, true, true);
            }
            cardElement.className = "summary-alpha-card-rotated";

            alphaRow.append(cardElement);
            middleLogWrapper.append(alphaRow);
        }

        const standardRow = document.createElement("div");
        standardRow.className = "summary-standard-row";

        allMiddleCards.filter(c => c.name !== "middle-card4").forEach(mCard => {
            const viewed = selectedCards.find(selected => selected.name === mCard.name);
            standardRow.append(createSummaryCard(mCard.name, viewed ? viewed.role : "", !!viewed, true));
        });

        middleLogWrapper.append(standardRow);
        targetsContainer.append(middleLogWrapper);
    }
}

export {buildGameSummary};