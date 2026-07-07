require('dotenv').config();

const express = require('express');
const path = require('path');
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const routes = require('./routes');
app.use('/', routes);

// Make body-parser errors (e.g. payload too large) return JSON instead of
// Express's default HTML error page, which breaks fetch()'s res.json() calls
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Upload too large.' });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed request body.' });
  }
  next(err);
});

app.get("/api/github/contributions", async (req, res) => {
    const query = `
    {
      user(login: "${process.env.GITHUB_USERNAME}") {
        contributionsCollection {
          contributionCalendar {
            totalContributions

            weeks {
              contributionDays {
                contributionCount
                contributionLevel
                date
              }
            }
          }
        }
      }
    }`;

    try {
        const response = await fetch("https://api.github.com/graphql", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        });

        const json = await response.json();

        const calendar =
            json.data.user.contributionsCollection.contributionCalendar;

        const days = [];

        for (const week of calendar.weeks) {
            for (const day of week.contributionDays) {

                let level = 0;

                switch (day.contributionLevel) {
                    case "FIRST_QUARTILE":
                        level = 1;
                        break;

                    case "SECOND_QUARTILE":
                        level = 2;
                        break;

                    case "THIRD_QUARTILE":
                        level = 3;
                        break;

                    case "FOURTH_QUARTILE":
                        level = 4;
                        break;
                }

                days.push({
                    date: day.date,
                    count: day.contributionCount,
                    level
                });
            }
        }

        res.json({
            totalContributions: calendar.totalContributions,
            days
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Unable to fetch GitHub contributions."
        });
    }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
