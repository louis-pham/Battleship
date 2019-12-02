/*----- constants -----*/

/*----- app's state (variables) -----*/
let currentPlayer, player1, player2, winner;

/*----- cached element references -----*/
let boardElement = document.querySelector("#board");
let messageElement = document.querySelector("#message");
let shipListElement = document.querySelector("#ship-list");

/*----- event listeners -----*/
// board (cell) click event
boardElement.addEventListener("click", (e) => {
  /*
  if there's no winner, it's the player's turn, the shot hasn't been taken before and it wasn't the board that was clicked,
    check the shot
  */
  if ( !winner
    && currentPlayer === player1
    && player1.hits.indexOf(e.target.id) === -1
    && player1.misses.indexOf(e.target.id) === -1
    && e.target.id !== "board" ) {
      registerShot(e.target.id);
  }
});

/*----- functions -----*/

init();

function registerShot(coordinate) {
  let opponent = currentPlayer === player1 ? player2 : player1;
  /*
  for each of opponent's ship
    if coordinate is in the ship's coordinate array,
      add coordinate to player's hits
      reduce opponent ship's health
      break out early

  check if player's won
  switch to opponent's turn
  */
  console.log(coordinate);
  let missed = true;
  loop1:
  for (ship in opponent.ships) {
    for (shipCoordinate of opponent.ships[ship].coordinates) {
      if (coordinate === shipCoordinate) {
        missed = false;
        currentPlayer.hits.push(coordinate);
        opponent.ships[ship].health--;
        break loop1;
      }
    }
  }
  if (missed) currentPlayer.misses.push(coordinate);
  // currentPlayer = opponent;
  render();
  return;
}

function doPlayer2() {
  /*
    choose a coordinate not within shots already taken (for now, choose randomly)
    register shot
  */
  return;
}

function init() {
  winner = null;
  player1 = {
    name: "Player 1 (Human)",
    ships: {
      carrier: { health: 5, coordinates: [] },
      battleship: { health: 4, coordinates: [] },
      cruiser: { health: 3, coordinates: [] },
      submarine: { health: 3, coordinates: [] },
      destroyer: { health: 2, coordinates: [] },
    },
    hits: [],
    misses: []
  };

  player2 = {
    name: "Player 2 (Robot)",
    ships: {
      carrier: { health: 5, coordinates: ["A0","A1","A2","A3","A4"] },
      battleship: { health: 4, coordinates: ["D2","D3","D4","D5"] },
      cruiser: { health: 3, coordinates: ["D8","E8","F8"] },
      submarine: { health: 3, coordinates: ["G3","H3","I3"] },
      destroyer: { health: 2, coordinates: ["J5","J6"] },
    },
    hits: [],
    misses: []
  };

  currentPlayer = player1;
  // assign ship coordinates (static for now, randomly later, then let user choose own if time permitting)
  render();
}

function render() {
  let opponent = currentPlayer === player1 ? player2 : player1;
  for (shot of currentPlayer.hits) {
    boardElement.querySelector(`#${shot}`).style.backgroundColor = "red";
  }
  for (shot of currentPlayer.misses) {
    boardElement.querySelector(`#${shot}`).style.backgroundColor = "yellow";
  }
  for (ship in opponent.ships) {
    if (opponent.ships[ship].health === 0) {
      for (shipCoordinate of opponent.ships[ship].coordinates) {
        boardElement.querySelector(`#${shipCoordinate}`).style.backgroundColor = "#330009";
      }
    }
  }
  messageElement.textContent = `${currentPlayer.name}'s turn`;

  // render ship lists for both sides
}
