#!/usr/bin/env node
"use strict";

const clear = require("clear");
const game = require("../lib/index.js");
const chalk = require("chalk");

function getColorItem(item, char) {
  if (chalk[item.color]) {
    return chalk[item.color](char);
  }
  return chalk.blue(char);
}

const getMark = item => (game.isBlank(item) ? "." : getColorItem(item, "■"));

const format = ary =>
  ary.map(r => r.map(item => getMark(item)).join(" ")).join("|\r\n");

const TICK_INTERVAL = 150;
const MAX_PIECES = 30;

// Count non-blank cells in the background panel
function countFilled(bgPanel) {
  return bgPanel.reduce(
    (sum, row) => sum + row.filter(item => !game.isBlank(item)).length,
    0
  );
}

// Evaluate a board state using classic Tetris AI heuristics
function evaluate(bgPanel, linesCleared) {
  const rows = bgPanel.length;
  const cols = bgPanel[0].length;

  // Column heights
  const heights = Array(cols).fill(0);
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (!game.isBlank(bgPanel[r][c])) {
        heights[c] = rows - r;
        break;
      }
    }
  }

  const aggregateHeight = heights.reduce((a, b) => a + b, 0);

  // Holes: empty cells with at least one filled cell above them
  let holes = 0;
  for (let c = 0; c < cols; c++) {
    let blockFound = false;
    for (let r = 0; r < rows; r++) {
      if (!game.isBlank(bgPanel[r][c])) {
        blockFound = true;
      } else if (blockFound) {
        holes++;
      }
    }
  }

  // Bumpiness: sum of absolute differences between adjacent column heights
  let bumpiness = 0;
  for (let c = 0; c < cols - 1; c++) {
    bumpiness += Math.abs(heights[c] - heights[c + 1]);
  }

  return (
    -0.51 * aggregateHeight +
    0.76 * linesCleared -
    0.36 * holes -
    0.18 * bumpiness
  );
}

// Find the best sequence of keys for the current piece
function getBestMove(state) {
  const cols = game.join(state)[0].length;
  let bestScore = -Infinity;
  let bestKeys = [];

  for (let rot = 0; rot < 4; rot++) {
    // Apply rotations
    let rotState = state;
    for (let i = 0; i < rot; i++) {
      rotState = game.key("up", rotState);
    }

    // Move to leftmost possible position
    let leftState = rotState;
    for (let i = 0; i < cols; i++) {
      leftState = game.key("left", leftState);
    }

    // Try every column position by stepping right
    let posState = leftState;
    for (let r = 0; r <= cols; r++) {
      // Compute lines cleared: all Tetris pieces have 4 cells,
      // so (beforeFilled + 4 - afterFilled) / cols = lines cleared
      const beforeFilled = countFilled(posState.bgPanel);
      const dropped = game.key("space", posState);
      const afterFilled = countFilled(dropped.bgPanel);
      const linesCleared = Math.round((beforeFilled + 4 - afterFilled) / cols);

      const score = evaluate(dropped.bgPanel, linesCleared);

      if (score > bestScore) {
        bestScore = score;
        bestKeys = [
          ...Array(rot).fill("up"),
          ...Array(cols).fill("left"),
          ...Array(r).fill("right"),
          "space"
        ];
      }

      posState = game.key("right", posState);
    }
  }

  return bestKeys;
}

let state = game.init({ rows: 17, columns: 17 });
let moveQueue = [];
let piecesPlaced = 0;

const timer = setInterval(() => {
  if (moveQueue.length === 0) {
    moveQueue = getBestMove(state);
  }

  const nextKey = moveQueue.shift();
  state = game.key(nextKey, state);

  if (nextKey === "space") {
    piecesPlaced++;
    if (piecesPlaced >= MAX_PIECES) {
      clearInterval(timer);
      process.exit(0);
    }
  }

  clear();
  console.log(format(game.join(state)));
}, TICK_INTERVAL);
