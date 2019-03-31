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

const getMark = item => (item.color === "grey" ? " " : "■");

const startGame = (rows = 17, columns = 15) => {
  const global = {
    state: fpTetris.init(rows, columns)
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
      global.state = fpTetris.key(key.name, global.state);
    }
  });

  process.stdin.setRawMode(true);
  process.stdin.resume();

  const format = ary =>
    ary.map(r => r.map(item => getMark(item)).join(" ")).join("\r\n");

  global.timer = setInterval(() => {
    global.state = fpTetris.tick(global.state);
    if (!program.full) {
      clear();
    }
    console.log(format(fpTetris.join(global.state)));
  }, 200);
};

const activate = program => {
  if (program.full) {
    startGame(process.stdout.rows - 1, process.stdout.columns / 2 - 1);
  } else {
    startGame();
  }
};

activate(program);
