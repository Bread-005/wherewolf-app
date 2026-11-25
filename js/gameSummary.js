import {allRoles} from "./index.js";

const ROLES_WITH_OWN_COPY_ENTRY = ["Insomniac", "Minion", "Squire", "Beholder", "Apprentice Tanner", "Mortician", "Assassin"];

function findCopiedRole(doppelganger, cards) {
    const target = doppelganger.selectedCards[0];
    if (!target) {
        return undefined;
    }
    const copiedRole = cards.find(card => card.name === target.name).startRole;
    return copiedRole === "Copycat" ? doppelganger.selectedCards[1]?.role : copiedRole;
}

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

    const doppelganger = cards.find(card => !card.name.includes("middle-card") && card.beginningRole === "Doppelganger");
    const copiedRole = doppelganger && findCopiedRole(doppelganger, cards);
    if (ROLES_WITH_OWN_COPY_ENTRY.includes(copiedRole)) {
        roles.push({
            nightOrder: allRoles.find(role => role.name === copiedRole).nightOrder,
            name: copiedRole,
            copier: doppelganger,
        });
        roles.sort((a, b) => a.nightOrder - b.nightOrder);
    }

    for (const role of roles) {
        const isCopy = Boolean(role.copier);
        const player = role.copier ?? cards.find(card => !card.name.includes("middle-card") && (card.beginningRole === role.name ||
            role.name === "Werewolf" && lobby.cards.find(card1 => card1.name === card.name && card1.startingRole.toLowerCase().includes("wolf") && card1.startingRole !== "Dream Wolf")));
        if (role.name === "Oracle") {
            const oracle = cards.find(card => card.beginningRole === "Oracle");
            const question = lobby.randomActions.find(action => action.role === "Oracle").action;
            summaryList.append(buildOracleItem(oracle, question, lobby.oracleAnswer));
            continue;
        }
        if (!player) continue;
        if (role.name === "Blob") {
            summaryList.append(buildBlobItem(player, lobby.randomActions.find(action => action.role === "Blob").action));
            continue;
        }
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
            role.name === "Mortician") {
            actionText.textContent = "looked at";
        }
        if (player.beginningRole === "Robber" || player.beginningRole === "Drunk") {
            actionText.textContent = "swapped with";
        }
        if (player.beginningRole === "Alpha Wolf" || player.beginningRole === "Witch" || player.beginningRole === "Troublemaker") {
            actionText.textContent = "swapped";
        }
        if (player.beginningRole === "Thing") {
            actionText.textContent = "bumped";
        }
        if (role.name === "Assassin") {
            actionText.textContent = "gave the Mark of the Assassin to";
        }
        if (player.selectedCards.length === 0) {
            actionText.textContent = "did nothing";
        }
        if (role.name === "Insomniac") {
            actionText.textContent = "woke up as";
        }

        itemDiv.append(createSummaryCard(player.name, player.startRole));
        if (isCopy) {
            itemDiv.append(createSummaryCard("", role.name));
        } else if (player.startRole !== player.beginningRole) {
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
            if (player.selectedCards.length > 1 && !["Mortician", "Assassin"].includes(player.doppelgangerCopy)) {
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
                    targetsContainer.append(actionText);
                    if (player.selectedCards[0]?.name.includes("middle-card")) {
                        actionText.textContent = "woke alone and viewed";
                        buildCenterCards([player.selectedCards[0]], targetsContainer);
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
                    itemDiv.append(andText);
                    itemDiv.append(createSummaryCard(other.name, other.roleChain[0]));
                });
                itemDiv.append(actionText);
            }
            if (role.name === "Werewolf") {
                const targetPlayers = cards.filter(p => !p.name.includes("middle-card") && (p.beginningRole === "Dream Wolf" || p.beginningRole === "Cow"));
                if (targetPlayers.length > 0) {
                    const andSawText = document.createElement("span");
                    andSawText.className = "summary-and-text";
                    andSawText.textContent = "and saw";
                    targetsContainer.append(andSawText);

                    targetPlayers.forEach((target, index) => {
                        targetsContainer.append(createSummaryCard(target.name, target.beginningRole));

                        if (index < targetPlayers.length - 1) {
                            const andText = document.createElement("span");
                            andText.className = "summary-and-text";
                            andText.textContent = "and";
                            targetsContainer.append(andText);
                        }
                    });
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

        if (role.name === "Squire") {
            const werewolves = cards.filter(p => !p.name.includes("middle-card") && p.beginningRole.toLowerCase().includes("wolf"));
            actionText.textContent = "saw";
            if (werewolves.length === 0) {
                actionText.textContent += " no werewolves";
            }

            werewolves.forEach((werewolf, index) => {
                targetsContainer.append(createSummaryCard(werewolf.name, werewolf.role));

                if (index < werewolves.length - 1) {
                    const andText = document.createElement("span");
                    andText.className = "summary-and-text";
                    andText.textContent = "and";
                    targetsContainer.append(andText);
                }
            });
        }

        if (role.name === "Beholder") {
            const seerPlayers = cards.filter(p => !p.name.includes("middle-card") &&
                (p.beginningRole === "Seer" || p.beginningRole === "Apprentice Seer"));
            actionText.textContent = "saw";
            if (seerPlayers.length === 0) {
                actionText.textContent += " no Seer or Apprentice Seer";
            }

            seerPlayers.forEach((seerPlayer, index) => {
                targetsContainer.append(createSummaryCard(seerPlayer.name, seerPlayer.role));

                if (index < seerPlayers.length - 1) {
                    const andText = document.createElement("span");
                    andText.className = "summary-and-text";
                    andText.textContent = "and";
                    targetsContainer.append(andText);
                }
            });
        }

        if (role.name === "Apprentice Tanner") {
            const tannerPlayers = lobby.cards.filter(card => !card.isMiddleCard && card.startingRole === "Tanner");
            actionText.textContent = "saw";
            if (tannerPlayers.length === 0) {
                actionText.textContent += " no Tanner";
            }

            tannerPlayers.forEach((tannerPlayer, index) => {
                targetsContainer.append(createSummaryCard(tannerPlayer.name, tannerPlayer.roleChain[0]));

                if (index < tannerPlayers.length - 1) {
                    const andText = document.createElement("span");
                    andText.className = "summary-and-text";
                    andText.textContent = "and";
                    targetsContainer.append(andText);
                }
            });
        }

        if (player.selectedCards.length > 0) {
            const isDoppelgangerWithOwnEntry = role.name === "Doppelganger" && ["Mortician", "Assassin"].includes(player.doppelgangerCopy);
            if (role.name !== "Copycat" && role.name !== "Werewolf" && role.name !== "Village Idiot" && !isDoppelgangerWithOwnEntry) {
                if ((role.name === "Seer" || role.name === "Doppelganger" && player.doppelgangerCopy === "Seer") &&
                    player.selectedCards.at(-1).name.includes("middle-card") && player.selectedCards.at(-2).name.includes("middle-card")) {
                    buildCenterCards([player.selectedCards.at(-2), player.selectedCards.at(-1)], targetsContainer);
                } else {
                    player.selectedCards.forEach((selected, index) => {
                        if (selected.name.includes("middle-card")) {
                            buildCenterCards([selected], targetsContainer);
                        }
                        if (!selected.name.includes("middle-card")) {
                            targetsContainer.append(createSummaryCard(selected.name, cards.find(card => card.name === selected.name).role));
                        }

                        if (index < player.selectedCards.length - 1 && player.selectedCards.length > 1) {
                            const andText = document.createElement("span");
                            andText.className = "summary-and-text";
                            andText.textContent = "and";
                            targetsContainer.append(andText);
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
            if (role.name === "Village Idiot" || role.name === "Doppelganger" && player.doppelgangerCopy === "Village Idiot") {
                const myIndex = players.findIndex(p => p.name === player.name);
                const movedEveryoneLeft = player.selectedCards.at(-1).name === players[(myIndex + 1) % players.length].name;
                let cardsCopy = cards.filter(c => !c.name.includes("middle-card") && c.name !== player.name).map(card => ({...card}));
                if (movedEveryoneLeft) {
                    cardsCopy.reverse();
                }

                for (let i = 0; i < cardsCopy.length; i++) {
                    const currentCard = cards.find(card => card.name === cardsCopy[i].name);
                    const nextCard = cardsCopy[(i + 1) % cardsCopy.length];
                    currentCard.role = nextCard.role;
                }
                actionText.textContent = "moved everyone else's card to the " + (movedEveryoneLeft ? "left" : "right");
            }
        }
        if (role.name === "Insomniac") {
            targetsContainer.append(createSummaryCard(player.name, player.role));
        }
        if (role.name === "Mortician") {
            const randomActionRole = isCopy ? "Doppelganger-Mortician" : "Mortician";
            const randomAction = lobby.randomActions.find(action => action.role === randomActionRole).action;
            if (randomAction.includes("yourself")) {
                actionText.textContent = "looked at themself";
                targetsContainer.append(createSummaryCard(player.name, player.role));

            }
        }
        itemDiv.append(targetsContainer);
        summaryList.append(itemDiv);
    }

    function buildOracleItem(oracle, question, answer) {
        const itemDiv = document.createElement("div");
        itemDiv.className = "summary-item";
        itemDiv.append(createSummaryCard(oracle.name, oracle.startRole, true, oracle.name.includes("middle-card")));

        const hasAnsweredYes = answer.includes("Congratulations") || answer.includes("go ahead") || answer.includes("you may view the");
        const actionText = document.createElement("span");
        actionText.className = "summary-action-text";
        const askedText = `was asked "${question}"`;
        const answeredText = `and answered ${hasAnsweredYes ? "yes" : "no"}`;

        const targetsContainer = document.createElement("div");
        targetsContainer.className = "summary-targets";
        const selectedCards = oracle.selectedCards ?? [];
        const followUpText = document.createElement("span");
        followUpText.className = "summary-and-text";

        if (answer.includes("Congratulations")) {
            followUpText.textContent = "and turned into";
            targetsContainer.append(followUpText, createSummaryCard("", "Werewolf", true, true));
            oracle.role = "Werewolf";
        }
        if (answer.includes("go ahead") && selectedCards.length > 0) {
            followUpText.textContent = "and swapped with";
            targetsContainer.append(followUpText);
            buildCenterCards([selectedCards[0]], targetsContainer);

            const swappedCard = cards.find(card => card.name === selectedCards[0].name);
            [oracle.role, swappedCard.role] = [swappedCard.role, oracle.role];
        }
        if (answer.toLowerCase().includes("you may") && selectedCards.length > 0) {
            followUpText.textContent = "and looked at";
            targetsContainer.append(followUpText);
            buildCenterCards(selectedCards, targetsContainer);
        }

        if (targetsContainer.children.length === 0) {
            actionText.textContent = `${askedText} ${answeredText}`;
            itemDiv.append(actionText);
            return itemDiv;
        }
        actionText.append(askedText, document.createElement("br"), answeredText);
        itemDiv.append(actionText, targetsContainer);
        return itemDiv;
    }

    function buildBlobItem(player, randomAction) {
        const itemDiv = document.createElement("div");
        itemDiv.className = "summary-item";

        const actionText = document.createElement("span");
        actionText.className = "summary-action-text";
        const neighbors = randomAction.match(/(\d+) players (on each side|to your left|to your right)/);
        if (neighbors) {
            const [, amount, position] = neighbors;
            const playerWord = amount === "1" ? "player" : "players";
            actionText.textContent = `was told to keep themselves and the ${amount} ${playerWord} ${position.replace("your", "their")} alive`;
        } else {
            actionText.textContent = "was told to keep themselves alive";
        }

        itemDiv.append(createSummaryCard(player.name, player.startRole));
        itemDiv.append(actionText);
        return itemDiv;
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
