import express from "express";
import scrapeGitHubProfile from "./scraper.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/github-user/:username", async (req, res) => {
  try {
    const data = await scrapeGitHubProfile(req.params.username);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to scrape data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
