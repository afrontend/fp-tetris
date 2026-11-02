const { runGameContract } = require("fp-panel/testing");
const game = require("../index.js");

// 공통 API(초기화·크기 보정·일시정지·렌더링·스냅숏)는 fp-panel 계약으로 검사한다.
runGameContract(game, { name: "fp-tetris", pauseKey: "p" });

describe("fp-tetris 고유 API", () => {
  it("제거된 r 키는 상태를 변경하지 않는다", () => {
    const state = game.init();
    expect(game.key("r", state)).toBe(state);
  });

  it("점수에 따라 tick 주기를 계산한다", () => {
    const state = game.init();
    expect(game.getTickInterval(state)).toBe(700);
    expect(game.getTickInterval({ ...state, count: 200 })).toBe(150);
  });
});
