class GitContributionCalendar {
    constructor(element, options = {}) {
        this.element = element;
        this.endpoint = options.endpoint ?? "/api/github/contributions";
    }

    async load() {
        try {
            const response = await fetch(this.endpoint);
            const data = await response.json();

            this.render(data);
        } catch (err) {
            console.error(err);
            this.element.textContent = "Unable to load GitHub contributions.";
        }
    }

    render(data) {
        this.element.innerHTML = "";

        const wrapper = document.createElement("div");
        wrapper.className = "git-calendar";

        const title = document.createElement("div");
        title.className = "git-calendar-title";
        title.textContent = `${data.totalContributions.toLocaleString()} Contributions`;

        wrapper.appendChild(title);

        const grid = document.createElement("div");
        grid.className = "git-calendar-grid";

        data.days.forEach(day => {
            const cell = document.createElement("div");

            cell.className = `level-${day.level}`;

            cell.title = `${day.date}
${day.count} contribution${day.count !== 1 ? "s" : ""}`;

            grid.appendChild(cell);
        });

        wrapper.appendChild(grid);

        this.element.appendChild(wrapper);
    }
}

document.querySelectorAll(".git-commits").forEach(element => {
    new GitContributionCalendar(element).load();
});