# fp-tetris
> library for [fp-tetris-game](https://github.com/afrontend/fp-tetris-game)

![console tetris screenshot](https://agvim.files.wordpress.com/2019/03/fp-tetris.png "console tetris screenshot")

## Just run

```sh
$ npx fp-tetris
```
![fp-tetris demo](demo.gif)

## Run with source

```sh
git clone https://github.com/afrontend/fp-tetris.git
cd fp-tetris
npm install
npm start
```

## Demo GIF 업데이트

터미널 동작 미리보기를 자동으로 재생성합니다.

```sh
# 의존 도구 설치 (최초 1회)
brew install agg
brew install gh && gh auth login

# 데모 생성 및 GitHub Releases 업로드
npm run release
```

`npm run release` 실행 순서:

1. `scripts/autoplay.js` — 게임 라이브러리를 직접 호출해 랜덤 키 50회 입력 후 자동 종료
2. `asciinema rec` — 터미널 출력을 `demo.cast`로 녹화
3. `agg` — `demo.cast` → `demo.gif` 변환
4. `gh release upload` — GitHub Releases `demo-assets` 태그에 업로드 (없으면 자동 생성)
5. `README.md` — GIF URL을 GitHub Releases 경로로 교체 (이미 설정된 경우 스킵)

master 브랜치에 푸시하면 `.github/workflows/demo.yml`이 위 과정을 자동으로 실행합니다.

## License

MIT © Bob Hwang
