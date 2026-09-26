const game = require("../index.js");

describe("공통 호환 API", () => {
  it("객체와 위치 인자 초기화를 모두 지원한다", () => {
    expect(game.init({ rows: 6, columns: 7 }).rows).toBe(6);
    expect(game.init(6, 7).columns).toBe(7);
  });

  it("크기를 1~500 범위로 보정한다", () => {
    const state = game.init({ rows: 0, columns: 999 });
    expect(state.rows).toBe(1);
    expect(state.columns).toBe(500);
  });

  it("paused와 deprecated pause를 함께 갱신한다", () => {
    const paused = game.key("p", game.init());
    expect(paused.paused).toBe(true);
    expect(paused.pause).toBe(true);
  });

  it("제거된 r 키는 상태를 변경하지 않는다", () => {
    const state = game.init();
    expect(game.key("r", state)).toBe(state);
  });

  it("JSON 왕복 가능한 버전 스냅숏을 복원한다", () => {
    const state = game.key("left", game.init({ rows: 8, columns: 9 }));
    const snapshot = JSON.parse(JSON.stringify(game.serializeState(state)));
    expect(snapshot.game).toBe("fp-tetris");
    expect(snapshot.version).toBe(1);
    expect(game.restoreState(snapshot).bgPanel).toEqual(state.bgPanel);
  });

  it("다른 게임 스냅숏을 거부한다", () => {
    expect(() =>
      game.restoreState({ game: "fp-snake", version: 1, state: {} }),
    ).toThrow();
  });

  it("점수에 따라 tick 주기를 계산한다", () => {
    const state = game.init();
    expect(game.getTickInterval(state)).toBe(700);
    expect(game.getTickInterval({ ...state, count: 200 })).toBe(150);
  });
});
