const _ = require("lodash");
const fp = require("lodash/fp");
const p = require("fp-panel");

// Configuration

const GLOBAL = {
  color: "grey",
  count: 0,
  pause: false
};

// Panel functions

const getAry = (len, fnOrObject) =>
  _.range(len).map(() =>
    _.isFunction(fnOrObject) ? fnOrObject() : _.cloneDeep(fnOrObject)
  );

const getEmptyRow = columns => getAry(columns, p.createItem(GLOBAL.color));
const createPanel = (() => {
  let savedRows = 0;
  let savedColumns = 0;
  return (rows, columns) => {
    savedRows = rows ? rows : savedRows;
    savedColumns = columns ? columns : savedColumns;
    return p.createPanel(savedRows, savedColumns);
  };
})();

const getEmptyRows = (count, columns) => getAry(count, getEmptyRow(columns));

const isPaused = () => GLOBAL.pause === true;

const isSomeItemRow = fp.some(p.isBlankItem);

// Remove row on panel

const addEmptyRow = (panel, rows) => {
  const newPanel = _.cloneDeep(panel);
  const columns = newPanel[0].length;
  const count = rows - newPanel.length;
  GLOBAL.count += count;
  newPanel.unshift(...getEmptyRows(count, columns));
  _.last(_.last(newPanel)).count = GLOBAL.count;
  return newPanel;
};

const removeFullRow = panel => {
  const rows = panel.length;
  const newPanel = _.filter(_.cloneDeep(panel), row => isSomeItemRow(row));
  return addEmptyRow(newPanel, rows);
};

// Paint on panel

const paintO = panel =>
  p.paint(
    panel,
    [
      { row: 0, column: 0, zeroPoint: true },
      { row: 0, column: 1, zeroPoint: true },
      { row: 1, column: 0, zeroPoint: true },
      { row: 1, column: 1, zeroPoint: true }
    ],
    "yellow"
  );

const paintI = panel =>
  p.paint(
    panel,
    [
      { row: 0, column: 0 },
      { row: 0, column: 1, zeroPoint: true },
      { row: 0, column: 2 },
      { row: 0, column: 3 }
    ],
    "lime"
  );

const paintT = panel =>
  p.paint(
    panel,
    [
      { row: 0, column: 1 },
      { row: 1, column: 0 },
      { row: 1, column: 1, zeroPoint: true },
      { row: 1, column: 2 }
    ],
    "pink"
  );

const paintJ = panel =>
  p.paint(
    panel,
    [
      { row: 0, column: 2 },
      { row: 1, column: 0 },
      { row: 1, column: 1, zeroPoint: true },
      { row: 1, column: 2 }
    ],
    "orange"
  );

const paintL = panel =>
  p.paint(
    panel,
    [
      { row: 0, column: 0 },
      { row: 1, column: 0 },
      { row: 1, column: 1, zeroPoint: true },
      { row: 1, column: 2 }
    ],
    "blue"
  );

const paintS = panel =>
  p.paint(
    panel,
    [
      { row: 0, column: 1, zeroPoint: true },
      { row: 0, column: 2 },
      { row: 1, column: 0 },
      { row: 1, column: 1 }
    ],
    "green"
  );

const paintZ = panel =>
  p.paint(
    panel,
    [
      { row: 0, column: 0 },
      { row: 0, column: 1, zeroPoint: true },
      { row: 1, column: 1 },
      { row: 1, column: 2 }
    ],
    "red"
  );

const panelList = [
  _.flow([createPanel, paintO, p.adjustToCenter]),
  _.flow([createPanel, paintI, p.adjustToCenter]),
  _.flow([createPanel, paintT, p.adjustToCenter]),
  _.flow([createPanel, paintJ, p.adjustToCenter]),
  _.flow([createPanel, paintL, p.adjustToCenter]),
  _.flow([createPanel, paintS, p.adjustToCenter]),
  _.flow([createPanel, paintZ, p.adjustToCenter])
];

// Make tool panel

const createRandomToolPanel = bgPanel => {
  const toolPanel = panelList[_.random(0, panelList.length - 1)]();
  const overlap = bgPanel ? p.isOverlap(bgPanel, toolPanel) : false;
  return overlap ? createPanel() : toolPanel;
};

// Process event

const getColorCount = panel =>
  _.reduce(
    _.flattenDepth(panel),
    (sum, item) => sum + (p.isItem(item) ? 1 : 0),
    0
  );

const spaceKey = ({ bgPanel, toolPanel }) => {
  GLOBAL.pause = !isPaused();
  return {
    bgPanel,
    toolPanel
  };
};

const leftKey = ({ bgPanel, toolPanel }) => {
  const overlap =
    p.isOnTheLeftEdge(toolPanel) || p.isOverlap(bgPanel, p.left(toolPanel));
  return {
    bgPanel,
    toolPanel: overlap ? toolPanel : p.left(toolPanel)
  };
};

const upKey = ({ bgPanel, toolPanel }) => {
  const rotatedToolPanel = p.rotate(toolPanel);
  const overlap =
    getColorCount(toolPanel) !== getColorCount(rotatedToolPanel) ||
    p.isOverlap(bgPanel, rotatedToolPanel);
  return {
    bgPanel,
    toolPanel: overlap ? toolPanel : rotatedToolPanel
  };
};

const rightKey = ({ bgPanel, toolPanel }) => {
  const overlap =
    p.isOverlap(bgPanel, p.right(toolPanel)) || p.isOnTheRightEdge(toolPanel);
  return {
    bgPanel,
    toolPanel: overlap ? toolPanel : p.right(toolPanel)
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
    bgPanel: removeFullRow(newBgPanel),
    toolPanel: newToolPanel
  };
};

const rotateBgPanel = ({ bgPanel, toolPanel }) => {
  return {
    bgPanel: p.rotate(bgPanel),
    toolPanel: toolPanel
  };
};

// Key definition

const withPauseKey = fn => panels => (isPaused() ? panels : fn(panels));
const scrollDownPanel = withPauseKey(downKey);

const keyFnList = [
  { key: "down", fn: scrollDownPanel },
  { key: "left", fn: withPauseKey(leftKey) },
  { key: "r", fn: rotateBgPanel },
  { key: "right", fn: withPauseKey(rightKey) },
  { key: "space", fn: spaceKey },
  { key: "up", fn: withPauseKey(upKey) }
];

const isValidKey = key => _.some(keyFnList, item => _.isEqual(item.key, key));

const init = ({ rows, columns, state } = { rows: 17, columns: 17 }) => ({
  bgPanel: state ? state.bgPanel : createPanel(rows, columns),
  toolPanel: state ? state.toolPanel : createRandomToolPanel()
});

const tick = ({ bgPanel, toolPanel }) =>
  scrollDownPanel({
    bgPanel,
    toolPanel
  });

const key = (key, state) =>
  isValidKey(key)
    ? _.find(keyFnList, item => _.isEqual(item.key, key)).fn({
        bgPanel: state.bgPanel,
        toolPanel: state.toolPanel
      })
    : { bgPanel: state.bgPanel, toolPanel: state.toolPanel };

const join = state => p.add([state.bgPanel, state.toolPanel]);

const toArray = ({ bgPanel, toolPanel }) => [
  _.cloneDeep(bgPanel),
  _.cloneDeep(toolPanel)
];

module.exports = {
  init,
  tick,
  key,
  join,
  isBlank: p.isBlankItem,
  toArray
};
