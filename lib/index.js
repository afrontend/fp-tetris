const _ = require("lodash");
const fp = require("lodash/fp");

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

const createItem = () => ({ color: GLOBAL.color });
const getEmptyRow = columns => getAry(columns, createItem());
const createPanel = (() => {
  let savedRows = 0;
  let savedColumns = 0;
  return (rows, columns) => {
    savedRows = rows ? rows : savedRows;
    savedColumns = columns ? columns : savedColumns;
    return getAry(savedRows, getEmptyRow(savedColumns));
  };
})();

const to1DimAry = _.flattenDepth;
const getEmptyRows = (count, columns) => getAry(count, getEmptyRow(columns));

// Pause panel

const isPaused = () => GLOBAL.pause === true;

// Check a panel

const isBlank = item => item.color === GLOBAL.color;
const isItem = item => item.color !== GLOBAL.color;
const isBottom = panel => isItemRow(_.last(panel));
const isItemRow = fp.some(isItem);
const isSomeItemRow = fp.some(isBlank);

const isOnTheLeftEdge = panel =>
  _.reduce(
    panel,
    (count, rows) => (isItem(_.first(rows)) ? count + 1 : count),
    0
  );

const isOnTheRightEdge = panel =>
  _.reduce(
    panel,
    (count, rows) => (isItem(_.last(rows)) ? count + 1 : count),
    0
  );

const isOverlapItem = (a, b) => isItem(a) && isItem(b);
const isOverlap = (aPanel, bPanel) =>
  _.some(
    _.zipWith(to1DimAry(aPanel), to1DimAry(bPanel), isOverlapItem),
    fp.isEqual(true)
  );

const zipPanelItem = (bg, tool) => {
  const item = isBlank(tool) ? _.cloneDeep(bg) : _.cloneDeep(tool);
  item.zeroPoint = null;
  return item;
};
const assignPanel = ({ bgPanel, toolPanel }) =>
  _.chunk(
    _.zipWith(to1DimAry(bgPanel), to1DimAry(toolPanel), zipPanelItem),
    bgPanel[0].length
  );

// Move panel

const downPanel = panel => {
  const columns = panel[0].length;
  const newPanel = _.cloneDeep(panel);
  newPanel.pop();
  newPanel.unshift(getEmptyRow(columns));
  return newPanel;
};

const leftPanel = panel => {
  return _.cloneDeep(panel).map(rows => {
    rows.shift();
    rows.push(createItem());
    return rows;
  });
};

const rightPanel = panel => {
  return _.cloneDeep(panel).map(rows => {
    rows.pop();
    rows.unshift(createItem());
    return rows;
  });
};

const flipMatrix = matrix =>
  matrix[0].map((column, index) => matrix.map(row => row[index]));

/* eslint no-unused-vars:off */
const rotateRegion = (area, panel) => {
  const newPanel = _.cloneDeep(panel);
  const fromAry = [];
  _.range(area.startRow, area.endRow + 1).forEach(row => {
    _.range(area.startColumn, area.endColumn + 1).forEach(column => {
      fromAry.push(
        _.isUndefined(newPanel[row]) || _.isUndefined(newPanel[row][column])
          ? createItem()
          : newPanel[row][column]
      );
    });
  });
  const from2Ary = _.chunk(fromAry, Math.abs(area.startRow - area.endRow) + 1);
  const toAry = to1DimAry(flipMatrix(from2Ary.reverse()));
  _.range(area.startRow, area.endRow + 1).forEach(row => {
    _.range(area.startColumn, area.endColumn + 1).forEach(column => {
      const item = toAry.shift();
      const nop =
        _.isUndefined(newPanel[row]) || _.isUndefined(newPanel[row][column])
          ? ""
          : (newPanel[row][column] = _.cloneDeep(item));
    });
  });
  return newPanel;
};

const rotatePanel = (panel, moreSize = 2) => {
  const zeroPoints = getZeroPoints(panel);
  const area =
    zeroPoints.length === 0
      ? {
          startRow: 0,
          startColumn: 0,
          endRow: panel.length - 1,
          endColumn: panel[0].length -1
        }
      : _.reduce(
          zeroPoints,
          (keep, zeroPoint) => ({
            startRow: Math.min(keep.startRow, zeroPoint.row),
            startColumn: Math.min(keep.startColumn, zeroPoint.column),
            endRow: Math.max(keep.endRow, zeroPoint.row),
            endColumn: Math.max(keep.endColumn, zeroPoint.column)
          }),
          {
            startRow: 100,
            startColumn: 100,
            endRow: -1,
            endColumn: -1
          }
        );

  const newArea =
    zeroPoints.length === 1
      ? {
          startRow: _.first(zeroPoints).row - moreSize,
          startColumn: _.first(zeroPoints).column - moreSize,
          endRow: _.first(zeroPoints).row + moreSize,
          endColumn: _.first(zeroPoints).column + moreSize
        }
      : _.clone(area);

  return rotateRegion(newArea, panel);
};

// Remove row on panel

const addEmptyRow = (panel, rows) => {
  const columns = panel[0].length;
  const newPanel = _.cloneDeep(panel);
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

const paint = (panel, posAry, color) => {
  _(posAry).each(pos => {
    panel[pos.row][pos.column].color = color;
    panel[pos.row][pos.column].zeroPoint = pos.zeroPoint
      ? pos.zeroPoint
      : false;
  });
  return panel;
};

const repeat = (fn, initValue, count) =>
  _.reduce(_.range(count), (memo, num) => fn(memo), initValue);

const getMaxColumn = panel =>
  _.reduce(
    panel,
    (maxIndex, rows) => {
      const lastIndex = _.findLastIndex(rows, item => isItem(item));
      return maxIndex > lastIndex ? maxIndex : lastIndex;
    },
    0
  );

const adjustCenter = panel => {
  const columns = panel[0].length;
  const max = getMaxColumn(panel);
  const shift = columns > max ? ((columns - max) / 2).toFixed(0) : 0;
  return repeat(rightPanel, panel, shift);
};

const paintO = panel =>
  paint(
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
  paint(
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
  paint(
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
  paint(
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
  paint(
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
  paint(
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
  paint(
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
  _.flow([createPanel, paintO, adjustCenter]),
  _.flow([createPanel, paintI, adjustCenter]),
  _.flow([createPanel, paintT, adjustCenter]),
  _.flow([createPanel, paintJ, adjustCenter]),
  _.flow([createPanel, paintL, adjustCenter]),
  _.flow([createPanel, paintS, adjustCenter]),
  _.flow([createPanel, paintZ, adjustCenter])
];

// Make tool panel

const createRandomToolPanel = bgPanel => {
  const toolPanel = panelList[_.random(0, panelList.length - 1)]();
  const overlap = bgPanel ? isOverlap(bgPanel, toolPanel) : false;
  return overlap ? createPanel() : toolPanel;
};

// Process event

const getColorCount = panel =>
  _.reduce(to1DimAry(panel), (sum, item) => sum + (isItem(item) ? 1 : 0), 0);

const spaceKey = ({ bgPanel, toolPanel }) => {
  GLOBAL.pause = !isPaused();
  return {
    bgPanel,
    toolPanel
  };
};

const leftKey = ({ bgPanel, toolPanel }) => {
  const overlap =
    isOnTheLeftEdge(toolPanel) || isOverlap(bgPanel, leftPanel(toolPanel));
  return {
    bgPanel,
    toolPanel: overlap ? toolPanel : leftPanel(toolPanel)
  };
};

const getZeroPoints = panel => {
  const zeroPoints = [];
  panel.forEach((rows, rIndex) =>
    rows.forEach((item, cIndex) =>
      item.zeroPoint === true
        ? zeroPoints.push(Object.assign(item, { row: rIndex, column: cIndex }))
        : item
    )
  );
  return zeroPoints;
};

const upKey = ({ bgPanel, toolPanel }) => {
  const rotatedToolPanel = rotatePanel(toolPanel);
  const overlap =
    getColorCount(toolPanel) !== getColorCount(rotatedToolPanel) ||
    isOverlap(bgPanel, rotatedToolPanel);
  return {
    bgPanel,
    toolPanel: overlap ? toolPanel : rotatedToolPanel
  };
};

const rightKey = ({ bgPanel, toolPanel }) => {
  const overlap =
    isOverlap(bgPanel, rightPanel(toolPanel)) || isOnTheRightEdge(toolPanel);
  return {
    bgPanel,
    toolPanel: overlap ? toolPanel : rightPanel(toolPanel)
  };
};

const downKey = ({ bgPanel, toolPanel }) => {
  const overlap =
    isOverlap(bgPanel, downPanel(toolPanel)) || isBottom(toolPanel);
  const newBgPanel = overlap ? assignPanel({ bgPanel, toolPanel }) : bgPanel;
  const newToolPanel = overlap
    ? createRandomToolPanel(newBgPanel)
    : downPanel(toolPanel);
  return {
    bgPanel: removeFullRow(newBgPanel),
    toolPanel: newToolPanel
  };
};

const rotateBgPanel = ({ bgPanel, toolPanel }) => {
  return {
    bgPanel: rotatePanel(bgPanel),
    toolPanel: toolPanel
  };
};

// Key definition

const withPauseKey = fn => panels => (isPaused() ? panels : fn(panels));
const scrollDownPanel = withPauseKey(downKey);

const keyFnList = [
  { key: "down" , fn: scrollDownPanel }       ,
  { key: "left" , fn: withPauseKey(leftKey) } ,
  { key: "r"    , fn: rotateBgPanel }         ,
  { key: "right", fn: withPauseKey(rightKey) },
  { key: "space", fn: spaceKey }              ,
  { key: "up"   , fn: withPauseKey(upKey) }
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

const join = state =>
  assignPanel({
    bgPanel: state.bgPanel,
    toolPanel: state.toolPanel
  });

module.exports = {
  init,
  tick,
  key,
  join
};
