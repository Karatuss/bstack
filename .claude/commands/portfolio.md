---
description: 자동 캡처된 성능·설계 개선 노트(포트폴리오) 조회·관리
argument-hint: "[list|show <slug|#N>|latest|tag <name>|export|edit <slug>|bullet <slug>]"
---

`~/.claude/portfolio/` 에 자동 누적된 포트폴리오 엔트리를 조회하는 명령어.

## 저장 구조

- `~/.claude/portfolio/INDEX.md` — 전체 인덱스 (최신순, prepend 방식)
- `~/.claude/portfolio/entries/YYYY-MM-DD-<slug>.md` — 개별 엔트리

각 엔트리 frontmatter:
```
---
date: YYYY-MM-DD
project: <repo name>
type: perf | design | refactor | reliability | security
tags: [english, kebab, case]
impact: "<one-line metric headline, English>"
---
```

본문은 한국어 (Problem / Before / Change / After / Trade-offs).

## 사용자 입력

`$ARGUMENTS` 의 첫 토큰을 서브명령으로 해석. 없으면 기본 동작.

| 서브명령 | 동작 |
|---|---|
| (없음) | INDEX.md 최신 20개 출력 |
| `list` | INDEX.md 전체 출력 |
| `show <slug\|#N>` | 해당 엔트리 전문 출력 |
| `latest` | 가장 최신 엔트리 전문 출력 |
| `tag <name>` | 해당 태그 포함 엔트리 INDEX 라인 필터 |
| `export` | 모든 엔트리 본문 concat 출력 (이력서·블로그 복사용) |
| `edit <slug>` | 해당 엔트리 파일 경로 출력 + 수정 안내. Edit 도구로 사용자 지시 받아 수정 |
| `bullet <slug>` | 해당 엔트리를 STAR 형식 영어 한 줄 이력서 bullet으로 변환 출력 |

## Slug 매칭 규칙

- 정확 일치 우선
- 없으면 prefix 일치
- 없으면 부분 일치
- `#N` 형태면 INDEX 최신순 N번째 엔트리
- 모호하면 후보 목록 출력 후 중단

## Bullet 변환 가이드

`bullet` 서브명령 시 출력 형식 (영어, 1-2줄):
```
<verb> <what> <how/tech>, reducing <metric> from <before> to <after> (<verification method>).
```
예: `Eliminated N+1 in order list endpoint via JPA fetch join, cutting p99 from 1.8s to 240ms (k6 50 RPS load test).`

## 실행 절차

1. `Bash: ls ~/.claude/portfolio/entries/` 로 엔트리 존재 확인. 빈 디렉토리면 "아직 캡처된 엔트리 없음" 안내.
2. 서브명령에 맞춰 `Read` 로 INDEX.md 또는 개별 엔트리 파일 로드.
3. `tag` 필터는 INDEX 라인을 단순히 grep.
4. 출력은 마크다운 그대로. 추가 가공·요약 금지 (`bullet` 제외).

## 보안·정확성

- 엔트리 내용을 외부로 전송·게시 금지. 사용자가 명시적으로 요청한 경우만.
- `bullet` 출력은 엔트리 내 수치를 그대로 사용. 추정·과장 금지.
