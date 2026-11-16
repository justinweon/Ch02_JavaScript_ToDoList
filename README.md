# ✈ Departures — To-Do Board

공항 출발 안내판(Departure Board)을 모티브로 한 할 일 관리 웹앱입니다.
할 일은 "목적지", 진행 상태는 "운항 상태"가 되고, 글자는 스플릿 플랩 보드처럼 철컥 넘어갑니다.

## Concept

| To-do | Departure Board |
| --- | --- |
| 할 일 | DESTINATION |
| 카테고리 | LABEL (`DEV` `URGENT` `LIFE` `WORK`) |
| 진행 상태 | STATUS (`ON TIME` → `BOARDING` → `DONE`) |
| 긴급 할 일 | `FINAL CALL` (빨간색) |

## Features

- **할 일 추가 / 수정 / 삭제** — `Schedule`로 등록, 행에 마우스를 올리면 `[edit]` `[cancel]` 표시
- **상태 변경** — STATUS 클릭 시 순환 (`URGENT`는 `FINAL CALL` → `DONE`)
- **라벨 변경** — LABEL 클릭 시 순환, `URGENT`로 바꾸면 자동으로 `FINAL CALL`
- **필터** — all / active / done (개수 표시)
- **플립 애니메이션** — 바뀐 글자만 랜덤 문자를 거쳐 도착 (`prefers-reduced-motion` 지원)
- **다크 모드** — 시스템 설정 반영, 토글 선택은 저장
- **자동 저장** — `localStorage`에 보관

## Stack

HTML · Tailwind CSS (CDN) · Vanilla JavaScript · Google Fonts (VT323)

## Run

빌드 과정 없이 `index.html`을 브라우저에서 열면 됩니다.

## Structure

```
├── index.html
├── css/style.css   # 플립 타일 스타일
└── js/
    ├── todo.js     # 할 일 로직 · 플립 효과
    └── theme.js    # 다크/라이트 테마
```
