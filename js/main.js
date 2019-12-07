/*----- constants -----*/
const ROWS = ["A","B","C","D","E","F","G","H","I","J"];
const COLUMNS = [0,1,2,3,4,5,6,7,8,9];
const DIRECTIONS = [
   1, // north
   2, // east
  -1, // south
  -2  // west
];
const TURNTIMEOUT = 500;
const SHIPS = {
  "carrier": { health: 5 },
  "battleship": { health: 4 },
  "cruiser": { health: 3 },
  "submarine": { health: 3 },
  "destroyer": { health: 2 }
};
// used to keep track of ships when user is placing
const SHIPNAMES = Object.keys(SHIPS);

/*----- app's state (variables) -----*/
// variables for when user is placing ships; store previous head coordinate to remove styling later
let pageCount;
let isPlacingShips, currentCoordinateChosen, currentPlacingShipIndex, previousCoordinateChosen;
let currentPlayer, player1, player2, winner, isRendering;

/*----- cached element references -----*/
let modalElement = document.querySelector(".modal");
let modalChangeButtonElement = document.querySelector("#modal-change");
let bodyElement = document.querySelector("body");
let loadingElement = document.querySelector("#loading");
let boardElement = document.querySelector("#board");
let messageElement = document.querySelector("#message");
let minimapElement = document.querySelector("#minimap");
let player1Info = document.querySelector("#player1-info");
let player1NameElement = document.querySelector("#player1-name");
let player1ShipListElement = document.querySelector("#player1-info .ship-list");
let player2Info = document.querySelector("#player2-info");
let player2NameElement = document.querySelector("#player2-name");
let player2ShipListElement = document.querySelector("#player2-info .ship-list");

/*----- event listeners -----*/
modalChangeButtonElement.addEventListener("click", () => {
  pageCount += 1;
  renderModal();
});
boardElement.addEventListener("click", shipPlacementHandler);
document.addEventListener("keydown", shipDirectionHandler);
// the event handler for board clicks (registerGameListener) will be called at a later time

/*----- functions -----*/
init();

function init() {
  generateBoardAndMinimap();

  player1 = {
    name: "💃 Player 1 🕺",
    ships: {},
    hits: [],
    misses: []
  };

  player2 = {
    name: "🤖 Player 2 🤖",
    ships: {},
    hits: [],
    misses: [],
    searchArray: [],
    hitDuringSearch: [],
    deadShips: []
  };

  pageCount = 1;

  isRendering = false;
  winner = null;
  isPlacingShips = true;

  if (!isPlacingShips) {
    boardElement.removeEventListener("click", shipPlacementHandler);
    document.removeEventListener("keydown", shipDirectionHandler);
    startGame();
  } else {
    currentCoordinateChosen = null;
    currentPlacingShipIndex = 0;
  }

  render();
  setTimeout(() => {
    loadingElement.addEventListener("animationend", () => {
      loadingElement.style.display = "none";
    });
    loadingElement.classList.add("fade-out");
  }, 2000);
}

function registerGameListener() {
  boardElement.addEventListener("click", gameBoardHandler);
}

function generateBoardAndMinimap() {
  // add nulls to make space for headers
  let allRows = [null].concat(ROWS);
  let allColumns = [null].concat(COLUMNS);
  for (row of allRows) {
    for (column of allColumns) {
      let cell = document.createElement("div");
      if (row === null) {
        cell.classList.add("grid-header");
        // this is the top header
        if (column === null) {
          cell.textContent = " ";
        } else {
          cell.textContent = column;
        }
      } else {
        if (column === null) {
          // this is the header column displaying letters
          cell.classList.add("grid-header");
          cell.textContent = row;
        } else {
          // this is water
          cell.classList.add("cell");
          cell.id = `${row}${column}`;

          let minimapCell = document.createElement("div");
          minimapCell.classList.add("cell");
          minimapCell.id = `m${row}${column}`;
          minimapElement.append(minimapCell);
        }
      }
      boardElement.append(cell);
    }
  }
}

function startGame() {
  placeShips(player2);
  player1NameElement.textContent = player1.name;
  player1ShipListElement.innerHTML = player1.ships;
  player2NameElement.textContent = player2.name;
  player2ShipListElement.innerHTML = player2.ships;
  currentPlayer = player1;
  registerGameListener();
  render();
}

function shipPlacementHandler(e) {
  if (e.target.classList.contains("cell")){
    if (isPlacingShips && !currentCoordinateChosen) {
      previousCoordinateChosen = null;
      currentCoordinateChosen = e.target.id;
      render();
    }
  }
}

function shipDirectionHandler(e) {
  if (currentCoordinateChosen) {
    let direction = null;
    switch (e.code) {
      case "ArrowLeft":
        direction = -2;
        break;
      case "ArrowUp":
        direction = 1;
        break;
      case "ArrowRight":
        direction = 2;
        break;
      case "ArrowDown":
        direction = -1;
        break;
    }
    if (direction) {
      let currentShip = SHIPNAMES[currentPlacingShipIndex];
      let shipCoordinates = getSpanningCoordinates(currentCoordinateChosen, direction, SHIPS[currentShip].health);
      if (shipCoordinates) {
        let overlapFound = isOverlapping(shipCoordinates, currentShip, player1.ships);
        if (!overlapFound) {
          // valid position for ship, add to player's ships
          player1.ships[currentShip] = {
            health: SHIPS[currentShip].health,
            coordinates: shipCoordinates
          };
          previousCoordinateChosen = currentCoordinateChosen;
          currentCoordinateChosen = null;
          currentPlacingShipIndex += 1;
        } else {
          // overlap found
          alert("choose a different location!!!");
          previousCoordinateChosen = currentCoordinateChosen;
          currentCoordinateChosen = null;
        }
        render();
      }
    }
    if (currentPlacingShipIndex === SHIPNAMES.length) {
      isPlacingShips = false;
      boardElement.removeEventListener("click", shipPlacementHandler);
      boardElement.removeEventListener("keydown", shipDirectionHandler);
      startGame();
    }
  }
}

function gameBoardHandler(e) {
  if ( !winner
    && currentPlayer === player1
    && !isRendering
    && !isPlacingShips
    && player1.hits.indexOf(e.target.id) === -1
    && player1.misses.indexOf(e.target.id) === -1
    && e.target.classList.contains("cell")) {
    isRendering = true;
    registerShot(e.target.id);
    if (!winner) {
      setTimeout(() => {
        currentPlayer = player2;
        render();
        setTimeout(doPlayer2, TURNTIMEOUT);
        isRendering = false;
      }, TURNTIMEOUT);
    }
  }
}

function doPlayer2() {
  /*
    BASIC OVERVIEW OF AI:
    if their is no info on ship whereabouts, fire randomly until there is a hit
    upon finding a hit, store all the coordinate around it to be looked at some time in the future
    check surroundings and if we find a hit, add the one next to it in the same direction
    keep going until the ship has been sunk or we hit water
    if it hits water, check the opposite end along the string of hits
    on the other hand, if the ship is sunk, then there's several options from here:
      1. there were no other hits along that string that DIDN'T destroy the ship -- i.e. every hit along the search contributed to the destruction of that ship -- in this case we go back to shooting randomly
      2. we may have found other hits along our search for the recently sunken ship -- use one of those as a new starting point to search again
  */
  let shotCoordinate;
  let shotDirection;
  if (player2.searchArray.length === 0) {
    let validShotFound = false;
    if (player2.hitDuringSearch.length > 0) {
      // for whatever reason, our search "finished" but there are still hits unaccounted for
      let surroundingsToSearch = getSurroundingCoordinates(player2.hitDuringSearch.pop());
      player2.searchArray = player2.searchArray.concat(surroundingsToSearch);
      if (player2.searchArray.length > 0) {
        [shotCoordinate, shotDirection] = player2.searchArray.pop();
        validShotFound = true;
      }
    }
    while (!validShotFound) {
      shotCoordinate = getRandomCoordinate();
      if (player2.hits.indexOf(shotCoordinate) === -1
          && player2.misses.indexOf(shotCoordinate) === -1 ) {
        validShotFound = true;
      }
    }
  } else {
    [shotCoordinate, shotDirection] = player2.searchArray.pop();
  }
  renderSelectedShot(shotCoordinate);
  let hitLanded = registerShot(shotCoordinate);
  let nextCoordinate;

  if (hitLanded) {
    player2.hitDuringSearch.push(shotCoordinate);
    if (player1.ships[hitLanded].health === 0) {
      // ship has been destroyed
      player2.deadShips.push(...player1.ships[hitLanded].coordinates);
      player2.searchArray = [];
      // filter out hits that contributed to ship sinking
      player2.hitDuringSearch = player2.hitDuringSearch.filter(coordinate => player1.ships[hitLanded].coordinates.indexOf(coordinate) === -1);

      if (player2.hitDuringSearch.length > 0) {
        player2.searchArray = player2.searchArray.concat(getSurroundingCoordinates(player2.hitDuringSearch[0]));
      } else {
        player2.hitDuringSearch = [];
      }
    } else {
      // ship still alive
      if (shotDirection) {
        // go the same direction, if we cant go in that direction anymore, go the other way of initial hit
        nextCoordinate = getAdjacentCoordinate(shotCoordinate, shotDirection);
        // since push takes an array and adds each element of it to the existing array, we add an empty array first and push the coordinate and shotdirection to the empty array
        if (nextCoordinate
          && player2.hits.indexOf(nextCoordinate) === -1
          && player2.misses.indexOf(nextCoordinate) === -1) {
          player2.searchArray.push([]);
          player2.searchArray[player2.searchArray.length - 1].push(nextCoordinate, shotDirection);
        }
      } else {
        // random shot that led to a hit - add all the valid surrounding coordinates
        let surroundingCoordinates = getSurroundingCoordinates(shotCoordinate);
        player2.searchArray = player2.searchArray.concat(surroundingCoordinates);
      }
    }
  } else {
    // missed shot
    if (shotDirection) {
        if (getCoordinateDistance(shotCoordinate, player2.hitDuringSearch[0]) >= 2) {
          nextCoordinate =  getAdjacentCoordinate(shotCoordinate, -shotDirection);
          // if this coordinate is already in the search array, remove it since we want to prioritize it on the next turn
          let pendingSearchIndex = -1;
          for (pendingSearch of player2.searchArray) {
            pendingSearchIndex += 1;
            if (pendingSearch[0] === nextCoordinate) break;
          }
          if (pendingSearchIndex < player2.searchArray.length) player2.searchArray.splice(pendingSearchIndex, 1);

          if (nextCoordinate
            && player2.deadShips.indexOf(nextCoordinate) === -1
            && player2.misses.indexOf(nextCoordinate) === -1) {
            player2.searchArray.push([]);
            player2.searchArray[player2.searchArray.length - 1].push(nextCoordinate, -shotDirection);
          }
        }
    }
  }
  setTimeout(() => {
    document.querySelector(`#${shotCoordinate}`).classList.remove("selected-shot");
  },200);
  if (!winner) setTimeout(() => {
    currentPlayer = player1;
    render();
  }, TURNTIMEOUT * 1.5);
}

function filterSearches(coordinate) {
  return player1.ships[hitLanded].coordinates.indexOf(coordinate) === -1;
}

function registerShot(coordinate) {
  let opponent = currentPlayer === player1 ? player2 : player1;
  let hitLanded = null;
  shipCoordinateCheck:
  // check if the hit is in one of the opponent's ships' coordinates
  for (ship in opponent.ships) {
    for (shipCoordinate of opponent.ships[ship].coordinates) {
      if (coordinate === shipCoordinate) {
        hitLanded = ship;
        currentPlayer.hits.push(coordinate);
        opponent.ships[ship].health--;
        break shipCoordinateCheck;
      }
    }
  }
  if (!hitLanded) {
    currentPlayer.misses.push(coordinate);
  } else {
    // check for winner
    let remainingShips = Object.keys(opponent.ships).length;
    for (ship in opponent.ships) {
      if (opponent.ships[ship].health === 0) remainingShips -= 1;
    }
    if (remainingShips === 0) winner = currentPlayer;
  };
  render();
  return hitLanded;
}

// stolen from https://stackoverflow.com/a/2450976
function shuffle(array) {
  let currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

function getRandomCoordinate() {
  return ROWS[Math.floor(Math.random()*ROWS.length)] + COLUMNS[Math.floor(Math.random()*COLUMNS.length)];
}

function getSpanningCoordinates(headCoordinate, direction, health) {
  // vertical variables
  let columnCoordinate, headRowIndex, tailRowIndex;
  // horizontal variables
  let rowCoordinate, headColumnIndex, tailColumnIndex;
  // if the coordinates go out of bounds, return undefined, otherwise return an array of coordinates
  switch (direction) {
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

function getSurroundingCoordinates(centerCoordinate) {
  let surroundingCoordinates = [];
  // randomize the order to prevent bias searching in one circular direction
  for (direction of shuffle(DIRECTIONS)) {
    let possibleCoordinate = getAdjacentCoordinate(centerCoordinate, direction);
    if (possibleCoordinate
      && player2.hits.indexOf(possibleCoordinate) === -1
      && player2.misses.indexOf(possibleCoordinate) === -1) {
      surroundingCoordinates.push([]);
      surroundingCoordinates[surroundingCoordinates.length - 1].push(possibleCoordinate, direction);
    }
  }
  return surroundingCoordinates;
}

function getAdjacentCoordinate(centerCoordinate, direction) {
  // check if the coordinate in the given direction is valid
  // return the coordinate if it is, otherwise null
  let centerCoordinateRowIndex = ROWS.indexOf(centerCoordinate.charAt(0));
  let centerCoordinateColumn = parseInt(centerCoordinate.charAt(1));

  let adjacentCoordinate;
  let adjacencyOffset = 0;
  while (!adjacentCoordinate) {
    adjacencyOffset += 1;
    switch (direction) {
      case 1: // north
        if (centerCoordinateRowIndex - adjacencyOffset < 0) return null;
        adjacentCoordinate = ROWS[centerCoordinateRowIndex - adjacencyOffset] + centerCoordinateColumn;
        break;
      case -1: // south
        if (centerCoordinateRowIndex + adjacencyOffset >= ROWS.length) return null;
        adjacentCoordinate = ROWS[centerCoordinateRowIndex + adjacencyOffset] + centerCoordinateColumn;
        break;
      case -2: // west
        if (centerCoordinateColumn - adjacencyOffset  < 0) return null;
        adjacentCoordinate = ROWS[centerCoordinateRowIndex] + (centerCoordinateColumn - adjacencyOffset);
        break;
      case 2: // east
        if (centerCoordinateColumn + adjacencyOffset  >= COLUMNS.length) return null;
        adjacentCoordinate = ROWS[centerCoordinateRowIndex] + (centerCoordinateColumn + adjacencyOffset);
        break;
    }
    // if this adjacent coordinate was already a hit, then jump over it
    if (player2.hitDuringSearch.indexOf(adjacentCoordinate) >= 0) {
      adjacentCoordinate = null;
    }
  }
  return adjacentCoordinate;
}

function getCoordinateDistance(coordinateA, coordinateB) {
  if (coordinateA.charAt(0) === coordinateB.charAt(0)) {
    // in the same row, check column difference
    return Math.abs(parseInt(coordinateB.charAt(1)) - parseInt(coordinateA.charAt(1)));
  } else {
    // in the same column
    return Math.abs(parseInt(ROWS.indexOf(coordinateB.charAt(0))) - parseInt(ROWS.indexOf(coordinateA.charAt(0))));
  }
}

function placeShips(player) {
  for (ship in SHIPS) {
    let openSpotFound = false;
    while (!openSpotFound) {
      let headCoordinate = getRandomCoordinate();
      let direction = DIRECTIONS[Math.floor(Math.random()*DIRECTIONS.length)];
      let spanningCoordinates = getSpanningCoordinates(headCoordinate, direction, SHIPS[ship].health);
      if (spanningCoordinates) {
        // check the coordinates the ship will span over (no overlaps, out of bounds)
        let overlapFound = isOverlapping(spanningCoordinates, ship, player.ships);
        if (!overlapFound) {
          player.ships[ship] = {
            health: SHIPS[ship].health,
            coordinates: spanningCoordinates
          };
          openSpotFound = true;
        }
      }
    }
  }
}

function isOverlapping(spanningCoordinates, shipName, ships) {
  let overlapFound = false;
  overlapCheck:
  for (otherShip in ships) {
    if (shipName !== otherShip) {
      for (coordinate of spanningCoordinates) {
        if (ships[otherShip].coordinates.indexOf(coordinate) >= 0) {
          overlapFound = true;
          break overlapCheck;
        }
      }
    }
  }
  return overlapFound;
}

function renderMinimap() {
  for (ship in player1.ships) {
    let currentShip = player1.ships[ship];
    let shipColour;
    for (coordinate of player2.misses) {
      minimapElement.querySelector(`#m${coordinate}`).classList.add("miss");
    }
    for (coordinate of currentShip.coordinates) {
      if (currentShip.health === 0) {
        shipColour = "dead";
      } else {
        shipColour = player2.hits.indexOf(coordinate) >= 0 ? "hit" : "alive";
      }
      minimapElement.querySelector(`#m${coordinate}`).classList.add(shipColour);
    }
  }
}

function renderShipList(player) {
  let htmlString = "";
  for (ship in player.ships) {
    let shipColour = "alive";
    if (player.ships[ship].health < SHIPS[ship].health && player === player1) {
      shipColour = "hit";
    }
    if (player.ships[ship].health === 0) {
      shipColour = "dead";
    }
    htmlString += `<li class="${shipColour}">${ship}</li>`;
  }
  return htmlString;
}

function renderWinner() {
  if (winner) {
    messageElement.textContent = `The winner is ${winner.name}!`;
    bodyElement.classList.add("winner-found");
    boardElement.style.opacity = "0.3";
  }
}

function renderSelectedShot(coordinate) {
  let shotElement = boardElement.querySelector(`#${coordinate}`);
  shotElement.classList.add("selected-shot");
}

function renderModal() {
  if (pageCount > 4) {
    modalElement.classList.add("fade-out");
    modalElement.addEventListener("animationend", () => {
      modalElement.style.display = "none";
      bodyElement.style.overflow = "auto";
    });
  } else {
    let currentPageElement = document.querySelector(`#page-${pageCount - 1}`);
    let nextPageElement = document.querySelector(`#page-${pageCount}`);
    currentPageElement.classList.remove("page-current");
    nextPageElement.classList.add("page-current");
  }
  if (pageCount === 3) {
    let customPlayer1Name = document.querySelector("#player1-name-input").value;
    player1.name = customPlayer1Name === "" ? "Player 1" : customPlayer1Name;
    document.querySelector("#page-3 h3").innerHTML = `That's right! Your name is <b>${player1.name}</b>!
    By the way, what's your opponent's name again?`;
  } else if (pageCount === 4) {
    let customPlayer2Name = document.querySelector("#player2-name-input").value;
    player2.name = customPlayer2Name === "" ? "Player 2" : customPlayer2Name;
    document.querySelector("#page-4 h3").innerHTML = `That's right! It was <b>${player2.name}</b>!
    Alright, go out there and <span class="strikeout">catch</span> find 'em all'!`;
    modalChangeButtonElement.textContent = "Finish";
    modalChangeButtonElement.style.backgroundColor = "#8dd684";
  }
}

function render() {
  if (currentPlayer === player1) {
    player1Info.classList.add("player-current");
    player2Info.classList.remove("player-current");
  } else if (currentPlayer === player2) {
    player1Info.classList.remove("player-current");
    player2Info.classList.add("player-current");
  }
  if (isPlacingShips) {
    messageElement.innerHTML = `Choose a starting coordinate for your <b>${SHIPNAMES[currentPlacingShipIndex]} (${currentPlacingShipIndex < SHIPNAMES.length ? SHIPS[SHIPNAMES[currentPlacingShipIndex]].health : ""} spaces)</b>`;
    if (currentCoordinateChosen) {
      messageElement.innerHTML = `Choose a direction for your <b>${SHIPNAMES[currentPlacingShipIndex]}</b> by pressing a <b>directional arrow key (${currentPlacingShipIndex < SHIPNAMES.length ? SHIPS[SHIPNAMES[currentPlacingShipIndex]].health : ""} spaces)</b>`;
      boardElement.querySelector(`#${currentCoordinateChosen}`).classList.add("head-coordinate");
    }
    for (ship in player1.ships) {
      for (shipCoordinate of player1.ships[ship].coordinates) {
        boardElement.querySelector(`#${shipCoordinate}`).classList.add("alive");
      }
    }
  } else {
    for (ship in player1.ships) {
      for (shipCoordinate of player1.ships[ship].coordinates) {
        boardElement.querySelector(`#${shipCoordinate}`).classList.remove("alive");
      }
    }
  }
  if (previousCoordinateChosen) {
    boardElement.querySelector(`#${previousCoordinateChosen}`).classList.remove("head-coordinate");
  }

  let opponent = currentPlayer === player1 ? player2 : player1;
  renderMinimap();
  // reset board to water
  for (shot of opponent.hits) {
    boardElement.querySelector(`#${shot}`).className = "cell water";
  }
  for (shot of opponent.misses) {
    boardElement.querySelector(`#${shot}`).className = "cell water";
  }

  if (currentPlayer) {
    // render currentPlayer's shots
    for (shot of currentPlayer.hits) {
      boardElement.querySelector(`#${shot}`).classList.add("hit");
    }
    for (shot of currentPlayer.misses) {
      boardElement.querySelector(`#${shot}`).classList.add("miss");
    }
    for (ship in opponent.ships) {
      if (opponent.ships[ship].health === 0) {
        for (shipCoordinate of opponent.ships[ship].coordinates) {
          boardElement.querySelector(`#${shipCoordinate}`).classList.add("dead");
        }
      }
    }
    messageElement.innerHTML = `Current player: <b>${currentPlayer.name}</b>`;
    player1ShipListElement.innerHTML = renderShipList(player1);
    player2ShipListElement.innerHTML = renderShipList(player2);
  }
  renderWinner();
}
