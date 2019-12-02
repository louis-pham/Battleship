/*----- constants -----*/
let ROWS = ["A","B","C","D","E","F","G","H","I","J"];
let COLUMNS = [0,1,2,3,4,5,6,7,8,9];
let ORIENTATIONS = [1,2,-1,-2]; // north:1,south:-1,east:2,west:-2
let TIMEOUT = 300;

/*----- app's state (variables) -----*/
let currentPlayer, player1, player2, winner, isRendering;

/*----- cached element references -----*/
let boardElement = document.querySelector("#board");
let messageElement = document.querySelector("#message");
let minimapElement = document.querySelector("#minimap");
let player1NameElement = document.querySelector("#player1-name");
let player1ShipListElement = document.querySelector("#player1-info .ship-list");
let player2NameElement = document.querySelector("#player2-name");
let player2ShipListElement = document.querySelector("#player2-info .ship-list");

/*----- event listeners -----*/
boardElement.addEventListener("click", (e) => {
  /*
  if there's no winner, it's the player's turn, nothing is rendering, the shot hasn't been taken before and it wasn't the board that was clicked,
    check the shot
  */
  if ( !winner
    && currentPlayer === player1
    && !isRendering
    && player1.hits.indexOf(e.target.id) === -1
    && player1.misses.indexOf(e.target.id) === -1
    && e.target.id !== "board" ) {
      isRendering = true;
      registerShot(e.target.id);
      if (!winner) {
        setTimeout(() => {
          currentPlayer = player2;
          render();
          setTimeout(doPlayer2, TIMEOUT);
          isRendering = false;
        }, TIMEOUT);
      }
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
  if (missed) {
    currentPlayer.misses.push(coordinate)
  } else {
    // check for winner
    let remainingShips = Object.keys(opponent.ships).length;
    for (ship in opponent.ships) {
      if (opponent.ships[ship].health === 0) remainingShips -= 1;
    }
    if (remainingShips === 0) winner = currentPlayer;
  };
  render();
}

function getRandomCoordinate() {
  return ROWS[Math.floor(Math.random()*ROWS.length)] + COLUMNS[Math.floor(Math.random()*COLUMNS.length)];
}

function getSpanningCoordinates(headCoordinate, orientation, health) {
  // vertical variables
  let columnCoordinate, headRowIndex, tailRowIndex;
  // horizontal variables
  let rowCoordinate, headColumnIndex, tailColumnIndex;
  // if the coordinates go out of bounds, return undefined, otherwise return an array of coordinates
  switch (orientation) {
    case 1:
      columnCoordinate = headCoordinate.charAt(1);
      // since rows are letters, get index of the ship's row coordinate to properly generate the other coordinates
      headRowIndex = ROWS.indexOf(headCoordinate.charAt(0));
      tailRowIndex = headRowIndex + 1 - health;
      if (tailRowIndex >= 0) {
        return ROWS.slice(tailRowIndex, headRowIndex + 1).map(rowCoordinate => `${rowCoordinate}${columnCoordinate}`);
      }
      break;
    case -1:
      columnCoordinate = headCoordinate.charAt(1);
      headRowIndex = ROWS.indexOf(headCoordinate.charAt(0));
      tailRowIndex = headRowIndex + health;
      if (tailRowIndex <= ROWS.length) {
        return ROWS.slice(headRowIndex, tailRowIndex).map((rowCoordinate) => `${rowCoordinate}${columnCoordinate}`);
      }
      break;
    case -2:
      // for the lateral cases, the index IS the coordinate, so no need to lookup position in COLUMNS array
      rowCoordinate = headCoordinate.charAt(0);
      headColumnIndex = parseInt(headCoordinate.charAt(1));
      tailColumnIndex = headColumnIndex - health + 1;
      if (tailColumnIndex >= 0) {
        return COLUMNS.slice(tailColumnIndex, headColumnIndex + 1).map(columnCoordinate => `${rowCoordinate}${columnCoordinate}`);
      }
      break;
    case 2:
      rowCoordinate = headCoordinate.charAt(0);
      headColumnIndex = parseInt(headCoordinate.charAt(1));
      tailColumnIndex = headColumnIndex + health;
      if (tailColumnIndex <= COLUMNS.length) {
        return COLUMNS.slice(headColumnIndex, tailColumnIndex).map(columnCoordinate => `${rowCoordinate}${columnCoordinate}`);
      }
      break;
  }
}

function doPlayer2() {
  /*
    choose a coordinate not within shots already taken (for now, choose randomly)
    register shot
  */
  let validShotFound = false;
  let shotCoordinate;
  while (!validShotFound) {
    shotCoordinate = getRandomCoordinate();
    if (player2.hits.indexOf(shotCoordinate) === -1
        && player2.misses.indexOf(shotCoordinate) === -1 ) {
      validShotFound = true;
    }
  }
  registerShot(shotCoordinate);
  setTimeout(() => {
    currentPlayer = player1;
    render();
  }, TIMEOUT);
}

function placeShips(player) {
  /*
    choose a head position and orientation
    check the coordinates the ship will span over (no overlaps, out of bounds)
    if they're all good, assign the coordinates
    else, redo
  */
  for (ship in player.ships) {
    let openSpotFound = false;
    while (!openSpotFound) {
      let headCoordinate = getRandomCoordinate();
      let orientation = ORIENTATIONS[Math.floor(Math.random()*ORIENTATIONS.length)];
      let spanningCoordinates = getSpanningCoordinates(headCoordinate, orientation, player.ships[ship].health);
      if (spanningCoordinates) {
        // check for overlaps
        let overlapFound = false;
        overlapCheck:
        for (otherShip in player.ships) {
          if (ship !== otherShip) {
            for (coordinate of spanningCoordinates) {
              if (player.ships[otherShip].coordinates.indexOf(coordinate) >= 0) {
                overlapFound = true;
                break overlapCheck;
              }
            }
          }
        }
        if (!overlapFound) {
          player.ships[ship].coordinates = spanningCoordinates;
          openSpotFound = true;
        }
      }
    }
  }
}

function init() {
  isRendering = false;
  winner = null;
  player1 = {
    name: "💃 Player 1 🕺",
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
    name: "🤖 Player 2 🤖",
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

    // TODO: let player1 choose their own positions
  placeShips(player1);
  placeShips(player2);

  for (ship in player2.ships) {
    console.log(player2.ships[ship].coordinates);
  }
  player1NameElement.textContent = player1.name;
  player1ShipListElement.innerHTML = player1.ships;
  player2NameElement.textContent = player2.name;
  player2ShipListElement.innerHTML = player2.ships;
  currentPlayer = player1;
  render();
}

function renderMinimap() {
  for (ship in player1.ships) {
    let currentShip = player1.ships[ship];
    let shipColor = currentShip.health === 0 ? "red" : "green";
    for (coordinate of currentShip.coordinates) {
      minimapElement.querySelector(`#m${coordinate}`).style.backgroundColor = player2.hits.indexOf(coordinate) >= 0 ? "red" : shipColor;
    }
  }
}

function renderShipList(player) {
  let htmlString = "";
  for (ship in player.ships) {
    let shipColor = "green";
    if (player.ships[ship].health === 0) {
      shipColor = "red";
    }
    htmlString += `<li style="color: ${shipColor}">${ship}</li>`;
  }
  return htmlString;
}

function renderWinner() {
  if (winner) {
    messageElement.textContent = `The winner is ${winner.name}!`;
  }
}

function render() {
  let opponent = currentPlayer === player1 ? player2 : player1;
  renderMinimap();
  // reset board to water
  for (shot of opponent.hits) {
    boardElement.querySelector(`#${shot}`).style.backgroundColor = "lightblue";
  }
  for (shot of opponent.misses) {
    boardElement.querySelector(`#${shot}`).style.backgroundColor = "lightblue";
  }

  // render currentPlayer's shots
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
  messageElement.textContent = `Current player: ${currentPlayer.name}`;
  player1ShipListElement.innerHTML = renderShipList(player1);
  player2ShipListElement.innerHTML = renderShipList(player2);
  renderWinner();
}
