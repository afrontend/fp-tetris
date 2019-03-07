const clear = require('clear');
const fpTetris = require('../lib/index.js')


const global = {
  state: fpTetris.initTetrisTable()
};

const format = (ary) => {
  return ary.map((r) => (
    r.map((item) => (item.color === 'grey'? '-' : 'X'))
  ))
};

global.timer = setInterval(() => {
  global.state = (fpTetris.downTetrisTable(global.state));
  clear();
  console.log(format(fpTetris.tetrisTable(global.state)));
}, 700);

  /*
    * keyboard.keyPressed(e => {
    *   setTimeout(() => {
    *     this.setState((state) => (keyTetrisTable(e.which, state)));
    *   });
    * });
    */

