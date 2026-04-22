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

| Key | Action |
|-----|--------|
| `←` `→` | Move piece left / right |
| `↓` | Move piece down |
| `↑` | Rotate piece |
| `Space` | Hard drop |
| `p` | Pause / resume |
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

## Demo GIF 업데이트

터미널 동작 미리보기를 자동으로 재생성합니다.

```sh
# 의존 도구 설치 (최초 1회)
brew install asciinema
brew install agg
brew install gh && gh auth login

# 데모 생성 및 GitHub Releases 업로드
npm run demo-gif
```

`npm run demo-gif` 실행 순서:

1. `scripts/autoplay.js` — AI가 게임을 자동 플레이하고 자동 종료
2. `asciinema rec` — 터미널 출력을 `demo.cast`로 녹화
3. `agg` — `demo.cast` → `demo.gif` 변환
4. `gh release upload` — GitHub Releases `demo-assets` 태그에 업로드
5. `README.md` — GIF URL을 GitHub Releases 경로로 교체

master 브랜치에 푸시하면 `.github/workflows/demo.yml`이 위 과정을 자동으로 실행합니다.

## License

MIT © Bob Hwang
