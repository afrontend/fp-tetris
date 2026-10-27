#!/usr/bin/env node
const { inspect, parseArgs, styleText } = require("node:util");
const readline = require("node:readline");
const game = require("../lib/index.js");
const pkg = require("../package.json");

// 화면 지우기 + 커서를 맨 위로 (clear 패키지와 같은 시퀀스)
const clear = () => process.stdout.write("\x1b[2J\x1b[0f");

const USAGE = [
  "Usage: example [options]",
  "",
  "Options:",
  "  -V, --version       버전 출력",
  "  -f, --full          터미널 전체 크기 사용",
  "  --rows <number>     게임판 행 수",
  "  --columns <number>  게임판 열 수",
  "  -h, --help          사용법 출력",
].join("\n");

const parseOptions = () => {
  try {
    return parseArgs({
      options: {
        version: { type: "boolean", short: "V" },
        full: { type: "boolean", short: "f" },
        rows: { type: "string" },
        columns: { type: "string" },
        help: { type: "boolean", short: "h" },
      },
    }).values;
  } catch (error) {
    console.error(`error: ${error.message}\n\n${USAGE}`);
    process.exit(1);
  }
};

const parseInteger = (value) =>
  value === undefined ? undefined : Number.parseInt(value, 10);

const args = parseOptions();
if (args.version) {
  console.log(pkg.version);
  process.exit(0);
}
if (args.help) {
  console.log(USAGE);
  process.exit(0);
}

function getColorItem(item, char) {
  // styleText 는 모르는 색 이름에 예외를 던지므로 없는 색(pink, orange 등)은 blue 로 그린다
  const color = Object.hasOwn(inspect.colors, item.color) ? item.color : "blue";
  return styleText(color, char);
}

const getMark = (item) => (game.isBlank(item) ? "." : getColorItem(item, "■"));
const format = (panel) =>
  panel.map((row) => row.map((item) => getMark(item)).join(" ")).join("|\r\n");

const HELP_TEXT = [
  "",
  "  조작:",
  "  ← →      좌우 이동",
  "  ↓         빠르게 내리기",
  "  ↑         블록 회전",
  "  Space     즉시 낙하",
  "  p         일시정지 / 재개",
  "  s         빠른 저장",
  "  l         빠른 불러오기",
  "  h         도움말 열기 / 닫기",
  "  ^D        스냅숏 JSON 출력 후 종료",
  "  q / ^C    종료",
].join("\r\n");

const setMessage = (gameCtx, message) => {
  gameCtx.message = message;
  gameCtx.messageUntil = Date.now() + 2000;
};

const save = (gameCtx) => {
  gameCtx.savedState = game.serializeState(gameCtx.state);
  setMessage(gameCtx, "빠르게 저장했습니다.");
};

const reload = (gameCtx) => {
  if (!gameCtx.savedState) {
    setMessage(gameCtx, "저장된 상태가 없습니다.");
    return;
  }
  try {
    gameCtx.state = game.restoreState(gameCtx.savedState);
    setMessage(gameCtx, "저장된 상태를 불러왔습니다.");
  } catch (error) {
    setMessage(gameCtx, "저장된 상태를 불러올 수 없습니다.");
    if (process.env.DEBUG) console.error(error);
  }
};

const startGame = (rows = 17, columns = 17) => {
  const gameCtx = {
    state: game.init({ rows, columns }),
    showHelp: false,
    message: "",
    messageUntil: 0,
  };

  const render = () => {
    clear();
    console.log(format(game.join(gameCtx.state)));
    console.log(`\r\n제거한 줄: ${game.getScore(gameCtx.state)}`);
    if (game.isBlankToolPanel(gameCtx.state)) console.log("게임 오버");
    else if (gameCtx.state.paused) console.log("일시정지");
    if (gameCtx.showHelp) console.log(HELP_TEXT);
    if (Date.now() < gameCtx.messageUntil) console.log(gameCtx.message);
  };

  const scheduleTick = () => {
    if (game.isBlankToolPanel(gameCtx.state)) return;
    gameCtx.timer = setTimeout(() => {
      if (!gameCtx.showHelp) gameCtx.state = game.tick(gameCtx.state);
      render();
      scheduleTick();
    }, game.getTickInterval(gameCtx.state));
  };

  readline.emitKeypressEvents(process.stdin);
  process.stdin.on("keypress", (ch, key) => {
    if (key?.ctrl && key.name === "c") process.exit();
    if (key?.name === "q") process.exit();
    if (key?.ctrl && key.name === "d") {
      console.log(JSON.stringify(game.serializeState(gameCtx.state), null, 2));
      process.exit();
    }
    if (key?.name === "h") gameCtx.showHelp = !gameCtx.showHelp;
    else if (key?.name === "s") save(gameCtx);
    else if (key?.name === "l") reload(gameCtx);
    else if (
      key &&
      !gameCtx.showHelp &&
      !game.isBlankToolPanel(gameCtx.state)
    ) {
      gameCtx.state = game.key(key.name, gameCtx.state);
    }
    render();
  });

  process.stdin.setRawMode(true);
  process.stdin.resume();
  render();
  scheduleTick();
};

const runCountdown = (rows, columns) => {
  let count = 3;
  const tick = () => {
    clear();
    console.log("\r\n");
    console.log(styleText("yellow", "  fp-tetris\r\n"));
    console.log(
      styleText("cyan", "  [ h ]를 누르면 도움말을 볼 수 있습니다.\r\n"),
    );
    console.log(
      styleText("white", "  시작까지... ") +
        styleText(["bold", "green"], String(count)),
    );
    count -= 1;
    if (count > 0) setTimeout(tick, 1000);
    else setTimeout(() => startGame(rows, columns), 1000);
  };
  tick();
};

const options = {
  full: args.full,
  rows: parseInteger(args.rows),
  columns: parseInteger(args.columns),
};
const rows = options.full
  ? Math.max(1, process.stdout.rows - 3)
  : (options.rows ?? 17);
const columns = options.full
  ? Math.max(1, Math.floor(process.stdout.columns / 2) - 1)
  : (options.columns ?? 17);
runCountdown(rows, columns);
