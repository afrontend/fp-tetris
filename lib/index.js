const p = require("fp-panel");

const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((v, f) => f(v), x);

const isFunction = (v) => typeof v === "function";
const randomIndex = (len) => Math.floor(Math.random() * len);

// ---------------------------------------------------------------------------
// Mutable game state shared across calls.
// count: total rows cleared so far (stored here and embedded in the panel).
// pause: whether the game is currently paused.
// ---------------------------------------------------------------------------
const GLOBAL = {
  color: "grey",
  count: 0,
  pause: false,
};

// Panel functions

// Creates an array of `len` elements. If fnOrObject is a function it is
// called for each element; otherwise the value is deep-cloned each time.
const createArray = (len, fnOrObject) =>
  Array.from({ length: len }, () =>
    isFunction(fnOrObject) ? fnOrObject() : structuredClone(fnOrObject),
  );

const getEmptyRow = (columns) =>
  createArray(columns, p.createItem(GLOBAL.color));

// Stateful factory: remembers the last-used rows/columns so that
// createPanel() (no args) re-creates a panel with the previous dimensions.
const createPanel = (() => {
  let savedRows = 0;
  let savedColumns = 0;
  return (rows, columns) => {
    savedRows = rows ? rows : savedRows;
    savedColumns = columns ? columns : savedColumns;
    return p.createPanel(savedRows, savedColumns);
  };
})();

const getEmptyRows = (count, columns) =>
  createArray(count, getEmptyRow(columns));

const isPaused = () => GLOBAL.pause === true;

// Returns true when a row still has at least one blank cell (i.e. not full).
const isNotFullRow = (row) => row.some(p.isBlankItem);

// Remove full rows from panel

const addEmptyRow = (panel, rows) => {
  const newPanel = structuredClone(panel);
  const columns = newPanel[0].length;
  const count = rows - newPanel.length;
  GLOBAL.count += count;
  newPanel.unshift(...getEmptyRows(count, columns));
  newPanel.at(-1).at(-1).count = GLOBAL.count;
  return newPanel;
};

// Removes all full rows and replaces them with empty rows at the top.
const removeFullRows = (panel) => {
  const rows = panel.length;
  const newPanel = structuredClone(panel).filter(isNotFullRow);
  return addEmptyRow(newPanel, rows);
};

// Paint on panel

const paintO = (panel) =>
  p.paint(
    panel,
    [
      { row: 0, column: 0, zeroPoint: true },
      { row: 0, column: 1, zeroPoint: true },
      { row: 1, column: 0, zeroPoint: true },
      { row: 1, column: 1, zeroPoint: true },
    ],
    "yellow",
  );

const paintI = (panel) =>
  p.paint(
    panel,
    [
      { row: 0, column: 0 },
      { row: 0, column: 1, zeroPoint: true },
      { row: 0, column: 2 },
      { row: 0, column: 3 },
    ],
    "cyan",
  );

const paintT = (panel) =>
  p.paint(
    panel,
    [
      { row: 0, column: 1 },
      { row: 1, column: 0 },
      { row: 1, column: 1, zeroPoint: true },
      { row: 1, column: 2 },
    ],
    "magenta",
  );

const paintJ = (panel) =>
  p.paint(
    panel,
    [
      { row: 0, column: 2 },
      { row: 1, column: 0 },
      { row: 1, column: 1, zeroPoint: true },
      { row: 1, column: 2 },
    ],
    "white",
  );

const paintL = (panel) =>
  p.paint(
    panel,
    [
      { row: 0, column: 0 },
      { row: 1, column: 0 },
      { row: 1, column: 1, zeroPoint: true },
      { row: 1, column: 2 },
    ],
    "blue",
  );

const paintS = (panel) =>
  p.paint(
    panel,
    [
      { row: 0, column: 1, zeroPoint: true },
      { row: 0, column: 2 },
      { row: 1, column: 0 },
      { row: 1, column: 1 },
    ],
    "green",
  );

const paintZ = (panel) =>
  p.paint(
    panel,
    [
      { row: 0, column: 0 },
      { row: 0, column: 1, zeroPoint: true },
      { row: 1, column: 1 },
      { row: 1, column: 2 },
    ],
    "red",
  );

// Each entry is a factory function that creates a panel with one tetromino.
const pieceFactories = [
  pipe(createPanel, paintO, p.adjustToCenter),
  pipe(createPanel, paintI, p.adjustToCenter),
  pipe(createPanel, paintT, p.adjustToCenter),
  pipe(createPanel, paintJ, p.adjustToCenter),
  pipe(createPanel, paintL, p.adjustToCenter),
  pipe(createPanel, paintS, p.adjustToCenter),
  pipe(createPanel, paintZ, p.adjustToCenter),
];

// Make tool panel

const createRandomToolPanel = (bgPanel) => {
  const toolPanel = pieceFactories[randomIndex(pieceFactories.length)]();
  const overlap = bgPanel ? p.isOverlap(bgPanel, toolPanel) : false;
  return overlap ? createPanel() : toolPanel;
};

// Process event

// Counts the number of non-blank (colored) cells in a panel.
// Used when rotating to detect clipping: if the count changes, the rotation
// pushed cells outside the panel boundaries and should be rejected.
const countFilledCells = (panel) =>
  panel.flat().reduce((sum, item) => sum + (p.isItem(item) ? 1 : 0), 0);

const pauseKey = ({ bgPanel, toolPanel }) => {
  GLOBAL.pause = !isPaused();
  return {
    bgPanel,
    toolPanel,
  };
};

const hardDrop = ({ bgPanel, toolPanel }) => {
  while (
    !p.isOnTheBottomEdge(toolPanel) &&
    !p.isOverlap(bgPanel, p.down(toolPanel))
  ) {
    toolPanel = p.down(toolPanel);
  }
  const newBgPanel = p.add([bgPanel, toolPanel]);
  return {
    bgPanel: removeFullRows(newBgPanel),
    toolPanel: createRandomToolPanel(newBgPanel),
  };
};

const leftKey = ({ bgPanel, toolPanel }) => {
  const overlap =
    p.isOnTheLeftEdge(toolPanel) || p.isOverlap(bgPanel, p.left(toolPanel));
  return {
    bgPanel,
    toolPanel: overlap ? toolPanel : p.left(toolPanel),
  };
};

const upKey = ({ bgPanel, toolPanel }) => {
  const rotatedToolPanel = p.rotate(toolPanel);
  const overlap =
    countFilledCells(toolPanel) !== countFilledCells(rotatedToolPanel) ||
    p.isOverlap(bgPanel, rotatedToolPanel);
  return {
    bgPanel,
    toolPanel: overlap ? toolPanel : rotatedToolPanel,
  };
};

const rightKey = ({ bgPanel, toolPanel }) => {
  const overlap =
    p.isOverlap(bgPanel, p.right(toolPanel)) || p.isOnTheRightEdge(toolPanel);
  return {
    bgPanel,
    toolPanel: overlap ? toolPanel : p.right(toolPanel),
  };
};

const downKey = ({ bgPanel, toolPanel }) => {
  const overlap =
    p.isOverlap(bgPanel, p.down(toolPanel)) || p.isOnTheBottomEdge(toolPanel);
  const newBgPanel = overlap ? p.add([bgPanel, toolPanel]) : bgPanel;
  const newToolPanel = overlap
    ? createRandomToolPanel(newBgPanel)
    : p.down(toolPanel);
  return {
    bgPanel: removeFullRows(newBgPanel),
    toolPanel: newToolPanel,
  };
};

// Transposes a matrix (rows become columns, columns become rows).
// Used by rotateBgPanel to rotate the background 90 degrees.
const transposeMatrix = (matrix) =>
  matrix[0].map((column, index) => matrix.map((row) => row[index]));

const rotateBgPanel = ({ bgPanel, toolPanel }) => {
  return {
    bgPanel: transposeMatrix(bgPanel),
    toolPanel: toolPanel,
  };
};

// Key definition

// Higher-order function: runs `fn` only when the game is not paused.
const whenNotPaused = (fn) => (panels) => (isPaused() ? panels : fn(panels));

// The automatic gravity step applied on each game tick.
const gravityTick = whenNotPaused(downKey);

const keyFnList = [
  { key: "down", fn: gravityTick },
  { key: "left", fn: whenNotPaused(leftKey) },
  { key: "p", fn: pauseKey },
  { key: "r", fn: rotateBgPanel },
  { key: "right", fn: whenNotPaused(rightKey) },
  { key: "space", fn: whenNotPaused(hardDrop) },
  { key: "up", fn: whenNotPaused(upKey) },
];

const isValidKey = (keyName) => keyFnList.some((item) => item.key === keyName);

const init = ({ rows, columns, state } = { rows: 17, columns: 17 }) => ({
  bgPanel: state ? state.bgPanel : createPanel(rows, columns),
  toolPanel: state ? state.toolPanel : createRandomToolPanel(),
});

const tick = ({ bgPanel, toolPanel }) =>
  gravityTick({
    bgPanel,
    toolPanel,
  });

const key = (keyName, state) =>
  isValidKey(keyName)
    ? keyFnList
        .find((item) => item.key === keyName)
        .fn({
          bgPanel: state.bgPanel,
          toolPanel: state.toolPanel,
        })
    : { bgPanel: state.bgPanel, toolPanel: state.toolPanel };

const join = (state) => p.add([state.bgPanel, state.toolPanel]);

const toArray = ({ bgPanel, toolPanel }) => [
  structuredClone(bgPanel),
  structuredClone(toolPanel),
];

// Returns the current score (total rows cleared).
// Prefer this over reading item.count from panel cells directly,
// which is deprecated and will be removed in a future major version.
const getScore = (state) => state.bgPanel.at(-1).at(-1).count ?? 0;

module.exports = {
  init,
  tick,
  key,
  join,
  isBlank: p.isBlankItem,
  toArray,
  getScore,
};
