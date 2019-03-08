#!/usr/bin/env node
const clear = require('clear');
const fpTetris = require('../lib/index.js');
const keypress = require('keypress');

const global = {
  state: fpTetris.initTetrisTable()
};

keypress(process.stdin);

process.stdin.on('keypress', function (ch, key) {
  if (key && key.ctrl && key.name === 'c') {
    process.exit();
  }
  if (key && key.name === 'q') {
    process.exit();
  }
  if (key) {
    global.state = fpTetris.keyTetrisTable(key.name, global.state);
  }
});

process.stdin.setRawMode(true);
process.stdin.resume();

const format = (ary) => {
  return ary.map((r) => (
    r.map((item) => (item.color === 'grey'? ' ' : '■')).join(' ')
  ))
};

global.timer = setInterval(() => {
  global.state = fpTetris.downTetrisTable(global.state);
  clear();
  console.log(format(fpTetris.joinTetrisTable(global.state)));
}, 700);

