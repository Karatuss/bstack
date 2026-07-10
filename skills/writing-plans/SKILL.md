---
name: writing-plans
description: 승인된 스펙과 완료된 문제 정의를 응집된 TDD work unit 및 dependency wave로 변환. 파일 경로·코드 블록 포함. /spec 완료 후 사용.
---

# /writing-plans — TDD 실행 계획 스킬

승인된 스펙을 한 에이전트가 한 컨텍스트에서 구현·검증 가능한 응집된 TDD work unit으로 변환한다.
추상적 가이드 금지 — 실제 파일 경로와 완성된 코드 블록 포함.

## When to use

- `docs/specs/FEAT-NNN.md` 또는 `docs/specs/YYYY-MM-DD-topic-design.md` 존재
- 사용자가 구현 계획을 요청
- `/brainstorming` 또는 `/spec` 완료 후

## 시작 전 필수

1. 해당 스펙 파일 읽기
2. `docs/ARCHITECTURE.md` 읽기
3. 관련 기존 코드 구조 파악 (같은 도메인의 기존 Entity/Service 패턴 참고)
4. `docs/lessons/failure-log.json` 읽기 — 이전 실패 패턴 확인

## 문제 정의 Gate

분할 전에 아래 입력을 확정한다. 하나라도 비어 있거나 미결 질문이 구현 방향을 바꿀 수 있으면 계획 작성과 에이전트 분배를 중단한다.

- **문제**: 현재 동작과 기대 동작의 차이
- **근거**: 재현 사례, 코드 경로, 로그, 수치
- **목표**: 이번 변경으로 달성할 측정 가능한 결과
- **비목표**: 의도적으로 다루지 않는 범위
- **성공 기준**: 테스트 또는 관측으로 판정 가능한 조건
- **제약**: 호환성, 성능, 보안, 트랜잭션, 일정
- **미결 질문**: 없음. 또는 구현 방향에 영향 없는 항목만 허용

문제 정의는 증상 목록이 아니다. 변경할 경계와 완료 판정이 동일하게 해석될 정도로 구체적이어야 한다.

## 계획 파일 생성

저장 위치: `docs/plans/YYYY-MM-DD-{feature-name}.md`

### 파일 구조

```markdown
# 구현 계획: [기능명]

## 헤더
- **스펙**: docs/specs/FEAT-NNN-name.md
- **문제 정의**: 현재/기대 동작, 근거
- **목표**: 한 줄 요약
- **비목표**: 제외 범위
- **성공 기준**: 검증 가능한 완료 조건
- **제약**: 성능·호환성·보안·트랜잭션 제약
- **미결 질문**: 없음. 또는 구현 방향에 영향 없는 질문과 해소 방법
- **아키텍처**: 영향받는 레이어
- **기술 스택**: 사용할 Spring 컴포넌트, 라이브러리
- **예상 규모**: N개 work unit, M개 dependency wave

---

## 파일 맵
[생성/수정될 파일 전체 목록]

---

## Dependency DAG / Wave

| Wave | Work unit | dependsOn | 병렬 실행 가능 근거 |
|---|---|---|---|
| 1 | WU-1 | [] | 소유 파일 및 계약 경계 독립 |
| 2 | WU-2 | [WU-1] | WU-1 계약 확정 후 실행 |

---

## Work unit 목록

### WU-1: [사용자 가치 또는 동작 단위 이름]
- **dependsOn**: `[]`
- **ownedFiles**: `src/main/...`, `src/test/...`
- **acceptanceCriteria**: 외부에서 확인 가능한 완료 조건
- **verification**: `./mvnw test -Dtest=XxxTest`
- **complexity**: `S | M | L` — 변경 경계, 불확실성, 검증 비용 근거
- **risk**: `low | medium | high` — 공개 계약, 데이터 무결성, 보안, rollback 영향 근거
- **status**: `pending`
- [ ] 1a. 실패하는 테스트 작성
  - 파일: `src/test/java/.../XxxTest.java`
  - 코드: (완성된 테스트 코드)
- [ ] 1b. 테스트 실패 확인: `./mvnw test -Dtest=XxxTest`
- [ ] 1c. 구현
  - 파일: `src/main/java/.../Xxx.java`
  - 코드: (완성된 구현 코드)
- [ ] 1d. 테스트 통과 확인: `./mvnw test -Dtest=XxxTest`
- [ ] 1e. 커밋: `git commit -m "feat: ..."`
```

## Work unit 설계 기준

Work unit은 레이어나 구현 단계가 아니라 하나의 사용자 가치·도메인 동작을 끝까지 완성하는 vertical slice다. 필요한 경우 한 work unit 안에서 `Domain → Repository → Service → Controller → Integration Test`를 순서대로 변경한다.

각 work unit은:
- **응집적** — 한 에이전트가 한 컨텍스트에서 구현·검증 가능
- **검증 가능** — 단독 acceptance criteria와 테스트 명령어 포함
- **소유권 명확** — `ownedFiles`가 같은 wave의 다른 work unit과 겹치지 않음
- **의존성 명시** — 선행 계약이 필요하면 `dependsOn`으로 표현

테스트 작성, 구현, 리팩터링, 레이어별 변경을 서로 다른 work unit으로 쪼개지 않는다. 이들은 같은 동작을 완성하는 TDD 단계다.

## 분할 Sanity Gate

계획 확정 전 과소·과대 분할을 모두 검사한다.

**병합 조건 — 과분할 방지**
- 같은 wave에서 동일 파일·공유 계약을 수정하거나, 독립 outcome이 없어 순차 소유권 이전도 의미 없음
- 한쪽만으로 acceptance criteria를 검증할 수 없음
- 강한 선후관계 때문에 병렬 실행 이득이 없음
- 인수인계·리뷰 비용이 구현 비용보다 큼

**분할 조건 — 과대 분할 방지**
- 서로 독립된 acceptance criteria가 둘 이상 존재함
- 변경 경계와 `ownedFiles`를 충돌 없이 분리 가능함
- 각 결과를 단독 테스트·롤백할 수 있음
- 한 에이전트 컨텍스트에서 전체 원인·변경·검증을 유지하기 어려움

애매하면 더 적은 work unit을 선택한다. 단, 독립 검증 가능한 경계를 숨기기 위해 큰 work unit으로 합치지 않는다.

## DAG / Wave 규칙

- `dependsOn` 그래프는 순환이 없어야 함
- 같은 wave에는 모든 선행 work unit이 완료된 항목만 배치
- 같은 wave의 `ownedFiles`와 변경 계약은 겹치지 않아야 함
- 공유 파일·공유 API 계약 변경은 하나의 work unit으로 병합하거나 선행 wave로 직렬화
- 병렬성 확보만을 목적으로 인위적 work unit을 만들지 않음
- wave별 ready workstream 수를 `/subagent-driven`의 에이전트 수 산정 입력으로 제공

## 품질 기준

계획 작성 완료 전 확인:
- [ ] 문제 정의 Gate 통과 (문제·근거·목표·비목표·성공 기준·제약 확정)
- [ ] 스펙의 모든 요구사항이 태스크로 커버됨
- [ ] 각 work unit에 `dependsOn`, `ownedFiles`, `acceptanceCriteria`, `verification`, `complexity`, `risk`, `status` 포함
- [ ] 각 work unit에 실제 파일 경로 포함
- [ ] 코드 블록이 완성된 형태 (placeholder 없음)
- [ ] TDD 순서 (failing test → verify fail → implement → verify pass)
- [ ] 분할 Sanity Gate 통과
- [ ] DAG 순환 없음, 같은 wave의 파일·계약 충돌 없음
- [ ] `docs/lessons/failure-log.json`의 known failure 패턴 회피

## 완료 후

계획 파일 저장 완료 → `/subagent-driven` 스킬로 실행 권장.


---

## References

- docs/STYLE_GUIDE.md — 원칙 (Karpathy 4 + 동료 협업 + 정량)
- docs/RED_FLAGS.md — 안티패턴
- docs/LAYER_RULES.md — 레이어 규칙
