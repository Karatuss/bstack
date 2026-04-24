---
name: spec
description: 기능 스펙·ADR·API 계약 문서화(docs/specs/). 설계 확정 후 구현 전 사용. /brainstorming 권장 선행.
---

# /spec — 스펙 문서 / ADR 스킬

기능 스펙, 아키텍처 결정 기록(ADR), API 계약 문서를 `docs/specs/`에 관리한다.

## When to use

- `/brainstorming` 완료 후 설계 확정 시 (권장 경로)
- 새 기능 구현 전 스펙 문서화
- 아키텍처 결정 사항 기록 (ADR)
- 기존 스펙 문서 업데이트
- 설계 논의 결과 문서화

> `/brainstorming` 없이 진입 시: 설계 탐색 없이 바로 스펙 작성.
> 요구사항이 명확하면 OK. 불명확하면 `/brainstorming` 먼저 권장.

## 문서 위치 규칙

```
docs/specs/
├── FEAT-001-order-system.md       # 기능 스펙
├── FEAT-002-payment-integration.md
├── ADR-001-use-event-sourcing.md  # 아키텍처 결정
├── ADR-002-jwt-vs-session.md
└── API-v1-contracts.md            # API 계약
```

## 기능 스펙 템플릿

```markdown
# FEAT-NNN: [기능명]

## 상태
- [ ] Draft | [ ] Review | [x] Approved | [ ] Implemented

## 배경
[왜 이 기능이 필요한지]

## 목표
- [달성하려는 것]

## 비목표
- [이번 범위에서 제외되는 것]

## 설계

### 도메인 모델
[핵심 엔티티, 값 객체, 관계]

### API 엔드포인트
[새로 추가되는 엔드포인트 목록]

### 데이터베이스 변경
[DDL 변경 사항]

### 이벤트
[발행/구독 이벤트 목록]

## 구현 체크리스트
- [ ] 도메인 모델
- [ ] Repository
- [ ] Service
- [ ] Controller
- [ ] 테스트
- [ ] 마이그레이션

## 열린 질문
- [미결 사항]
```

## ADR 템플릿

```markdown
# ADR-NNN: [결정 제목]

## 날짜
2024-MM-DD

## 상태
Proposed | Accepted | Deprecated | Superseded by ADR-NNN

## 컨텍스트
[이 결정이 필요한 배경과 문제 상황]

## 결정
[무엇을 결정했는지]

## 결과
### 장점
- [이 결정의 이점]

### 단점
- [이 결정의 트레이드오프]

### 대안으로 고려한 것
- [검토했지만 선택하지 않은 옵션들과 이유]
```

## 스킬 동작

1. `docs/specs/` 디렉터리 내 기존 문서 읽기
2. 사용자가 요청한 스펙/ADR 신규 작성 또는 기존 업데이트
3. `docs/ARCHITECTURE.md`에 새 결정 반영이 필요한지 확인
4. 파일명 규칙: `FEAT-NNN-kebab-case.md` 또는 `ADR-NNN-kebab-case.md`

## 주의

- 스펙은 코드 변경 전에 작성 (설계 먼저, 구현 나중)
- 구현 완료 후 스펙의 체크리스트 업데이트
- 아키텍처 변경 시 반드시 ADR 작성


---

## References

- docs/STYLE_GUIDE.md — 원칙 (Karpathy 4 + 동료 협업 + 정량)
- docs/RED_FLAGS.md — 안티패턴
- docs/LAYER_RULES.md — 레이어 규칙
