let curWord = "";
let guessArr = [];
let wordleWord; // word user attempts to guess
let hintsAvaliable = []; // array of hint letters avaliable
let hintsGiven = []; // list of hint letters already provided

let allWords; // stores all the dictionary words
let guessableWords; // stores all the guessable words

var letterKeys = document.getElementsByClassName("letter-key"); // a live html collection of all the letter buttons on the display keyboard

// store the wordleWords.json file in an array
fetch("wordleWords.json")
  .then((response) => response.json())
  .then((array) => {
    guessableWords = array;
    getWordleWord();
  })
  .catch((error) => console.error("Error loading JSON file:", error));

// store the allWords.json file in an array
fetch("allWords.json")
  .then((response) => response.json())
  .then((array) => {
    allWords = array;
  })
  .catch((error) => console.error("Error loading JSON file:", error));

function getRandomInt(min, max) {
  min = Math.ceil(min); // inclusive
  max = Math.floor(max); // exclusive
  return Math.floor(Math.random() * (max - min) + min);
}

// get word for user to guess
function getWordleWord() {
  wordleWord = guessableWords[getRandomInt(0, guessableWords.length)];
  console.log(wordleWord);

  // process word into array storing potential letters for a hint
  hintsAvaliable = wordleWord.split("");

  // remove duplicate letters
  hintsAvaliable = hintsAvaliable.filter(
    (value, index, self) => self.indexOf(value) === index
  );
}

function insertLetter(keyPressed) {
  // get row to insert into
  const row = guessArr.length + 1;

  // update curWord
  curWord += keyPressed;

  // split word into characters
  const letters = curWord.split("");

  // insert into row
  for (let i = 0; i < curWord.length; i++) {
    let curBox = document.getElementById(`r${row}c${i + 1}`);
    curBox.textContent = letters[i];
  }
}

function deleteLetter() {
  // get row to insert into
  const row = guessArr.length + 1;

  // if there is a letter to delete
  if (curWord.length > 0) {
    // remove the most recently entered letter
    const curBox = document.getElementById(`r${row}c${curWord.length}`);
    curBox.textContent = "";

    // update curWord, remove last letter
    curWord = curWord.slice(0, -1);
  }
}

function restart() {
  // Save data before a restart
  const wordleData = {
    wordleWord: wordleWord,
    guesses: guessArr,
    restart: true,
  };

  curWord = "";
  guessArr = [];
  wordleWord = guessableWords[getRandomInt(0, guessableWords.length)];
  console.log(wordleWord);

  // process word into array storing potential letters for a hint
  hintsAvaliable = wordleWord.split("");

  // remove duplicate letters
  hintsAvaliable = hintsAvaliable.filter(
    (value, index, self) => self.indexOf(value) === index
  );

  letterBoxes = document.getElementsByClassName("letter");

  for (var i = 0; i < letterBoxes.length; i++) {
    letterBoxes[i].textContent = "";
    letterBoxes[i].classList.remove("correct");
    letterBoxes[i].classList.remove("present");
    letterBoxes[i].classList.remove("absent");
    letterBoxes[i].classList.remove("guessed");
  }

  for (var i = 0; i < letterKeys.length; i++) {
    letterKeys[i].classList.remove("correct");
    letterKeys[i].classList.remove("present");
    letterKeys[i].classList.remove("absent");
    letterKeys[i].classList.remove("guessed");
  }

  // reapply dark mode highlights if necessary
  if (document.getElementById("theme-switcher").classList.contains("dark")) {
    document.querySelectorAll(".letter").forEach(function (element) {
      if (!element.classList.contains("dark")) element.classList.add("dark");
    });

    document.querySelectorAll(".key").forEach(function (element) {
      if (!element.classList.contains("dark")) element.classList.add("dark");
    });
  }
}

function saveWordleData(wordleData) {
  return fetch("/save-wordle-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(wordleData),
  })
    .then((response) => response.text())
    .then((data) => {
      console.log("Data saved: ", data);
      return data;
    })
    .catch((error) => {
      console.error("Error saving data: ", error);
      throw error;
    });
}

function updateStatsAndShowModal(isWin) {
  fetch('/stats')
    .then(response => response.json())
    .then(data => {
      if (isWin) {
        document.getElementById('winningModal').style.display = 'block';
        document.getElementById('dynamicTotalWins').textContent = `Total Wins: ${data.wins}`;
      } else {
          document.getElementById('losingModal').style.display = 'block';
          document.getElementById('dynamicWordleWord').textContent = `The correct word was: ${data.wordleWord}`
          document.getElementById('dynamicTotalLosses').textContent = `Number of Losses: ${data.losses}`;
      }
    })
    .catch(error => console.error('Error fetching stats: ', error));
}

async function enterButtonClickListener() {
  if (curWord.length != 5) {
    // if the current word/guessed word is not a 5 letter word
    alert("Your guess must contain five letters.");
  } else if (!allWords.includes(curWord)) {
    // if the guessed word is not in the wordle dictionary
    alert("Word not in game dictionary");
  } else {

    // guess works, change colors
    const row = guessArr.length + 1;

    // changes highlight colors of boxes and keyboard
    // for each letter in the previous guess
    for (var i = 0; i < 5; i++) {
      // if that key is in dark mode
      if (document.getElementById(curWord[i]).classList.contains("dark")) {
        // remove dark mode
        document.getElementById(curWord[i]).classList.remove("dark");
      }

      // if the current letter in the guess, matches the corresponding letter in the wordle
      if (curWord[i] === wordleWord[i]) {
        // if letter on keyboard is highlighted grey or yellow, remove that highlight
        if (document.getElementById(curWord[i]).classList.contains("present")) {
          document.getElementById(curWord[i]).classList.remove("present");
        } else if (
          document.getElementById(curWord[i]).classList.contains("absent")
        ) {
          document.getElementById(curWord[i]).classList.remove("absent");
        }

        // add green highlight to key and letter box
        document.getElementById(`r${row}c${i + 1}`).classList.add("correct");
        document.getElementById(curWord[i]).classList.add("correct");

        // else if current letter exists somewhere in wordle
      } else if (wordleWord.includes(curWord[i])) {
        // if not already highlighted green, highlight key yellow
        if (
          !document.getElementById(curWord[i]).classList.contains("correct")
        ) {
          document.getElementById(curWord[i]).classList.add("present");
        }

        // add yellow highlight to letter box
        document.getElementById(`r${row}c${i + 1}`).classList.add("present");

        // else if current letter does not exist in wordle
      } else {
        document.getElementById(`r${row}c${i + 1}`).classList.add("absent");

        // if not already highlighted green, highlight key grey
        if (
          !document.getElementById(curWord[i]).classList.contains("correct")
        ) {
          document.getElementById(curWord[i]).classList.add("absent");
        }
      }

      // add grey highlight to letter box
      document.getElementById(curWord[i]).classList.add("guessed");
    }

    // checks for win/lose
    if (curWord === wordleWord) {
      // Save data when user wins
      const wordleData = {
        wordleWord: wordleWord,
        guesses: guessArr,
        gameOutcome: "Won",
      };

      try {
        await saveWordleData(wordleData);
        updateStatsAndShowModal(true);
      } catch (error) {
        console.error('Error in saving game data:', error);
      }

      restart();
    } else if (guessArr.length === 5) {
      // Save data when user loses
      const wordleData = {
        wordleWord: wordleWord,
        guesses: guessArr,
        gameOutcome: "Lost",
      };

      try {
        await saveWordleData(wordleData);
        updateStatsAndShowModal(false);
      } catch (error) {
        console.error('Error in saving game data:', error);
      };

      restart();
    } else {
      // apply corrosponding styling to guessed letters
      for (let i = 0; i < 5; i++) {
        document
          .getElementById(`r${guessArr.length + 1}c${i + 1}`)
          .classList.add("guessed");
      }

      guessArr.push(curWord);
      curWord = "";
    }
  }
}

document.addEventListener('DOMContentLoaded', (event) => {
// Event listeners for closing modals
document.getElementById("closeWinningModal").addEventListener("click", function () {
  document.getElementById("winningModal").style.display = "none";
});
document.getElementById("closeLosingModal").addEventListener("click", function () {
  document.getElementById("losingModal").style.display = "none";
});

// Event listeners for restart buttons inside modals
document.getElementById("restartWinningButton").addEventListener("click", function () {
  document.getElementById("winningModal").style.display = "none";
  // Additional restart logic if needed
});
document.getElementById("restartLosingButton").addEventListener("click", function () {
  document.getElementById("losingModal").style.display = "none";
  // Additional restart logic if needed
});
});


function letterKeyClickListener(event) {
  keyPressed = event.target.textContent;
  if (curWord.length < 5) {
    insertLetter(keyPressed);
  }
}

// listen for when theme-switcher button is clicked
const themeSwitcher = document.getElementById("theme-switcher");

themeSwitcher.addEventListener("click", function () {
  document.body.classList.toggle("dark"); // Toggle dark class on body
  updateDarkModeText(); // Optional: Update the text of the theme switcher button
});

function updateDarkModeText() {
  themeSwitcher.textContent = document.body.classList.contains("dark")
    ? "Light Mode"
    : "Dark Mode";
}

document.getElementById("enable-hints").addEventListener("click", function () {
  if (hintsAvaliable.length > 0) {
    // Generate and log random letter within the array
    const hint =
      hintsAvaliable[Math.floor(Math.random() * hintsAvaliable.length)];

    alert(`Wordle contains the letter ${hint}`);

    // remove hinted letter from array
    const hintIndex = hintsAvaliable.indexOf(hint);
    hintsAvaliable.splice(hintIndex, 1);
  } else {
    alert("There are no hints left to provide.");
  }
});

// detect key press on keyboard
window.addEventListener("keydown", function (event) {
  // get key pressed
  const keyPressed = event.key.toLowerCase();

  // if key pressed is a letter and can be inserted
  if (
    /[a-zA-z]/.test(keyPressed) &&
    keyPressed.length == 1 &&
    curWord.length < 5
  ) {
    insertLetter(keyPressed);
  } else if (keyPressed === "backspace") {
    deleteLetter();
  } else if (keyPressed === "enter") {
    enterButtonClickListener();
  }
});

// listen for when a button is pressed on the keyboard display
for (var i = 0; i < letterKeys.length; i++) {
  letterKeys[i].addEventListener("click", letterKeyClickListener);
}

// listen for when enter is pressed on the keyboard display
document
  .getElementById("enter")
  .addEventListener("click", enterButtonClickListener);

// listen for when the backspace is pressed on the keyboard display
document.getElementById("backspace").addEventListener("click", deleteLetter);

function saveWordleData(wordleData) {
  fetch("/save-wordle-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(wordleData),
  })
  .then((response) => response.text())
  .then((data) => {
    console.log("Data saved: ", data);
    updateStatsAndShowModal(wordleData.gameOutcome === "Won");
  })
  .catch((error) => console.error("Error saving data: ", error));
}
