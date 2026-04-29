#!/usr/bin/env node
const clear = require("clear");
const keypress = require("keypress");
const { program } = require("commander");
const game = require("../lib/index.js");
const pkg = require("../package.json");
const chalk = require("chalk");

program
  .version(pkg.version)
  .option("-f, --full", "terminal full size")
  .parse(process.argv);

function getColorItem(item, char) {
  if (chalk[item.color]) {
    return chalk[item.color](char);
  }
  return chalk.blue(char);
}

const getMark = (item) => {
  return game.isBlank(item) ? "." : getColorItem(item, "■");
};

const dump = (state) => {
  console.log(JSON.stringify(state));
};

const save = (gameCtx) => {
  gameCtx.savedState = structuredClone(gameCtx.state);
};

const reload = (gameCtx) => {
  gameCtx.state = gameCtx.savedState;
};

const HELP_TEXT = [
  "",
  "  Controls:",
  "  ← →      Move left / right",
  "  ↓         Move down",
  "  ↑         Rotate piece",
  "  Space     Hard drop",
  "  p         Pause / resume",
  "  r         Rotate background",
  "  s         Save state",
  "  l         Load state",
  "  h         Toggle this help",
  "  q / ^C    Quit",
].join("\r\n");

const startGame = ({ rows, columns, state } = { rows: 17, columns: 17 }) => {
  const gameCtx = {
    state: game.init({ rows, columns, state }),
    showHelp: false,
  };

  keypress(process.stdin);

  process.stdin.on("keypress", (ch, key) => {
    if (key && key.ctrl && key.name === "c") {
      process.exit();
    } else if (key && key.name === "q") {
      process.exit();
    } else if (key && key.name === "h") {
      gameCtx.showHelp = !gameCtx.showHelp;
    } else if (key && key.name === "s") {
      save(gameCtx);
    } else if (key && key.name === "l") {
      reload(gameCtx);
    } else if (key && key.ctrl && key.name === "d") {
      dump(gameCtx.state);
      process.exit();
    } else if (key) {
      gameCtx.state = game.key(key.name, gameCtx.state);
    }
  });

  process.stdin.setRawMode(true);
  process.stdin.resume();

  const format = (ary) =>
    ary.map((r) => r.map((item) => getMark(item)).join(" ")).join("|\r\n");

  gameCtx.timer = setInterval(() => {
    if (!gameCtx.showHelp) {
      gameCtx.state = game.tick(gameCtx.state);
    }
    if (!program.opts().full) {
      clear();
    }
    console.log(format(game.join(gameCtx.state)));
    if (gameCtx.showHelp) {
      console.log(HELP_TEXT);
    }
  }, 200);
};

const activate = () => {
  if (program.opts().full) {
    startGame({
      rows: process.stdout.rows - 1,
      columns: Math.floor(process.stdout.columns / 2) - 1,
    });
  } else {
    startGame();
  }
};

activate();
