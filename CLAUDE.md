# bstack

백엔드 특화 Claude Code 하네스. Java 21 / Spring Boot 3.x 프로젝트를 위한 재사용 가능한 skills, docs, templates 모음.

## 코드 수정 워크플로우 (필수)

수정 요청(버그 수정, 기능 변경, 리팩토링 포함)을 받으면 반드시 아래 순서를 따른다.

1. **컨벤션 확인**: `/conventions` 스킬을 읽고 프로젝트 규칙을 파악한다
2. **계획 제시**: 수정할 파일, 변경 이유, 변경 내용 요약을 텍스트로 먼저 제시한다
3. **승인 대기**: 사용자가 명시적으로 승인하기 전까지 Edit/Write 도구를 사용하지 않는다
4. **구현**: 승인 후에만 코드를 수정한다

**예외**: 사용자가 "바로 수정해줘", "승인 없이 진행해" 등을 명시적으로 요청한 경우

---

## 구조

```
bstack/
├── SKILL.md              # 진입점 — 스킬 라우팅 테이블
├── setup                 # 설치 스크립트
├── skills/               # 12개 도메인별 스킬
├── templates/            # 프로젝트 CLAUDE.md 템플릿
└── docs/                 # 하네스 설계 문서
```

## 설치

```bash
# 전역 설치
git clone https://github.com/[yourname]/bstack.git ~/.claude/skills/bstack
cd ~/.claude/skills/bstack && ./setup

# 또는 심볼릭링크
ln -s /Users/kuma/works/bstack ~/.claude/skills/bstack

# 프로젝트 적용 (symlink)
mkdir -p .claude/skills
ln -s ~/.claude/skills/bstack .claude/skills/bstack
cp ~/.claude/skills/bstack/templates/CLAUDE.md.template ./CLAUDE.md
```

## 사용법

Claude Code에서:
```
/bstack        — 하네스 진입, 스킬 라우팅
/architect     — 설계 리뷰
/persistence   — JPA/트랜잭션
/investigate   — 버그 탐색
/ship          — PR/릴리즈 체크
/audit         — 보안+동시성 감사
```

## 참고

- [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [LAYER_RULES.md](docs/LAYER_RULES.md)
- [RED_FLAGS.md](docs/RED_FLAGS.md)
