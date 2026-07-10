---
name: subagent-driven
description: 문제 정의를 검증한 뒤 계획을 응집된 work unit으로 분해하고, 적정 수의 서브에이전트를 dependency wave로 분산 실행한다.
---

# /subagent-driven — 문제 정의 기반 분산 실행

`docs/plans/` 실행 계획을 그대로 태스크 수만큼 분배하지 않는다.
먼저 문제를 확정하고, 충돌 없이 독립 실행 가능한 work unit을 만든 뒤 필요한 수만큼만 서브에이전트를 사용한다.

## When to use

- `docs/plans/YYYY-MM-DD-{name}.md` 존재
- `/writing-plans` 완료 후
- 둘 이상의 독립 workstream이 있거나, 격리된 구현과 독립 검증이 실질적 이득을 주는 작업

단일 work unit, 동일 파일 중심 변경, 강한 순차 의존 작업은 coordinator가 직접 수행한다.

## 시작 전 필수

1. 계획 파일 읽기
2. 해당 스펙 파일 읽기 (`docs/specs/FEAT-NNN.md`)
3. `docs/ARCHITECTURE.md`, 관련 `docs/specs/` 읽기
4. `docs/lessons/failure-log.json` 읽기 — known failure 패턴 확인
5. `docs/progress/claude-progress.json` 있으면 읽기 — 완료 unit과 남은 의존성 확인

## 1. Problem Definition Gate

분해·할당 전 아래 항목을 근거와 함께 확정한다.

| 필드 | 완료 조건 |
|---|---|
| `problem` | 관찰된 문제를 해결책 없이 한 문장으로 표현 |
| `evidence` | 재현, 로그, 코드 경로, 수치 중 하나 이상 존재 |
| `goal` | 변경 후 기대 상태 명시 |
| `nonGoals` | 이번 범위에서 하지 않을 일 명시 |
| `successCriteria` | 자동 테스트나 측정값으로 판정 가능 |
| `constraints` | 호환성, 성능, 보안, 일정, 변경 금지 영역 명시 |
| `uncertainties` | 미확정 가정과 해소 방법 명시 |

Gate 규칙:

- 성공 기준을 검증할 수 없거나 핵심 불확실성이 분해 방향을 바꾸면 서브에이전트를 생성하지 않는다.
- 먼저 조사하거나 사용자와 범위를 확정한다.
- 해결책·파일 목록만 있고 문제와 근거가 없으면 Gate 실패다.

## 2. Work unit 분해

work unit은 한 에이전트가 하나의 컨텍스트에서 구현하고 독립 검증할 수 있는 응집된 vertical slice다.
시간 길이 또는 파일 수만으로 쪼개지 않는다.

각 unit 필수 필드:

```yaml
id: W1
outcome: 사용자 또는 시스템 관점의 완료 결과
dependsOn: []
ownedFiles: [src/main/...]
acceptanceCriteria: [검증 가능한 조건]
verification: [실행할 테스트 또는 측정]
risk: low | medium | high
status: pending | ready | in_progress | blocked | completed
```

### 분해 sanity gate

과분할 신호 → 병합:

- 같은 파일 또는 공유 계약을 여러 unit이 수정
- 한 unit의 산출물만으로 의미 있는 검증 불가
- handoff 설명이 구현보다 크거나, 사소한 메서드별 분리
- 강한 선후관계 때문에 병렬 실행 불가

과대분할 신호 → 분리:

- 서로 독립된 산출물과 검증 경로 존재
- 파일 소유권을 겹치지 않게 나눌 수 있음
- 하나의 unit에 여러 실패 원인·도메인 경계가 혼재
- 일부만 완료해도 독립 가치 제공

최종 확인:

1. 각 unit이 문제 정의의 성공 기준 하나 이상에 연결되는가?
2. 같은 wave의 unit 간 `ownedFiles`가 겹치지 않는가?
3. 의존성이 DAG이며 순환하지 않는가?
4. 너무 작아 handoff 비용이 커지거나, 너무 커 단독 검증이 어려운 unit이 없는가?

## 3. Agent 수 산정

coordinator는 문제 정의, 분해, 소유권, 통합, 진행 상태를 담당하며 worker로 계산하지 않는다.
항상 coordinator 슬롯 1개를 예약한다.

각 wave의 worker 수:

```text
workerCount = min(
  availableConcurrencySlots - 1,  # coordinator 예약
  readyWorkstreamCount,           # dependsOn 완료된 unit 수
  maxConflictFreeReadyUnitCount   # 동시에 소유 가능한 ready unit 최대 개수
)
```

- `maxConflictFreeReadyUnitCount`는 ready unit 중 `ownedFiles`와 공유 계약이 서로 겹치지 않는 최대 부분집합의 크기다.
- 가용 슬롯 수를 알 수 없으면 worker 슬롯 1개로 보수적으로 시작하고, 독립성이 확인될 때만 늘린다.
- `workerCount <= 1`이면 서브에이전트 분산 이득이 없다. coordinator가 직접 수행한다.
- agent 수를 태스크 수에 맞추지 않는다. 같은 agent가 연속된 응집 unit을 처리해 컨텍스트를 재사용할 수 있다.
- 역할에 필요한 역량과 도구를 기준으로 배정한다. 특정 플랫폼 모델명을 계획에 고정하지 않는다.
- reviewer도 동시성 슬롯을 소비한다. 리뷰 wave 전에 다시 계산한다.

## 4. DAG / wave 실행

1. `dependsOn`이 모두 완료된 unit만 `ready`로 전환한다.
2. 같은 wave에는 `ownedFiles`가 겹치지 않는 unit만 배치한다.
3. 공유 계약, migration, 공통 설정, 공개 API 파일은 한 unit이 소유한다.
4. 공유 파일을 후속 unit이 수정해야 하면 같은 wave에 넣지 않고 명시적 dependency와 소유권 이전을 기록한다.
5. coordinator가 wave 결과를 통합하고 테스트한 뒤 다음 wave를 연다.

```text
Problem Definition Gate
  → decomposition sanity gate
  → DAG + ownership 확정
  → Wave 1: 충돌 없는 ready units 병렬 실행
  → 통합 검증 + 위험 기반 리뷰 + 진행 상태 갱신
  → Wave N: 새로 ready 된 units 실행
  → 최종 통합 리뷰
  → 전체 성공 기준 검증
```

### 구현 서브에이전트 프롬프트 패턴

```text
문제 정의: [problem/evidence/goal/nonGoals/successCriteria/constraints]
work unit: [id/outcome/dependsOn/ownedFiles/acceptanceCriteria/verification/risk]
스펙: docs/specs/FEAT-NNN.md
계획: docs/plans/YYYY-MM-DD-name.md
아키텍처: docs/ARCHITECTURE.md
레이어 규칙: docs/LAYER_RULES.md
known failures: docs/lessons/failure-log.json

ownedFiles 밖을 수정하지 마세요. 필요 시 coordinator에게 충돌 가능성을 보고하세요.
TDD로 구현하고 acceptanceCriteria별 검증 결과와 변경 파일을 보고하세요.
```

## 5. 위험 기반 리뷰

태스크마다 구현·스펙 리뷰·품질 리뷰 3개 agent를 고정 생성하지 않는다.

| 위험 | 리뷰 방식 |
|---|---|
| `low` | coordinator가 wave 통합 diff와 테스트를 한 번에 검토 |
| `medium` | 독립 reviewer 1명이 스펙 적합성, 코드 품질, 테스트를 함께 검토 |
| `high` | 관심사를 분리한 독립 리뷰. 예: 계약/도메인 리뷰와 보안/동시성/데이터 무결성 리뷰 |

리뷰 agent 수:

```text
low:    reviewerCount = 0
medium: reviewerCount = 1
high:   reviewerCount = min(availableConcurrencySlots - 1, independentReviewConcernCount, 2)
```

- `independentReviewConcernCount`는 계약/도메인, 보안, 동시성, 데이터 무결성처럼 서로 다른 실패 축의 수다.
- high-risk에서 독립 reviewer 슬롯이 부족하면 worker wave 종료 후 reviewer를 순차 실행한다.
- 독립 reviewer를 확보할 수 없으면 high-risk unit을 완료 처리하지 않고 사용자에게 에스컬레이션한다.

위험 상향 조건:

- 공개 API·DB schema·migration·트랜잭션 경계 변경
- 인증/인가, 개인정보, 결제, 데이터 삭제
- 동시성, 성능 hot path, 여러 모듈의 공유 계약
- rollback이 어렵거나 실패 영향 범위가 큼

리뷰는 unit별보다 wave 또는 통합 diff 기준을 우선한다. 동일 변경을 중복 검토하지 않는다.
`medium` 또는 `high` unit을 포함한 wave는 독립 리뷰 통과 전 `completed` 처리하거나 의존 unit을 열지 않는다.
리뷰 실패 시 해당 unit을 `blocked`로 바꾸고 원인과 재시도 횟수를 기록한다.

## 6. 통합 검증

각 wave 종료 시:

1. 변경 파일이 선언된 `ownedFiles` 범위인지 확인
2. unit별 `verification` 실행
3. 영향 범위 통합 테스트 실행
4. Problem Definition의 `successCriteria` 충족 여부 추적
5. 실패 시 `/investigate`로 원인 분석, `failure-log.json` 기록
6. 수정 후 최대 2회 재시도, 반복 실패 시 사용자에게 에스컬레이션

모든 wave 완료 후 전체 빌드·테스트와 성공 기준을 다시 검증한다. unit 테스트 통과만으로 완료 처리하지 않는다.

## 진행 상태 관리

`docs/progress/claude-progress.json` 예시:

```json
{
  "problemDefinition": {
    "problem": "관찰된 문제",
    "evidence": ["재현 또는 코드 근거"],
    "goal": "기대 상태",
    "nonGoals": ["제외 범위"],
    "successCriteria": ["검증 조건"],
    "constraints": ["변경 제약"],
    "uncertainties": [],
    "gateStatus": "passed"
  },
  "waves": [
    { "id": 1, "workUnits": ["W1", "W2"], "status": "completed" },
    { "id": 2, "workUnits": ["W3"], "status": "in_progress" }
  ],
  "workUnits": [
    {
      "id": "W1",
      "outcome": "독립 완료 결과",
      "dependsOn": [],
      "ownedFiles": ["src/main/..."],
      "acceptanceCriteria": ["검증 가능한 조건"],
      "risk": "medium",
      "status": "completed",
      "agent": "worker-1",
      "attempts": 1,
      "verification": {
        "commands": ["./mvnw test -Dtest=XxxTest"],
        "result": "passed",
        "verifiedAt": "2024-MM-DDTHH:mm:ssZ",
        "evidence": "Tests: N passed"
      }
    }
  ],
  "failures": [
    { "workUnitId": "W1", "failureId": "FL-001", "resolved": true }
  ]
}
```

## 중단 / 재개

1. `docs/progress/claude-progress.json` 읽기
2. Problem Definition과 계획이 현재 상태에서도 유효한지 확인
3. `completed` unit은 검증 증거가 있을 때만 건너뜀
4. `in_progress` unit의 실제 diff와 소유권 확인
5. DAG에서 새 `ready` unit과 충돌 없는 wave를 다시 계산

---

## References

- docs/STYLE_GUIDE.md — 원칙 (Karpathy 4 + 동료 협업 + 정량)
- docs/RED_FLAGS.md — 안티패턴
- docs/LAYER_RULES.md — 레이어 규칙
