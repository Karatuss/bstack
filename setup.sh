#!/usr/bin/env bash
set -e

BSTACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_DIR="${HOME}/.claude/skills"
TARGET="${SKILLS_DIR}/bstack"

# --project 옵션: 현재 디렉터리 기준 프로젝트 vendor 모드
PROJECT_MODE=false
PROJECT_DIR="."
for arg in "$@"; do
  case $arg in
    --project)
      PROJECT_MODE=true
      ;;
    --project=*)
      PROJECT_MODE=true
      PROJECT_DIR="${arg#*=}"
      ;;
  esac
done

if [ "$PROJECT_MODE" = true ]; then
  echo "==> bstack 프로젝트 vendor 모드"
  DEST="${PROJECT_DIR}/.claude/skills/bstack"
  mkdir -p "$(dirname "$DEST")"
  if [ -e "$DEST" ]; then
    echo "    기존 경로 존재: $DEST (삭제 후 재설치)"
    rm -rf "$DEST"
  fi
  cp -Rf "$BSTACK_DIR" "$DEST"
  rm -rf "${DEST}/.git"
  echo "    vendor 완료: $DEST"
  echo ""
  echo "    CLAUDE.md 템플릿 복사 (없는 경우):"
  CLAUDE_MD="${PROJECT_DIR}/CLAUDE.md"
  if [ ! -f "$CLAUDE_MD" ]; then
    cp "${BSTACK_DIR}/templates/CLAUDE.md.template" "$CLAUDE_MD"
    echo "    생성: $CLAUDE_MD (프로젝트 정보 직접 편집 필요)"
  else
    echo "    건너뜀: $CLAUDE_MD 이미 존재"
  fi
  exit 0
fi

echo "==> bstack 전역 설치 시작"
echo "    소스: $BSTACK_DIR"

# ~/.claude/skills 디렉터리 생성
mkdir -p "$SKILLS_DIR"

# ~/.claude/skills/bstack 심볼릭링크 생성
if [ -L "$TARGET" ]; then
  echo "    기존 링크 제거: $TARGET"
  rm "$TARGET"
elif [ -d "$TARGET" ]; then
  echo "    경고: $TARGET 이 디렉터리로 존재합니다. 삭제 후 링크를 생성하려면 수동으로 rm -rf $TARGET 실행 후 재시도하세요."
  exit 1
fi

ln -s "$BSTACK_DIR" "$TARGET"
echo "    링크 생성: $TARGET -> $BSTACK_DIR"

# 각 skill 개별 링크 (네임스페이스 없이 직접 /architect 등으로 접근)
echo ""
echo "    개별 skill 링크:"
for skill_dir in "$BSTACK_DIR"/skills/*/; do
  skill_name=$(basename "$skill_dir")
  skill_link="${SKILLS_DIR}/${skill_name}"
  if [ -L "$skill_link" ]; then
    rm "$skill_link"
  fi
  if [ ! -e "$skill_link" ]; then
    ln -s "$skill_dir" "$skill_link"
    echo "      /${skill_name} -> $skill_dir"
  else
    echo "      건너뜀: /${skill_name} (이미 존재)"
  fi
done

echo ""
echo "==> 설치 완료!"
echo ""
echo "    전역 사용:"
echo "      /bstack          — 하네스 진입"
echo "      /architect       — 설계 리뷰"
echo "      /persistence     — JPA/트랜잭션"
echo "      /investigate     — 버그 탐색"
echo "      /ship            — PR/릴리즈 체크"
echo "      /audit           — 보안+동시성 감사"
echo ""
echo "    프로젝트에 적용:"
echo "      # symlink 방식 (개발 중 즉시 반영)"
echo "      mkdir -p .claude/skills"
echo "      ln -s ~/.claude/skills/bstack .claude/skills/bstack"
echo "      cp ~/.claude/skills/bstack/templates/CLAUDE.md.template ./CLAUDE.md"
echo ""
echo "      # vendor 방식 (팀 공유, 버전 고정)"
echo "      cd ~/.claude/skills/bstack && ./setup --project=/path/to/your-project"
