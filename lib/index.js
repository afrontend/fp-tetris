const p = require("fp-panel");

const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((v, f) => f(v), x);

const randomIndex = (len) => Math.floor(Math.random() * len);

const GAME_ID = "fp-tetris";
const SNAPSHOT_VERSION = 1;
const MAX_DIMENSION = 500;

const normalizeDimension = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(Math.max(1, Math.trunc(number)), MAX_DIMENSION)
    : fallback;
};

const isPaused = (state) => (state.paused ?? state.pause) === true;
const withPaused = (state, paused) => ({ ...state, paused, pause: paused });

// Removes all full rows using fp-panel and updates the cleared-row count.
const removeFullRows = (panel, count) => {
  const removed = panel.filter((row) => row.every(p.isFilled)).length;
  const newPanel = p.removeFullRows(panel);
  const newCount = count + removed;
  // @deprecated item.count cell embedding will be removed in a future major version.
  // Use getScore(state) instead.
  newPanel.at(-1).at(-1).count = newCount;
  return { panel: newPanel, count: newCount };
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
  pipe(paint, p.adjustToCenter)(p.createPanel(rows, cols));

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

const createToolPanel = (rows, cols, bgPanel, pieceSelector) => {
  if (rows < 2 || cols < 4) return p.createPanel(rows, cols);
  const toolPanel = pieceFactories[pieceSelector(pieceFactories.length)](
    rows,
    cols,
  );
  const overlap = bgPanel ? p.isOverlap(bgPanel, toolPanel) : false;
  return overlap ? p.createPanel(rows, cols) : toolPanel;
};

// Process event

const pauseKey = (state) => withPaused(state, !isPaused(state));

const hardDrop = (state) => {
  const { bgPanel, count, rows, columns, pieceSelector } = state;
  let { toolPanel } = state;
  if (p.isBlankPanel(toolPanel)) return state;
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
    toolPanel: createToolPanel(rows, columns, newBgPanel, pieceSelector),
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
  return {
    ...state,
    toolPanel: p.canRotate(bgPanel, toolPanel)
      ? p.rotate(toolPanel)
      : toolPanel,
  };
};

const rightKey = (state) => {
  const { bgPanel, toolPanel } = state;
  const overlap =
    p.isOverlap(bgPanel, p.right(toolPanel)) || p.isOnTheRightEdge(toolPanel);
  return { ...state, toolPanel: overlap ? toolPanel : p.right(toolPanel) };
};

const downKey = (state) => {
  const { bgPanel, toolPanel, count, rows, columns, pieceSelector } = state;
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
    toolPanel: createToolPanel(rows, columns, newBgPanel, pieceSelector),
    count: newCount,
  };
};

// Key definition

// Higher-order function: runs `fn` only when the game is not paused.
const whenNotPaused = (fn) => (state) => (isPaused(state) ? state : fn(state));

// The automatic gravity step applied on each game tick.
const tick = whenNotPaused(downKey);

const keyFnList = [
  { key: "down", fn: tick },
  { key: "left", fn: whenNotPaused(leftKey) },
  { key: "p", fn: pauseKey },
  { key: "right", fn: whenNotPaused(rightKey) },
  { key: "space", fn: whenNotPaused(hardDrop) },
  { key: "up", fn: whenNotPaused(upKey) },
];

const isValidKey = (keyName) => keyFnList.some((item) => item.key === keyName);

const init = (options = {}, legacyColumns) => {
  const normalizedOptions =
    typeof options === "number"
      ? { rows: options, columns: legacyColumns }
      : (options ?? {});
  const {
    rows = 17,
    columns = 17,
    state,
    pieceSelector = randomIndex,
  } = normalizedOptions;
  const r = normalizeDimension(
    state?.rows ?? state?.bgPanel?.length ?? rows,
    17,
  );
  const c = normalizeDimension(
    state?.columns ?? state?.bgPanel?.[0]?.length ?? columns,
    17,
  );
  const selector = state?.pieceSelector ?? pieceSelector;
  const paused = state ? isPaused(state) : false;
  return {
    bgPanel: state ? structuredClone(state.bgPanel) : p.createPanel(r, c),
    toolPanel: state
      ? structuredClone(state.toolPanel)
      : createToolPanel(r, c, null, selector),
    count: state ? (state.count ?? 0) : 0,
    paused,
    pause: paused,
    rows: r,
    columns: c,
    pieceSelector: selector,
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

const getTickInterval = (state) =>
  Math.max(150, 700 - Math.floor(getScore(state) / 10) * 50);

const serializeState = (state) => {
  const serializableState = { ...state };
  delete serializableState.pieceSelector;
  return {
    game: GAME_ID,
    version: SNAPSHOT_VERSION,
    state: structuredClone(serializableState),
  };
};

const restoreState = (snapshot, { pieceSelector = randomIndex } = {}) => {
  if (!snapshot || snapshot.game !== GAME_ID) {
    throw new TypeError("fp-tetris 스냅숏이 아닙니다.");
  }
  if (snapshot.version !== SNAPSHOT_VERSION) {
    throw new RangeError(`지원하지 않는 스냅숏 버전: ${snapshot.version}`);
  }
  if (!snapshot.state?.bgPanel || !snapshot.state?.toolPanel) {
    throw new TypeError("스냅숏에 필수 패널이 없습니다.");
  }
  return init({ state: snapshot.state, pieceSelector });
};

module.exports = {
  init,
  tick,
  key,
  join,
  isBlank: p.isBlankItem,
  isBlankToolPanel: (state) => p.isBlankPanel(state.toolPanel),
  toArray,
  getScore,
  getTickInterval,
  serializeState,
  restoreState,
};
