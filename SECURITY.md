# Security Policy

## 지원 버전

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅        |
| < 0.1   | ❌        |

## 취약점 신고

**공개 이슈로 등록하지 마세요.**

아래 경로로 비공개 보고 부탁드립니다.

1. GitHub → **Security → Advisories → Report a vulnerability** (권장)
2. 또는 메인테이너 이메일 연락

보고 시 다음 정보를 포함해주세요.
- 영향 버전
- 재현 방법 / PoC
- 예상되는 영향 범위
- (선택) 제안하는 수정안

## 응답 정책

- 접수: 72시간 이내 확인 회신
- 심각도 분류(CVSS 기준) 및 수정 일정 공유: 7일 이내
- 수정 배포 후 공개 advisory 및 CVE 발급 검토

## 범위

### 범위 내
- npm 패키지 `discord-ticket-transcript` 의 런타임 취약점
- 생성된 HTML 내 XSS/스크립트 인젝션
- 빌드 파이프라인의 공급망 취약점

### 범위 외
- `discord.js` 자체 취약점 → discord.js 저장소로
- 사용자 환경의 봇 토큰 유출
- 난독화 우회 (난독화는 보안 경계가 아닌 지적재산 보호 목적)

## 공급망 보안

- GitHub Actions 워크플로는 공식 액션(`actions/*`)만 pinned version 으로 사용
- `NPM_TOKEN` 은 publish 권한 한정 Granular Token
- Release 는 `published` 이벤트에서만 자동 배포, 태그↔버전 일치 검증
