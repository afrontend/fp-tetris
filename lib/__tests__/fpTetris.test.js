const game = require("../index.js");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Returns all non-blank cell positions in a panel as { r, c } objects.
const getFilledCells = panel => {
  const cells = [];
  panel.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (!game.isBlank(cell)) cells.push({ r, c });
    })
  );
  return cells;
};

const minRow = panel => Math.min(...getFilledCells(panel).map(p => p.r));
const minCol = panel => Math.min(...getFilledCells(panel).map(p => p.c));
const maxCol = panel => Math.max(...getFilledCells(panel).map(p => p.c));
const cellCount = panel => getFilledCells(panel).length;

// ---------------------------------------------------------------------------
// GLOBAL.pause in lib/index.js is module-level shared state.
// Before each test, detect whether the game is paused and reset it.
// Detection: if tick() does not move the piece, the game is paused.
// ---------------------------------------------------------------------------
beforeEach(() => {
  const state = game.init({ rows: 17, columns: 17 });
  const ticked = game.tick(state);
  const [, toolBefore] = game.toArray(state);
  const [, toolAfter] = game.toArray(ticked);
  if (JSON.stringify(toolBefore) === JSON.stringify(toolAfter)) {
    game.key("p", state); // Toggle pause off
  }
});

// ---------------------------------------------------------------------------
// isBlank
// ---------------------------------------------------------------------------
describe("isBlank", () => {
  it("returns true for a blank (grey) cell", () => {
    const state = game.init({ rows: 5, columns: 5 });
    const [bg] = game.toArray(state);
    expect(game.isBlank(bg[0][0])).toBe(true);
  });

  it("returns false for a colored cell", () => {
    const state = game.init({ rows: 10, columns: 10 });
    const [, tool] = game.toArray(state);
    const [first] = getFilledCells(tool);
    expect(game.isBlank(tool[first.r][first.c])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// init
// ---------------------------------------------------------------------------
describe("init", () => {
  it("returns an object with bgPanel and toolPanel", () => {
    const state = game.init({ rows: 10, columns: 10 });
    expect(state).toHaveProperty("bgPanel");
    expect(state).toHaveProperty("toolPanel");
  });

  it("creates a bgPanel with the requested dimensions", () => {
    const state = game.init({ rows: 8, columns: 12 });
    const [bg] = game.toArray(state);
    expect(bg.length).toBe(8);
    expect(bg[0].length).toBe(12);
  });

  it("bgPanel starts fully blank", () => {
    const state = game.init({ rows: 8, columns: 8 });
    const [bg] = game.toArray(state);
    expect(cellCount(bg)).toBe(0);
  });

  it("toolPanel contains exactly 4 cells (one tetromino)", () => {
    const state = game.init({ rows: 17, columns: 17 });
    const [, tool] = game.toArray(state);
    expect(cellCount(tool)).toBe(4);
  });

  it("restores board state when state is provided", () => {
    const original = game.init({ rows: 10, columns: 10 });
    const [bgOrig, toolOrig] = game.toArray(original);
    const restored = game.init({ state: original });
    const [bgRestored, toolRestored] = game.toArray(restored);
    expect(bgRestored).toEqual(bgOrig);
    expect(toolRestored).toEqual(toolOrig);
  });
});

// ---------------------------------------------------------------------------
// toArray
// ---------------------------------------------------------------------------
describe("toArray", () => {
  it("returns a 2-element array [bgPanel, toolPanel]", () => {
    const state = game.init({ rows: 8, columns: 8 });
    const result = game.toArray(state);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
  });

  it("returns cloned panels, not the original references", () => {
    const state = game.init({ rows: 8, columns: 8 });
    const [bg1] = game.toArray(state);
    const [bg2] = game.toArray(state);
    expect(bg1).toEqual(bg2); // Same content
    expect(bg1).not.toBe(bg2); // Different references
  });
});

// ---------------------------------------------------------------------------
// join
// ---------------------------------------------------------------------------
describe("join", () => {
  it("returns a panel with the same dimensions as bgPanel", () => {
    const state = game.init({ rows: 8, columns: 12 });
    const [bg] = game.toArray(state);
    const joined = game.join(state);
    expect(joined.length).toBe(bg.length);
    expect(joined[0].length).toBe(bg[0].length);
  });

  it("merged panel contains exactly the active piece's cells", () => {
    const state = game.init({ rows: 10, columns: 10 });
    const [, tool] = game.toArray(state);
    const joined = game.join(state);
    expect(cellCount(joined)).toBe(cellCount(tool));
  });
});

// ---------------------------------------------------------------------------
// tick
// ---------------------------------------------------------------------------
describe("tick", () => {
  it("advances the piece one row downward", () => {
    const state = game.init({ rows: 17, columns: 17 });
    const [, toolBefore] = game.toArray(state);
    const next = game.tick(state);
    const [, toolAfter] = game.toArray(next);
    expect(minRow(toolAfter)).toBe(minRow(toolBefore) + 1);
  });

  it("does not move the piece when the game is paused", () => {
    let state = game.init({ rows: 17, columns: 17 });
    state = game.key("p", state); // Pause
    const [, toolBefore] = game.toArray(state);
    const ticked = game.tick(state);
    const [, toolAfter] = game.toArray(ticked);
    expect(toolAfter).toEqual(toolBefore);
  });
});

// ---------------------------------------------------------------------------
// key — left
// ---------------------------------------------------------------------------
describe("key — left", () => {
  it("moves the piece one column to the left", () => {
    let state = game.init({ rows: 17, columns: 17 });
    // Move right twice first to ensure we are not already at left edge
    state = game.key("right", state);
    state = game.key("right", state);
    const [, toolBefore] = game.toArray(state);
    const [, toolAfter] = game.toArray(game.key("left", state));
    expect(minCol(toolAfter)).toBe(minCol(toolBefore) - 1);
  });

  it("does not move past the left edge", () => {
    let state = game.init({ rows: 17, columns: 17 });
    for (let i = 0; i < 20; i++) state = game.key("left", state);
    const [, toolBefore] = game.toArray(state);
    const [, toolAfter] = game.toArray(game.key("left", state));
    expect(minCol(toolAfter)).toBe(minCol(toolBefore));
  });

  it("does nothing when paused", () => {
    let state = game.init({ rows: 17, columns: 17 });
    state = game.key("p", state);
    const [, toolBefore] = game.toArray(state);
    const [, toolAfter] = game.toArray(game.key("left", state));
    expect(toolAfter).toEqual(toolBefore);
  });
});

// ---------------------------------------------------------------------------
// key — right
// ---------------------------------------------------------------------------
describe("key — right", () => {
  it("moves the piece one column to the right", () => {
    let state = game.init({ rows: 17, columns: 17 });
    // Move left twice first to ensure we are not already at right edge
    state = game.key("left", state);
    state = game.key("left", state);
    const [, toolBefore] = game.toArray(state);
    const [, toolAfter] = game.toArray(game.key("right", state));
    expect(minCol(toolAfter)).toBe(minCol(toolBefore) + 1);
  });

  it("does not move past the right edge", () => {
    let state = game.init({ rows: 17, columns: 17 });
    for (let i = 0; i < 20; i++) state = game.key("right", state);
    const [, toolBefore] = game.toArray(state);
    const [, toolAfter] = game.toArray(game.key("right", state));
    expect(maxCol(toolAfter)).toBe(maxCol(toolBefore));
  });

  it("does nothing when paused", () => {
    let state = game.init({ rows: 17, columns: 17 });
    state = game.key("p", state);
    const [, toolBefore] = game.toArray(state);
    const [, toolAfter] = game.toArray(game.key("right", state));
    expect(toolAfter).toEqual(toolBefore);
  });
});

// ---------------------------------------------------------------------------
// key — up (rotate)
// ---------------------------------------------------------------------------
describe("key — up (rotate)", () => {
  it("preserves the number of filled cells after rotation", () => {
    const state = game.init({ rows: 17, columns: 17 });
    const [, toolBefore] = game.toArray(state);
    const [, toolAfter] = game.toArray(game.key("up", state));
    expect(cellCount(toolAfter)).toBe(cellCount(toolBefore));
  });

  it("does nothing when paused", () => {
    let state = game.init({ rows: 17, columns: 17 });
    state = game.key("p", state);
    const [, toolBefore] = game.toArray(state);
    const [, toolAfter] = game.toArray(game.key("up", state));
    expect(toolAfter).toEqual(toolBefore);
  });
});

// ---------------------------------------------------------------------------
// key — down
// ---------------------------------------------------------------------------
describe("key — down", () => {
  it("moves the piece down one row", () => {
    const state = game.init({ rows: 17, columns: 17 });
    const [, toolBefore] = game.toArray(state);
    const next = game.key("down", state);
    const [, toolAfter] = game.toArray(next);
    // Either moved down one row, or piece was locked and a new one spawned
    const movedDown = minRow(toolAfter) === minRow(toolBefore) + 1;
    const newPieceSpawned = minRow(toolAfter) < minRow(toolBefore);
    expect(movedDown || newPieceSpawned).toBe(true);
  });

  it("locks the piece into bgPanel when it reaches the bottom", () => {
    let state = game.init({ rows: 17, columns: 17 });
    const [, toolInit] = game.toArray(state);
    const pieceSize = cellCount(toolInit);
    // Use hard drop to reliably lock the piece
    state = game.key("space", state);
    const [bgAfter] = game.toArray(state);
    expect(cellCount(bgAfter)).toBe(pieceSize);
  });

  it("does nothing when paused", () => {
    let state = game.init({ rows: 17, columns: 17 });
    state = game.key("p", state);
    const [bgBefore, toolBefore] = game.toArray(state);
    const [bgAfter, toolAfter] = game.toArray(game.key("down", state));
    expect(toolAfter).toEqual(toolBefore);
    expect(bgAfter).toEqual(bgBefore);
  });
});

// ---------------------------------------------------------------------------
// key — space (hard drop)
// ---------------------------------------------------------------------------
describe("key — space (hard drop)", () => {
  it("immediately locks the piece into bgPanel", () => {
    const state = game.init({ rows: 17, columns: 17 });
    const [, toolBefore] = game.toArray(state);
    const next = game.key("space", state);
    const [bgAfter] = game.toArray(next);
    expect(cellCount(bgAfter)).toBe(cellCount(toolBefore));
  });

  it("spawns a new piece after hard drop", () => {
    const state = game.init({ rows: 17, columns: 17 });
    const next = game.key("space", state);
    const [, toolAfter] = game.toArray(next);
    expect(cellCount(toolAfter)).toBeGreaterThan(0);
  });

  it("does nothing when paused", () => {
    let state = game.init({ rows: 17, columns: 17 });
    state = game.key("p", state);
    const [bgBefore, toolBefore] = game.toArray(state);
    const [bgAfter, toolAfter] = game.toArray(game.key("space", state));
    expect(toolAfter).toEqual(toolBefore);
    expect(bgAfter).toEqual(bgBefore);
  });
});

// ---------------------------------------------------------------------------
// key — p (pause / unpause)
// ---------------------------------------------------------------------------
describe("key — p (pause)", () => {
  it("pauses the game so that tick becomes a no-op", () => {
    let state = game.init({ rows: 17, columns: 17 });
    state = game.key("p", state);
    const [, toolBefore] = game.toArray(state);
    const [, toolAfter] = game.toArray(game.tick(state));
    expect(toolAfter).toEqual(toolBefore);
  });

  it("unpauses the game on the second press, allowing tick to move the piece", () => {
    let state = game.init({ rows: 17, columns: 17 });
    state = game.key("p", state); // Pause
    state = game.key("p", state); // Unpause
    const [, toolBefore] = game.toArray(state);
    const [, toolAfter] = game.toArray(game.tick(state));
    expect(minRow(toolAfter)).toBe(minRow(toolBefore) + 1);
  });
});

// ---------------------------------------------------------------------------
// key — invalid key
// ---------------------------------------------------------------------------
describe("key — invalid key", () => {
  it("returns state unchanged for an unrecognized key name", () => {
    const state = game.init({ rows: 10, columns: 10 });
    const [bgBefore, toolBefore] = game.toArray(state);
    const next = game.key("z", state);
    const [bgAfter, toolAfter] = game.toArray(next);
    expect(bgAfter).toEqual(bgBefore);
    expect(toolAfter).toEqual(toolBefore);
  });
});

// ---------------------------------------------------------------------------
// Board integrity after row clearing (removeFullRows)
// ---------------------------------------------------------------------------
describe("removeFullRows — board integrity", () => {
  it("board dimensions are preserved after multiple hard drops", () => {
    let state = game.init({ rows: 17, columns: 17 });
    for (let i = 0; i < 10; i++) {
      state = game.key("space", state);
    }
    const [bg] = game.toArray(state);
    expect(bg.length).toBe(17);
    expect(bg[0].length).toBe(17);
  });

  it("each row in bgPanel always has the correct number of columns", () => {
    let state = game.init({ rows: 17, columns: 17 });
    for (let i = 0; i < 5; i++) {
      state = game.key("space", state);
    }
    const [bg] = game.toArray(state);
    bg.forEach(row => expect(row.length).toBe(17));
  });
});
