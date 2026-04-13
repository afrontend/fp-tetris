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

const KEYS = ["left", "right", "down", "up", "space"];
const MAX_KEYS = 50;
const TICK_INTERVAL = 200;
const KEY_EVERY_N_TICKS = 3;

let state = game.init({ rows: 17, columns: 17 });
let keyCount = 0;
let tickCount = 0;

const timer = setInterval(() => {
  if (tickCount % KEY_EVERY_N_TICKS === 0 && keyCount < MAX_KEYS) {
    const randomKey = KEYS[Math.floor(Math.random() * KEYS.length)];
    state = game.key(randomKey, state);
    keyCount++;
  }

  state = game.tick(state);
  tickCount++;

  clear();
  console.log(format(game.join(state)));

  if (keyCount >= MAX_KEYS && tickCount >= MAX_KEYS * KEY_EVERY_N_TICKS + 15) {
    clearInterval(timer);
    process.exit(0);
  }
}, TICK_INTERVAL);
