---
name: writing-skills
description: 실패 케이스→SKILL.md prevention rule 추가. RED-GREEN-REFACTOR 적용. /investigate 완료 후 사용.
---

# /writing-skills — 스킬 TDD (실패 → SKILL.md 업데이트)

실패 케이스를 "failing test"로 삼아 관련 SKILL.md에 prevention rule을 추가한다.
RED-GREEN-REFACTOR 사이클을 process documentation에 적용.

## When to use

- `/investigate`가 실패 원인을 확정하고 `docs/lessons/failure-log.json`에 기록한 후
- 기존 SKILL.md에 해당 패턴이 없는 경우
- 새 스킬을 처음 만들 때 (배포 전 테스트 필수)

## RED-GREEN-REFACTOR 사이클

### RED — 실패 케이스 확인
```
docs/lessons/failure-log.json 읽기
→ addedToSkill: false 인 항목 식별
→ 해당 skill 필드 확인 (어떤 SKILL.md를 업데이트해야 하는지)
→ 현재 SKILL.md에 prevention rule이 없음을 확인 (= failing test)
```

### GREEN — SKILL.md 업데이트
```
해당 skills/{name}/SKILL.md 읽기
→ "자주 발생하는 문제" 또는 관련 섹션에 항목 추가:

| 증상 | 원인 | 해결 |
|---|---|---|
| {symptom} | {cause} | {resolution} |

→ 필요하면 코드 예시도 추가
→ failure-log.json의 addedToSkill: true 로 변경
```

### REFACTOR — 중복/유사 패턴 통합
```
같은 섹션에 유사한 항목이 3개 이상이면:
→ 공통 원칙으로 통합
→ 중복 항목 제거
→ SKILL.md 가독성 유지
```

## 새 스킬 작성 시 원칙

### 설명 형식 (Iron Law)
```yaml
# 올바른 예
description: "Use when debugging unknown exceptions or unexpected behavior in Spring Boot apps"

# 잘못된 예 (절대 금지)
description: "Follows a 5-step process: scope freeze, evidence collection, hypothesis..."
```

트리거 조건만 기술. 워크플로우 요약 금지 — Claude가 설명을 읽고 스킬 본문을 건너뜀.

### 배포 전 테스트 체크리스트
- [ ] 실제로 트리거해서 동작 확인
- [ ] 다른 스킬과 진입 조건이 겹치지 않음
- [ ] SKILL.md 본문에 구체적 코드 예시 포함
- [ ] "자주 발생하는 문제" 섹션 있음

## 출력 형식

```
## 업데이트 완료

- 대상: skills/{name}/SKILL.md
- 추가된 항목: {symptom} → {preventionRule}
- failure-log.json FL-{id} → addedToSkill: true 마킹
- LESSONS_LEARNED.md 반영 여부: [예/아니오]
```

## LESSONS_LEARNED.md 반영 기준

단순 증상-해결 패턴은 SKILL.md만 업데이트.
다음 경우엔 `docs/lessons/LESSONS_LEARNED.md`에도 추가:
- 여러 스킬에 걸쳐 영향을 미치는 패턴
- 설계 수준의 결정 (레이어 구조, 트랜잭션 경계 등)
- 팀 전체가 알아야 할 운영 경험


---

## References

- docs/STYLE_GUIDE.md — 원칙 (Karpathy 4 + 동료 협업 + 정량)
- docs/RED_FLAGS.md — 안티패턴
- docs/LAYER_RULES.md — 레이어 규칙
