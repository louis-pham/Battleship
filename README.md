# Battleship

## Overview
This is a browser-based version of the popular game __Battleship__.

The player chooses their name and the opponent's (the computer). Afterwards, the player will put down their 5 ships:

| Ship Name     | Health |
| ------------- |:------:|
| Carrier       | 5      |
| Battleship    | 4      |
| Cruiser       | 3      |
| Submarine     | 3      |
| Destroyer     | 2      |

The player will then face the computer in taking down each other's ships. For each turn, the player chooses a coordinate on the computer's board to hit their ships (and likewise for the computer). Whoever takes down all of the opponent's ships will be the winner!


## Screenshots
![battleship game screenshot](https://i.imgur.com/uEH6ehN.png)

## Technologies Used
- HTML
- CSS
- JavaScript (ES6)

## Getting Started
Play a live demo [here](https://battleship.lcpham.now.sh/)!

To run it locally, simply clone the repository and open the `index.html` file in a browser.

## Next Steps
- sanitize user input
- improve styling
- fine tune AI for weird edge cases
- improve overall user experience
  - when placing ships (e.g. removing a misplaced head coordinate)
- browser compatibility testing
