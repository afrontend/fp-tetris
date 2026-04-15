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

## Library API

Install as a dependency:

```sh
npm install fp-tetris
```

```js
const game = require('fp-tetris');
```

### `game.init({ rows, columns })`

Creates the initial game state.

```js
let state = game.init({ rows: 20, columns: 10 });
```

### `game.tick(state)`

Advances the game by one tick (drops the active piece one row). Returns updated state.

```js
state = game.tick(state);
```

### `game.key(keyName, state)`

Applies a key input. Valid key names: `'left'`, `'right'`, `'up'`, `'down'`, `'space'`, `'p'`, `'r'`.
Returns updated state.

```js
state = game.key('left', state);
```

### `game.join(state)`

Merges the background panel and the active piece into a single 2D array for rendering.

```js
const panel = game.join(state);
panel.forEach(row => {
  console.log(row.map(item => game.isBlank(item) ? '.' : '■').join(' '));
});
```

### `game.isBlank(item)`

Returns `true` if a cell is empty.

### `game.toArray(state)`

Returns `[bgPanel, toolPanel]` as deep-cloned arrays.

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
npm run release
```

`npm run release` 실행 순서:

1. `scripts/autoplay.js` — AI가 게임을 자동 플레이하고 자동 종료
2. `asciinema rec` — 터미널 출력을 `demo.cast`로 녹화
3. `agg` — `demo.cast` → `demo.gif` 변환
4. `gh release upload` — GitHub Releases `demo-assets` 태그에 업로드
5. `README.md` — GIF URL을 GitHub Releases 경로로 교체

master 브랜치에 푸시하면 `.github/workflows/demo.yml`이 위 과정을 자동으로 실행합니다.

## License

MIT © Bob Hwang
