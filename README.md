# fp-tetris

> Tetris game library and CLI — also used by [fp-tetris-game](https://github.com/afrontend/fp-tetris-game)

## Just run

```sh
$ npx fp-tetris
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

```js
const game = require('fp-tetris');
```

| Function | Description |
|----------|-------------|
| `game.init({ rows, columns })` | Initialize game state |
| `game.tick(state)` | Advance game by one tick (drops piece one row) |
| `game.key(keyName, state)` | Process a key event (`'left'`, `'right'`, `'up'`, `'down'`, `'space'`, `'p'`, `'r'`) |
| `game.join(state)` | Merge background and active piece into a single panel for rendering |
| `game.isBlank(item)` | Returns `true` if a cell is empty |
| `game.toArray(state)` | Returns `[bgPanel, toolPanel]` as deep-cloned arrays |

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

## License

MIT © Bob Hwang
