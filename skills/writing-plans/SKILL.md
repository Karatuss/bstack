---
name: writing-plans
description: 승인된 스펙을 2-5분 TDD 태스크 목록으로 변환. 파일 경로·코드 블록 포함. /spec 완료 후 사용.
---

# /writing-plans — TDD 실행 계획 스킬

승인된 스펙을 2-5분짜리 TDD 태스크 목록으로 변환한다.
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

## 계획 파일 생성

저장 위치: `docs/plans/YYYY-MM-DD-{feature-name}.md`

### 파일 구조

```markdown
# 구현 계획: [기능명]

## 헤더
- **스펙**: docs/specs/FEAT-NNN-name.md
- **목표**: 한 줄 요약
- **아키텍처**: 영향받는 레이어
- **기술 스택**: 사용할 Spring 컴포넌트, 라이브러리
- **예상 소요**: N개 태스크

---

## 파일 맵
[생성/수정될 파일 전체 목록]

---

## 태스크 목록

### Task 1: [이름] — [레이어]
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

## TDD 태스크 순서

```
Domain Model → Repository → Service → Controller → Integration Test
```

각 태스크는:
- **독립적** — 다른 태스크 완료 없이 실행 가능
- **검증 가능** — 태스크별 테스트 명령어 포함
- **2-5분 분량** — 너무 크면 분할

## 품질 기준

계획 작성 완료 전 확인:
- [ ] 스펙의 모든 요구사항이 태스크로 커버됨
- [ ] 각 태스크에 실제 파일 경로 포함
- [ ] 코드 블록이 완성된 형태 (placeholder 없음)
- [ ] TDD 순서 (failing test → verify fail → implement → verify pass)
- [ ] `docs/lessons/failure-log.json`의 known failure 패턴 회피

## 완료 후

계획 파일 저장 완료 → `/subagent-driven` 스킬로 실행 권장.


---

## References

- docs/STYLE_GUIDE.md — 원칙 (Karpathy 4 + 동료 협업 + 정량)
- docs/RED_FLAGS.md — 안티패턴
- docs/LAYER_RULES.md — 레이어 규칙
