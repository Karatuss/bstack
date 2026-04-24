---
name: subagent-driven
description: docs/plans/ 태스크를 서브에이전트에 분산 실행. 스펙 적합성 + 품질 리뷰 포함. /writing-plans 완료 후 사용.
---

# /subagent-driven — 서브에이전트 분산 실행 스킬

`docs/plans/` 의 실행 계획을 태스크 단위로 서브에이전트에 위임하고,
각 태스크마다 스펙 적합성 리뷰 → 코드 품질 리뷰 순으로 검증한다.

## When to use

- `docs/plans/YYYY-MM-DD-{name}.md` 존재
- `/writing-plans` 완료 후

## 시작 전 필수

1. 계획 파일 읽기
2. 해당 스펙 파일 읽기 (`docs/specs/FEAT-NNN.md`)
3. `docs/lessons/failure-log.json` 읽기 — known failure 패턴 확인
4. `claude-progress.json` 있으면 읽기 — 재개 시 완료된 태스크 건너뜀

## 태스크별 실행 흐름

```
태스크 N 시작
  → [구현 서브에이전트]   계획의 태스크 실행
        ↓ 완료
  → [스펙 리뷰 서브에이전트]  스펙 요구사항 충족 여부 확인
        ↓ 통과
  → [품질 리뷰 서브에이전트]  코드 품질, 레이어 규칙, 테스트 품질 확인
        ↓ 통과
  → claude-progress.json 갱신 (태스크 completed)
  → 태스크 N+1 시작

        ↓ 실패 (어느 단계든)
  → /investigate  원인 분석 + failure-log.json 기록
  → /writing-skills  해당 SKILL.md 업데이트
  → 태스크 수정 후 재시도 (최대 2회)
  → 2회 실패 시 사용자에게 에스컬레이션
```

## 서브에이전트 역할 분리

### 구현 서브에이전트 프롬프트 패턴
```
태스크: [태스크 이름]
스펙: docs/specs/FEAT-NNN.md
계획: docs/plans/YYYY-MM-DD-name.md (Task N)
아키텍처: docs/ARCHITECTURE.md
레이어 규칙: docs/LAYER_RULES.md
known failures: docs/lessons/failure-log.json

위 문서를 읽고 Task N을 TDD로 구현하세요.
완료 후 테스트 결과를 보고하세요.
```

### 스펙 리뷰 서브에이전트 프롬프트 패턴
```
스펙: docs/specs/FEAT-NNN.md
구현된 파일: [구현 서브에이전트가 변경한 파일 목록]

스펙의 요구사항이 모두 구현됐는지 확인하세요.
통과/실패 여부와 근거를 보고하세요.
```

### 품질 리뷰 서브에이전트 프롬프트 패턴
```
docs/LAYER_RULES.md
docs/RED_FLAGS.md
구현된 파일: [파일 목록]

레이어 규칙 위반, RED FLAG, 테스트 품질을 검토하세요.
이슈가 있으면 심각도(CRITICAL/HIGH/MEDIUM)와 함께 보고하세요.
```

## 모델 선택 전략

| 태스크 유형 | 권장 모델 |
|---|---|
| 반복적 CRUD 구현 | 빠른 모델 (Haiku) |
| Service/비즈니스 로직 | 표준 모델 (Sonnet) |
| 아키텍처 리뷰, 복잡한 설계 | 최고 성능 모델 (Opus) |

## 진행 상태 관리

매 태스크 완료 시 `docs/progress/claude-progress.json` 갱신:
```json
{
  "phases": [
    { "name": "task-1", "status": "completed", "completedAt": "2024-MM-DD" },
    { "name": "task-2", "status": "in_progress" }
  ],
  "failures": [
    { "taskName": "task-1", "failureId": "FL-001", "resolved": true }
  ]
}
```

## 중단/재개

세션이 끊긴 경우:
1. `docs/progress/claude-progress.json` 읽기
2. `completed` 태스크 건너뜀
3. `in_progress` 태스크부터 재개


---

## References

- docs/STYLE_GUIDE.md — 원칙 (Karpathy 4 + 동료 협업 + 정량)
- docs/RED_FLAGS.md — 안티패턴
- docs/LAYER_RULES.md — 레이어 규칙
