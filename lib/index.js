const p = require("fp-panel");

const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((v, f) => f(v), x);

const isFunction = (v) => typeof v === "function";
const randomIndex = (len) => Math.floor(Math.random() * len);

const GLOBAL = {
  color: "grey",
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

// Dimensions are always passed explicitly — no hidden state retained between calls.
const createPanel = (rows, columns) => p.createPanel(rows, columns);

const getEmptyRows = (count, columns) =>
  createArray(count, getEmptyRow(columns));

// Returns true when a row still has at least one blank cell (i.e. not full).
const isNotFullRow = (row) => row.some(p.isBlankItem);

// Remove full rows from panel

const addEmptyRows = (panel, rows, count) => {
  const columns = panel[0].length;
  const added = rows - panel.length;
  const newCount = count + added;
  const newPanel = [...getEmptyRows(added, columns), ...panel];
  // @deprecated item.count cell embedding will be removed in a future major version.
  // Use getScore(state) instead.
  newPanel.at(-1).at(-1).count = newCount;
  return { panel: newPanel, count: newCount };
};

// Removes all full rows and replaces them with empty rows at the top.
const removeFullRows = (panel, count) => {
  const rows = panel.length;
  const filtered = structuredClone(panel).filter(isNotFullRow);
  return addEmptyRows(filtered, rows, count);
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

// Each piece factory takes (rows, cols) and returns a painted, centered panel.
const makePieceFactory = (paint) => (rows, cols) =>
  pipe(paint, p.adjustToCenter)(createPanel(rows, cols));

const pieceFactories = [
  paintO,
  paintI,
  paintT,
  paintJ,
  paintL,
  paintS,
  paintZ,
].map(makePieceFactory);

// Make tool panel

const createRandomToolPanel = (rows, cols, bgPanel) => {
  const toolPanel = pieceFactories[randomIndex(pieceFactories.length)](
    rows,
    cols,
  );
  const overlap = bgPanel ? p.isOverlap(bgPanel, toolPanel) : false;
  return overlap ? createPanel(rows, cols) : toolPanel;
};

// Process event

// Counts the number of non-blank (colored) cells in a panel.
// Used when rotating to detect clipping: if the count changes, the rotation
// pushed cells outside the panel boundaries and should be rejected.
const countFilledCells = (panel) =>
  panel.flat().reduce((sum, item) => sum + (p.isItem(item) ? 1 : 0), 0);

const pauseKey = (state) => ({ ...state, pause: !state.pause });

const hardDrop = (state) => {
  const { bgPanel, count, rows, columns } = state;
  let { toolPanel } = state;
  while (
    !p.isOnTheBottomEdge(toolPanel) &&
    !p.isOverlap(bgPanel, p.down(toolPanel))
  ) {
    toolPanel = p.down(toolPanel);
  }
  const newBgPanel = p.add([bgPanel, toolPanel]);
  const { panel, count: newCount } = removeFullRows(newBgPanel, count);
  return {
    ...state,
    bgPanel: panel,
    toolPanel: createRandomToolPanel(rows, columns, newBgPanel),
    count: newCount,
  };
};

const leftKey = (state) => {
  const { bgPanel, toolPanel } = state;
  const overlap =
    p.isOnTheLeftEdge(toolPanel) || p.isOverlap(bgPanel, p.left(toolPanel));
  return { ...state, toolPanel: overlap ? toolPanel : p.left(toolPanel) };
};

const upKey = (state) => {
  const { bgPanel, toolPanel } = state;
  const rotatedToolPanel = p.rotate(toolPanel);
  const overlap =
    countFilledCells(toolPanel) !== countFilledCells(rotatedToolPanel) ||
    p.isOverlap(bgPanel, rotatedToolPanel);
  return { ...state, toolPanel: overlap ? toolPanel : rotatedToolPanel };
};

const rightKey = (state) => {
  const { bgPanel, toolPanel } = state;
  const overlap =
    p.isOverlap(bgPanel, p.right(toolPanel)) || p.isOnTheRightEdge(toolPanel);
  return { ...state, toolPanel: overlap ? toolPanel : p.right(toolPanel) };
};

const downKey = (state) => {
  const { bgPanel, toolPanel, count, rows, columns } = state;
  const overlap =
    p.isOverlap(bgPanel, p.down(toolPanel)) || p.isOnTheBottomEdge(toolPanel);
  if (!overlap) {
    return { ...state, toolPanel: p.down(toolPanel) };
  }
  const newBgPanel = p.add([bgPanel, toolPanel]);
  const { panel, count: newCount } = removeFullRows(newBgPanel, count);
  return {
    ...state,
    bgPanel: panel,
    toolPanel: createRandomToolPanel(rows, columns, newBgPanel),
    count: newCount,
  };
};

// Transposes a matrix (rows become columns, columns become rows).
// Used by rotateBgPanel to rotate the background 90 degrees.
const transposeMatrix = (matrix) =>
  matrix[0].map((column, index) => matrix.map((row) => row[index]));

const rotateBgPanel = (state) => ({
  ...state,
  bgPanel: transposeMatrix(state.bgPanel),
});

// Key definition

// Higher-order function: runs `fn` only when the game is not paused.
const whenNotPaused = (fn) => (state) => (state.pause ? state : fn(state));

// The automatic gravity step applied on each game tick.
const tick = whenNotPaused(downKey);

const keyFnList = [
  { key: "down", fn: tick },
  { key: "left", fn: whenNotPaused(leftKey) },
  { key: "p", fn: pauseKey },
  { key: "r", fn: rotateBgPanel },
  { key: "right", fn: whenNotPaused(rightKey) },
  { key: "space", fn: whenNotPaused(hardDrop) },
  { key: "up", fn: whenNotPaused(upKey) },
];

const isValidKey = (keyName) => keyFnList.some((item) => item.key === keyName);

const init = ({ rows = 17, columns = 17, state } = {}) => {
  const r = state?.rows ?? rows;
  const c = state?.columns ?? columns;
  return {
    bgPanel: state ? state.bgPanel : createPanel(r, c),
    toolPanel: state ? state.toolPanel : createRandomToolPanel(r, c),
    count: state ? (state.count ?? 0) : 0,
    pause: state ? (state.pause ?? false) : false,
    rows: r,
    columns: c,
  };
};

const key = (keyName, state) =>
  isValidKey(keyName)
    ? keyFnList.find((item) => item.key === keyName).fn(state)
    : state;

const join = (state) => p.add([state.bgPanel, state.toolPanel]);

const toArray = ({ bgPanel, toolPanel }) => [
  structuredClone(bgPanel),
  structuredClone(toolPanel),
];

// Returns the current score (total rows cleared).
// Prefer state.count (available since 0.0.18) over reading item.count from
// panel cells directly; cell embedding is deprecated and will be removed in
// a future major version.
const getScore = (state) =>
  state.count ?? state.bgPanel.at(-1).at(-1).count ?? 0;

module.exports = {
  init,
  tick,
  key,
  join,
  isBlank: p.isBlankItem,
  toArray,
  getScore,
};
