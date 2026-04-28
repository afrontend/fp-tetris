# fp-tetris

> Tetris game library and CLI — also used by [fp-tetris-game](https://github.com/afrontend/fp-tetris-game)

## Just run

```sh
npx fp-tetris
```

![fp-tetris demo](https://github.com/afrontend/fp-tetris/releases/download/demo-assets/demo.gif)

## Run with source

```sh
git clone https://github.com/afrontend/fp-tetris.git
cd fp-tetris
npm install
npm start
```

### CLI options

| Option | Description |
|--------|-------------|
| `-f, --full` | Use full terminal size for the board |

## Controls

> **Tip:** Press `h` during the game to show/hide the key list. The piece freezes while the help is open.

| Key | Action |
|-----|--------|
| `←` `→` | Move piece left / right |
| `↓` | Move piece down |
| `↑` | Rotate piece |
| `Space` | Hard drop |
| `p` | Pause / resume |
| `h` | **Show / hide in-game key help** |
| `r` | Rotate the background panel |
| `s` | Save current state |
| `l` | Load saved state |
| `q` / `Ctrl+C` | Quit |

## How fp-tetris uses fp-panel

fp-tetris uses [fp-panel](https://github.com/afrontend/fp-panel) as its 2D grid engine. Here is the step-by-step flow:

### Step 1 — Create the board

`p.createPanel(rows, columns)` builds the background grid. Each cell is initialized with `p.createItem(color)`.

```js
const bgPanel = p.createPanel(20, 10);
```

### Step 2 — Spawn a tetromino

Each piece is painted onto a small panel with `p.paint(panel, cells, color)`, then centered with `p.adjustToCenter(panel)`.

```js
const toolPanel = _.flow([createPanel, paintT, p.adjustToCenter])();
// paintT places the T-piece cells; adjustToCenter shifts the panel to the middle of the board
```

### Step 3 — Move and rotate

The active piece panel is repositioned each frame using `p.left()`, `p.right()`, `p.down()`, or `p.rotate()`. Before applying the move, collision is checked:

```js
if (!p.isOnTheLeftEdge(toolPanel) && !p.isOverlap(bgPanel, p.left(toolPanel))) {
  toolPanel = p.left(toolPanel);
}
```

Edge detection helpers (`p.isOnTheLeftEdge`, `p.isOnTheRightEdge`, `p.isOnTheBottomEdge`) prevent the piece from leaving the board.

### Step 4 — Land and clear rows

When the piece can no longer move down, it is merged into the background with `p.add([bgPanel, toolPanel])`. Full rows (no blank cells) are then removed and replaced with empty rows at the top.

```js
const newBgPanel = p.add([bgPanel, toolPanel]);
// then filter out full rows and prepend empty ones
```

### Step 5 — Render

To draw the current frame, the two panels are merged again with `p.add()` and each cell is inspected with `p.isBlankItem()`.

```js
const frame = p.add([bgPanel, toolPanel]);
frame.forEach(row => {
  console.log(row.map(cell => p.isBlankItem(cell) ? '.' : '■').join(' '));
});
```

## Tetrominoes

| Piece | Color |
|-------|-------|
| O | Yellow |
| I | Cyan |
| T | Magenta |
| J | White |
| L | Blue |
| S | Green |
| Z | Red |

## Updating the Demo GIF

Regenerates the terminal preview automatically.

```sh
# Install dependencies (first time only)
brew install asciinema
brew install agg
brew install gh && gh auth login

# Generate and upload to GitHub Releases
npm run demo-gif
```

`npm run demo-gif` steps:

1. `scripts/autoplay.js` — autoplays the game and exits automatically
2. `asciinema rec` — records terminal output to `demo.cast`
3. `agg` — converts `demo.cast` → `demo.gif`
4. `gh release upload` — uploads to the `demo-assets` GitHub Release tag
5. `README.md` — updates the GIF URL to the GitHub Releases path

Pushing to the master branch triggers `.github/workflows/demo.yml`, which runs all of the above automatically.

## License

MIT © Bob Hwang
