# Contributing

discord-ticket-transcript 에 기여해주셔서 감사합니다.
본 문서는 이슈 등록부터 PR 머지까지의 흐름을 안내합니다.

---

## 시작 전에

### 핵심 원칙 (깨지 않기)

모든 변경은 다음 세 원칙을 지켜야 합니다.

1. **단일 HTML 파일** — 산출물은 HTML + JSON + 텍스트 덤프 + 에셋이 모두 담긴 한 파일이어야 합니다.
2. **CDN 만료 내성** — 기본값은 base64 인라인. 끄려면 `inlineAssets: false` 를 명시적으로 전달해야 합니다.
3. **메시지·사용자 정보 번역 금지** — 번역 대상은 UI chrome(버튼, 라벨, 권한명, 시간 단위)뿐입니다. 메시지 본문, 사용자 이름/ID, 임베드 콘텐츠는 절대 번역하지 않습니다.

### 지원 채널
- **사용법/질문**: GitHub Discussions
- **버그 신고**: Issues → Bug Report 템플릿
- **기능 제안**: Issues → Feature Request 템플릿
- **보안 취약점**: `SECURITY.md` 참조 (비공개 보고)

---

## 개발 환경

### 요구사항
- Node.js **16.9+** (CI는 20 사용)
- npm 8+
- 테스트용 Discord 봇 토큰 (선택)

### 설치 및 빌드

```bash
git clone https://github.com/erukim/discord-ticket-transcripts.git
cd discord-ticket-transcripts
npm install

# 빠른 개발 빌드 (난독화 X)
npm run build:dev

# 배포용 빌드 (난독화 전체 파이프라인)
npm run build

# 빌드 산출물 청소
npm run clean
```

### 실제 봇 테스트

```bash
# 봇 인텐트: MESSAGE CONTENT, SERVER MEMBERS ON
BOT_TOKEN=xxx CHANNEL_ID=yyy npx ts-node tests/demo.ts
# → tests/output/ticket-<channelId>.html
```

---

## 브랜치와 커밋

### 브랜치 명명
- `feat/<topic>` — 신규 기능
- `fix/<topic>` — 버그 수정
- `docs/<topic>` — 문서
- `refactor/<topic>` — 내부 리팩터링
- `i18n/<lang>` — 번역

### 커밋 메시지 (Conventional Commits 권장)

```
feat: add filter option for message categories
fix: handle expired CDN urls in sticker renderer
docs: clarify inlineAssets default behavior
refactor(renderer): split markdown emitter
i18n(ko): update permission labels
chore: bump dependencies
```

Breaking change 는 제목에 `!` 또는 본문에 `BREAKING CHANGE:` 를 포함하세요.
```
feat!: rename `languages` option to `locales`
```

---

## Pull Request 흐름

1. 이슈를 먼저 열어 논의하거나, 기존 이슈에 "작업하겠습니다" 라고 남기세요.
2. 포크/브랜치에서 작업 → 로컬 빌드 및 테스트.
3. PR 템플릿에 따라 작성.
4. **외부 기여자의 첫 PR 은 관리자 승인 후에만 CI 가 실행됩니다** (보안 설정).
5. 리뷰 피드백 반영 → squash merge.

### 리뷰 기준
- [ ] 핵심 원칙 3가지를 해치지 않는가
- [ ] 공개 API 변경 시 타입 선언과 README 가 갱신됐는가
- [ ] 난독화 빌드 후에도 동작하는가 (`renameProperties: false` 는 유지되어야 함)
- [ ] i18n 키 추가 시 **24개 전 로케일**에 반영됐거나, 영어 폴백이 동작하는가

---

## i18n 기여

### 새 언어 추가
1. `src/i18n/<code>.ts` 파일 생성 (`en.ts` 를 참고)
2. `src/i18n/index.ts` 의 `LOCALES`, `LANGUAGE_DESCRIPTIONS`, `SUPPORTED_LANGUAGE_CODES` 에 추가
3. `Translations` 인터페이스의 모든 키를 빠짐없이 채우기
4. `README.md` 의 지원 언어 표 업데이트

### 기존 언어 수정
- 자연스러운 현지 표현 우선. 직역보다는 해당 언어의 UI 관용구를 따르세요.
- 권한 라벨은 Discord 공식 클라이언트 번역과 일치시키는 것을 권장.

### 번역하지 말아야 할 것
- 메시지 본문, 사용자 이름/태그, 타임스탬프 숫자 포맷, 임베드 제목/설명
- `BOT` / `STAFF` 같은 Discord 원본 배지 토큰 (대신 `roleBadge.bot` 같은 키로 감싸서 라벨만 번역)

---

## 배포 (유지보수자 전용)

자동 배포는 GitHub Release `published` 이벤트에서만 실행됩니다. 워크플로 정의: `.github/workflows/publish.yml`. 저장소 초기 세팅: `.github/REPO_SETUP.md`.

---

## 행동 규범

본 프로젝트는 [Contributor Covenant](https://www.contributor-covenant.org/) 의 정신을 따릅니다. 상호 존중과 건설적인 토론을 바랍니다.

---

## 라이선스

기여한 코드는 본 저장소와 동일한 **GPL-3.0** 하에 배포됨에 동의하는 것으로 간주됩니다.
