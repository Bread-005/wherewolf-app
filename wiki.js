document.addEventListener("DOMContentLoaded", () => {

    // test data for now (later database roles)
    const roles = [
        {
            name: "Werewolf",
            team: "Werewolf",
            abilityText: "See other werewolves. If alone, may view 1 center card"
        },
        {
            name: "Seer",
            team: "Villager",
            abilityText: "Either view 1 player´s card or 2 center cards",
        }
    ];

    displayWikiRole(roles[0]);

    for (const role of roles) {
        const option = new Option(role.name, JSON.stringify(role));
        document.getElementById("wiki-role-selection").add(option);
    }

    document.getElementById("wiki-role-selection").addEventListener("change", (event) => {
        const role = JSON.parse(event.target.value);
        displayWikiRole(role);
    });

    function displayWikiRole(role) {
        document.getElementById("wiki-role-name").textContent = role.name;
        document.getElementById("wiki-role-team").textContent = role.team;
        document.getElementById("wiki-role-ability-text").textContent = role.abilityText;
    }
});