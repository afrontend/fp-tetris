#!/usr/bin/env node
const clear = require("clear");
const keypress = require("keypress");
const program = require("commander");
const fpTetris = require("../lib/index.js");
const pkg = require("../package.json");

program
  .version(pkg.version)
  .option("-f, --full", "terminal full size")
  .parse(process.argv);

const startGame = (rows = 17, columns = 15) => {
  const global = {
    state: fpTetris.initTetrisTable(rows, columns)
  };

  keypress(process.stdin);

  process.stdin.on("keypress", (ch, key) => {
    if (key && key.ctrl && key.name === "c") {
      process.exit();
    }
    if (key && key.name === "q") {
      process.exit();
    }
    if (key) {
      global.state = fpTetris.keyTetrisTable(key.name, global.state);
    }
  });

  process.stdin.setRawMode(true);
  process.stdin.resume();

  const format = ary =>
    ary.map(r => r.map(item => (item.color === "grey" ? " " : "■")).join(" "));

  global.timer = setInterval(() => {
    global.state = fpTetris.downTetrisTable(global.state);
    clear();
    console.log(format(fpTetris.joinTetrisTable(global.state)));
  }, 300);
};

const activate = program => {
  if (program.full) {
    startGame(process.stdout.rows - 2, process.stdout.columns / 2 - 4);
  } else {
    startGame();
  }
};

activate(program);
