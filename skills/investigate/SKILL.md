# /investigate — 버그 탐색 스킬

원인 불명 버그, 예외 추적, 예상치 못한 동작을 체계적으로 분석한다.
**스코프 freeze 원칙**: 탐색 중 발견한 관련 없는 코드 냄새는 메모만 하고 건드리지 않는다.

## 진입 조건

- 예외 발생 원인 불명
- 특정 조건에서만 재현되는 버그
- 성능이 갑자기 저하된 경우
- 예상과 다른 데이터 상태
- 로그에 오류가 없는데 동작이 이상한 경우

## 탐색 프로세스 (반드시 순서 준수)

### 1단계: 스코프 정의 (freeze)
- 재현 조건을 명확히 서술
- 영향받는 레이어/모듈 범위 확정
- **이 범위 밖은 이번 작업에서 수정하지 않음**

### 2단계: 증거 수집
```bash
# 관련 로그 확인
grep -n "ERROR\|WARN\|Exception" logs/application.log | tail -50

# DB 상태 스냅샷
# 문제 발생 시점의 데이터 상태 확인

# 최근 변경 이력
git log --oneline -20 -- src/main/java/path/to/affected/
```

### 3단계: 가설 수립
- 가설 1: [가장 가능성 높은 원인]
- 가설 2: [차순위 원인]
- 가설 3: [외부 요인]

각 가설을 검증하는 최소 재현 코드 작성.

### 4단계: 원인 확정
- 재현 테스트 작성 (버그를 증명하는 failing test)
- 원인 코드 라인 특정

### 5단계: 수정 및 검증
- 최소 변경으로 수정
- 재현 테스트가 통과하는지 확인
- 회귀 방지를 위해 테스트 유지

### 6단계: failure-log.json 기록 (필수)

원인이 확정되면 `docs/lessons/failure-log.json`의 `failures` 배열에 추가:

```json
{
  "id": "FL-NNN",
  "date": "YYYY-MM-DD",
  "skill": "해당 도메인 스킬명",
  "symptom": "관찰된 현상",
  "cause": "근본 원인",
  "attempted": ["시도했으나 실패한 방법들"],
  "resolution": "실제 해결 방법",
  "preventionRule": "다음에 반복하지 않기 위한 규칙",
  "addedToSkill": false
}
```

기록 완료 후 → `/writing-skills` 스킬로 해당 SKILL.md 업데이트 권장.

## 자주 발생하는 버그 패턴

### 트랜잭션 관련
- `LazyInitializationException`: 트랜잭션 외부에서 Lazy 접근 → `/persistence`
- Dirty Checking 미동작: 트랜잭션 없이 Entity 수정
- `OptimisticLockException`: 동시 수정 충돌

### Spring 관련
- `BeanCreationException`: 의존성 순환 또는 누락
- AOP 미적용: self-invocation (`this.method()` 호출)
- 프로파일 미적용: `spring.profiles.active` 누락

### 비동기 관련
- `@Async` 트랜잭션 미전파: 새 트랜잭션 시작 필요
- CompletableFuture 예외 묻힘: `.exceptionally()` 누락

## 출력 형식

```
## 버그 리포트

**증상**: [사용자가 보고한 현상]
**재현 조건**: [최소 재현 조건]
**원인**: [특정된 코드 위치와 이유]
**수정**: [변경된 코드]
**검증**: [통과한 테스트 이름]
**사이드 이펙트 없음 확인**: [영향 범위 분석]
```

## 발견한 관련 없는 이슈

탐색 중 발견한 개선점은 수정하지 말고 메모:
```
# TODO (이번 범위 밖)
- OrderService:123 — 불필요한 조회 발견 → /perf 스킬로 별도 작업
```
