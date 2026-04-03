# bstack

백엔드 특화 Claude Code 하네스. Java 21 / Spring Boot 3.x 프로젝트를 위한 재사용 가능한 skills, docs, templates 모음.

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
