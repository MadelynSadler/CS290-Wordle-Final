const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { engine } = require("express-handlebars"); // Importing the engine function

const app = express();
const port = process.env.PORT || 8000;

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

const mongoDBUrl =
  "mongodb+srv://group3:o6HTVkMfSUU9t6OD@wordle290.coha0r5.mongodb.net/?retryWrites=true&w=majority";
mongoose
  .connect(mongoDBUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
  })
  .then(() => {
    console.log("MongoDB connected successfully");
    clearWordleData(); // Format WordleData collection
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// MongoDB schema and model
const wordleSchema = new mongoose.Schema({
  wordleWord: String,
  guesses: [String],
  gameOutcome: String,
});
const WordleData = mongoose.model("WordleData", wordleSchema);

const statSchema = new mongoose.Schema({
  wins: {
    type: Number,
    default: 0,
  },
  losses: {
    type: Number,
    default: 0,
  },
  gamesPlayed: {
    type: Number,
    default: 0,
  },
});
const StatData = mongoose.model("StatData", statSchema);

// Middleware
app.use(bodyParser.json()); // for parsing application/json
app.use(express.static(path.join(__dirname, "static")));

app.post("/save-wordle-data", async (req, res) => {
  try {
    const { gameOutcome } = req.body;

    const gameData = new WordleData(req.body);
    await gameData.save();

    // Define an update based on the game outcome
    let update = { $inc: { gamesPlayed: 1 } };
    if (gameOutcome === "Won") {
      update.$inc.wins = 1;
    } else if (gameOutcome === "Lost") {
      update.$inc.losses = 1;
    }

    // Update an existing document or create a new one if it doesn't exist
    await StatData.findOneAndUpdate({}, update, { upsert: true, new: true });

    res.status(200).send("Data saved successful!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving to MongoDB");
  }
});

app.get("/stats", async (req, res) => {
  try {
    const stats = await StatData.findOne({});
    const latestWordle = await WordleData.findOne({}).sort({ _id: -1 });
    const defaultStats = { wins: 0, losses: 0, wordleWord: "N/A" };
    const response = {
      wins: stats ? stats.wins : defaultStats.wins,
      losses: stats ? stats.losses : defaultStats.losses,
      wordleWord: latestWordle
        ? latestWordle.wordleWord
        : defaultStats.wordleWord,
    };
    res.json(response);
  } catch (error) {
    console.error("Error fetching stats: ", error);
    res.status(500).send("Internal Server Error");
  }
});

// Serve the game page
app.get("/", async (req, res) => {
  try {
    const stats = await StatData.findOne({});
    const totalWins = stats ? stats.wins : 0;
    const totalLosses = stats ? stats.losses : 0;
    const wordle = await WordleData.findOne({}).sort({ _id: -1 });
    const word = wordle ? wordle.wordleWord : "N/A";
    // Additional data can be passed to the template if needed
    res.render("game", {
      wins: totalWins,
      numberOfLosses: totalLosses,
      correctWord: word,
    });
  } catch (error) {
    console.error("Error fetching game data: ", error);
    res.status(500).send("Internal Server Error");
  }
});

// Function to format WordleData collection
async function clearWordleData() {
  try {
    await WordleData.deleteMany({});
    await StatData.deleteMany({});
    console.log("WordleData Collection cleared!");
  } catch (err) {
    console.error("Error clearing WordleData Collection", err);
  }
}

app.listen(port, () => {
  console.log("== Server listening on port: ", port);
});

app.use((req, res) => {
  res.status(404).render("404");
});
