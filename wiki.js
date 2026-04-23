document.addEventListener("DOMContentLoaded", async () => {

    const roles = await fetch("./roles.json").then(res => res.json());

    for (const role of roles) {
        const option = new Option(role.name, JSON.stringify(role));
        document.getElementById("wiki-role-selection").add(option);
    }

    displayWikiRole(roles[0]);

    document.getElementById("wiki-role-selection").addEventListener("change", (event) => {
        const role = JSON.parse(event.target.value);
        displayWikiRole(role);
    });

    function displayWikiRole(role) {
        if (role.team === "Villager") {
            document.getElementById("wiki-role-container").style.background = "green";
            document.getElementById("wiki-role-team").className = "team-villager";
            document.getElementById("wiki-role-container").style.borderTop = "8px solid #27ae60";
        } else {
            document.getElementById("wiki-role-container").style.background = "purple";
            document.getElementById("wiki-role-team").className = "team-wolf";
            document.getElementById("wiki-role-container").style.borderTop = "8px solid #c0392b";
        }
        document.getElementById("wiki-role-name").textContent = "Name: " + role.name;
        document.getElementById("wiki-role-team").textContent = "Team: " + role.team;
        document.getElementById("wiki-role-description").textContent = "Description: nothing here yet";
        document.getElementById("wiki-role-night-action").textContent = "Night Action: " + (role.nightAction ? role.nightAction : "none");
        document.getElementById("wiki-role-night-action-detailed").textContent = role.nightActionDetailed ? "Detailed: " + role.nightActionDetailed : "";
    }
});