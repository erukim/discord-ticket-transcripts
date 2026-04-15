# Repository Setup Checklist

본 저장소의 자동 배포 / 보안 / 기여 흐름이 정상 동작하려면 GitHub UI 에서 아래 설정을 최초 1회 적용해야 합니다.
파일로 관리할 수 없는 repo-level 설정이므로 체크리스트로 유지합니다.

---

## 1. Actions 보안 (외부 PR 보호)

**Settings → Actions → General**

- [ ] **Actions permissions**: "Allow all actions and reusable workflows" 또는 "Allow select actions" 에 `actions/*` 만 허용
- [ ] **Fork pull request workflows from outside collaborators**: ✅ **"Require approval for first-time contributors who are new to GitHub"** 이상
  - 권장: **"Require approval for all outside collaborators"** (가장 엄격)
  - 이유: 외부 기여자가 워크플로를 수정한 PR 에서 악의적으로 `NPM_TOKEN` 등 secrets 를 탈취하려는 시도를 1차 차단
- [ ] **Workflow permissions**: "Read repository contents and packages permissions"
  - `id-token: write` 는 워크플로 YAML 에 이미 선언되어 있으므로 전역 설정 불필요

---

## 2. Secrets

**Settings → Secrets and variables → Actions → New repository secret**

- [ ] `NPM_TOKEN` — npmjs.com 에서 발급한 **Granular Token** (해당 패키지 `publish` 권한만, 만료 90일 권장)

확인: Secrets 값은 저장 후 누구도 볼 수 없으며, 워크플로 로그에 등장하면 자동으로 `***` 로 마스킹됩니다.

---

## 3. Branch Protection

**Settings → Branches → Add branch protection rule**

Branch name pattern: `main`

- [ ] Require a pull request before merging
  - [ ] Require approvals: 1 이상
  - [ ] Dismiss stale pull request approvals when new commits are pushed
- [ ] Require status checks to pass before merging (워크플로 이름: `Publish to npm` 의 빌드 단계)
- [ ] Do not allow bypassing the above settings (관리자 포함)
- [ ] Restrict who can push to matching branches (본인/유지보수자만)

---

## 4. Tag Protection

**Settings → Tags → New rule**

- [ ] Tag name pattern: `v*`
- 효과: 릴리스 태그 삭제/강제 이동 방지 → 배포 이력 무결성

---

## 5. Issue / PR 기능

**Settings → General → Features**

- [ ] Issues: ON
- [ ] Discussions: ON (사용법 질문 유입 채널)
- [ ] Wikis: OFF (README + CONTRIBUTING 으로 충분)
- [ ] Projects: 선택

**Settings → General → Pull Requests**

- [ ] "Allow squash merging" ✅ (커밋 이력 깔끔)
- [ ] "Allow merge commits" ❌
- [ ] "Allow rebase merging" 선택
- [ ] "Always suggest updating pull request branches" ✅
- [ ] "Automatically delete head branches" ✅

---

## 6. Security 기능

**Settings → Code security and analysis**

- [ ] Dependency graph: ON
- [ ] Dependabot alerts: ON
- [ ] Dependabot security updates: ON
- [ ] Secret scanning: ON
- [ ] Push protection: ON (커밋 단계에서 토큰 유출 차단)
- [ ] Private vulnerability reporting: ON (`SECURITY.md` 의 보고 채널)

---

## 7. Release 및 배포

- [ ] Release 생성 권한: 유지보수자로 제한 (Settings → Collaborators)
- [ ] npm 계정 2FA: **auth-and-writes** 모드
- [ ] `package.json` 의 `repository.url` / `bugs.url` / `homepage` 가 실제 repo URL 과 일치

---

## 8. Public 전환 시 추가 확인

Public 으로 전환하면 `--provenance` 가 동작하여 npm 페이지에 초록 배지가 표시됩니다.

- [ ] 이전 커밋 히스토리에 민감 정보(토큰/비밀키/개인정보) 가 없는지 확인
- [ ] `tests/demo.ts` 의 토큰은 `process.env.*` 로 복원되어 있는지 확인 ✅ (이미 반영)
- [ ] Secret scanning 이 과거 커밋을 스캔하도록 설정

Private 유지 시:
- [ ] `.github/workflows/publish.yml` 의 `NPM_CONFIG_PROVENANCE: true` 라인 제거 (또는 provenance 에러 감수)

---

## 참고

- 본 파일은 `.npmignore` 가 `.github/` 를 배제하므로 npm 배포본에 포함되지 않습니다.
- 설정은 GitHub UI 에서만 가능하며, 코드/YAML 로는 관리할 수 없습니다. 그래서 체크리스트 형태로 유지합니다.
