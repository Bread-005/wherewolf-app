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

    const players = lobby.cards.filter(card => !card.isMiddleCard);

    const cards = lobby.cards.map(card => {
        return {
            name: card.name,
            role: card.roleChain[0],
            selectedCards: card.selectedCards,
            beginningRole: card.roleChain[0],
            doppelgangerCopy: "",
            startRole: card.roleChain[0]
        }
    });

    for (const role of roles) {
        const player = cards.find(card => !card.name.includes("middle-card") && (card.beginningRole === role.name ||
            role.name === "Werewolf" && lobby.cards.find(card1 => card1.name === card.name && card1.startingRole.toLowerCase().includes("wolf") && card1.startingRole !== "Dream Wolf")));
        if (!player) continue;
        if (role.nightOrder > 100) continue;
        if (role.name === "Cow") continue;

        if (role.name === "Doppelganger" && player.startRole !== "Copycat") {
            player.doppelgangerCopy = cards.find(card => card.name === player.selectedCards[0].name).startRole;
        }

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
        if (player.beginningRole === "Mystic Wolf" || player.beginningRole === "Seer" || player.beginningRole === "Apprentice Seer" ||
            player.beginningRole === "Paranormal Investigator" || player.beginningRole === "Revealer" || player.beginningRole === "Exposer" ||
            player.beginningRole === "Mortician") {
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
            player.doppelgangerCopy = player.selectedCards[0].role;
            if (player.doppelgangerCopy === "Copycat") {
                player.doppelgangerCopy = player.selectedCards[1].role;
            }
            if (player.selectedCards.length > 1) {
                const andText = document.createElement("span");
                andText.className = "summary-and-text";
                andText.textContent = "and then selected";
                targetsContainer.append(andText);
            }
            player.selectedCards.shift();
        }

        // Alpha Wolf exception
        if (role.name === "Alpha Wolf") {
            buildCenterCards(player.selectedCards, targetsContainer, true);
            const withText = document.createElement("span");
            withText.className = "summary-and-text";
            withText.textContent = "with";
            targetsContainer.append(withText);
        }

        if (role.name === "Werewolf" || role.name === "Mason") {
            const others = players.filter(p => (p.startingRole === role.name || role.name === "Werewolf" && p.startingRole.toLowerCase().includes("wolf") && p.startingRole !== "Dream Wolf") && p.name !== player.name);
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
            if (role.name === "Werewolf") {
                const targetPlayers = cards.filter(p => p.beginningRole === "Dream Wolf" || p.beginningRole === "Cow");
                if (targetPlayers.length > 0) {
                    actionText.textContent = "woke and saw";

                    targetPlayers.forEach((target, index) => {
                        targetsContainer.append(createSummaryCard(target.name, target.beginningRole));

                        if (index < targetPlayers.length - 1) {
                            const andText = document.createElement("span");
                            andText.className = "summary-and-text";
                            andText.textContent = "and";
                            targetsContainer.append(andText);
                        }
                    });

                    if (others.length === 0) {
                        const actionText2 = document.createElement("span");
                        actionText2.className = "summary-action-text";
                        if (player.selectedCards[0]?.name.includes("middle-card")) {
                            actionText2.textContent = "and viewed";
                        } else {
                            actionText2.textContent = "and did nothing";
                        }
                        targetsContainer.append(actionText2);
                    }
                }
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
                if ((role.name === "Seer" || role.name === "Doppelganger" && player.doppelgangerCopy === "Seer") &&
                    player.selectedCards.at(-1).name.includes("middle-card") && player.selectedCards.at(-2).name.includes("middle-card")) {
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
            if (role.name === "Werewolf") {
                const werewolves = lobby.cards.filter(card => !card.isMiddleCard && card.startingRole.toLowerCase().includes("wolf"));
                if (werewolves.length === 1 && player.selectedCards[0]?.name.includes("middle-card")) {
                    player.selectedCards.shift();
                }
            }
            if (role.name === "Alpha Wolf" || role.name === "Doppelganger" && player.doppelgangerCopy === "Alpha Wolf") {
                const centerCard4Role = cards.find(card => card.name === "middle-card4").role;
                cards.find(card => card.name === "middle-card4").role = cards.find(card => card.name === player.selectedCards.at(-1).name).role;
                cards.find(card => card.name === player.selectedCards.at(-1).name).role = centerCard4Role;
            }
            if (role.name === "Robber" || role.name === "Doppelganger" && player.doppelgangerCopy === "Robber" ||
                role.name === "Drunk" || role.name === "Doppelganger" && player.doppelgangerCopy === "Drunk") {
                const youRole = player.role;
                player.role = cards.find(card => card.name === player.selectedCards.at(-1).name).role;
                cards.find(card => card.name === player.selectedCards.at(-1).name).role = youRole;
            }
            if (player.selectedCards.length > 1) {
                if (role.name === "Witch" || role.name === "Doppelganger" && player.doppelgangerCopy === "Witch" ||
                    role.name === "Troublemaker" || role.name === "Doppelganger" && player.doppelgangerCopy === "Troublemaker") {
                    const player1Role = cards.find(card => card.name === player.selectedCards.at(-1).name).role;
                    cards.find(card => card.name === player.selectedCards.at(-1).name).role = cards.find(card => card.name === player.selectedCards.at(-2).name).role;
                    cards.find(card => card.name === player.selectedCards.at(-2).name).role = player1Role;
                }
            }
        }
        if (actionText.textContent === "woke together") {
            targetsContainer.append(actionText);
        }
        if (role.name === "Insomniac") {
            targetsContainer.append(createSummaryCard(player.name, player.role));
        }
        if (role.name === "Mortician") {
            const randomAction = lobby.randomActions.find(action => action.role === "Mortician").action;
            if (randomAction.includes("yourself")) {
                actionText.textContent = "looked at themself";
                targetsContainer.append(createSummaryCard(player.name, player.role));

            }
        }
        itemDiv.append(targetsContainer);
        summaryList.append(itemDiv);
    }

    function buildCenterCards(selectedCards, targetsContainer, isAlphaWolf = false) {
        const allMiddleCards = cards.filter(card => card.name.includes("middle-card"));
        const middleCardsWrapper = document.createElement("div");
        middleCardsWrapper.className = "summary-middle-wrapper";

        const centerCard4 = allMiddleCards.find(card => card.name === "middle-card4");
        if (centerCard4) {
            const alphaRow = document.createElement("div");
            alphaRow.className = "summary-alpha-row";

            const viewed = selectedCards.find(selected => selected.name === centerCard4.name);
            let cardElement = createSummaryCard(centerCard4.name, viewed ? centerCard4.role : "", !!viewed, true);
            if (isAlphaWolf) {
                cardElement = createSummaryCard(centerCard4.name, centerCard4.role, true, true);
            }
            cardElement.className = "summary-alpha-card-rotated";

            alphaRow.append(cardElement);
            middleCardsWrapper.append(alphaRow);
        }

        const standardRow = document.createElement("div");
        standardRow.className = "summary-standard-row";

        allMiddleCards.filter(c => c.name !== "middle-card4").forEach(mCard => {
            const viewed = selectedCards.find(selected => selected.name === mCard.name);
            standardRow.append(createSummaryCard(mCard.name, viewed ? cards.find(card => card.name === viewed.name).role : "", !!viewed, true));
        });

        middleCardsWrapper.append(standardRow);
        targetsContainer.append(middleCardsWrapper);
    }
}

export {buildGameSummary};