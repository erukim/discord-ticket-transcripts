import { TextBasedChannel, Snowflake, User, GuildMember } from 'discord.js'

import type { SupportedLanguageCode, LanguageOption } from './i18n'

export type ThemeMode = 'dark' | 'light' | 'toggle'

export type { SupportedLanguageCode, LanguageOption } from './i18n'

export interface CreateOptions {
  /** 티켓 번호/아이디. 미지정 시 채널 ID */
  ticketId?: string
  /** 티켓 개설자 */
  opener?: User | GuildMember
  /** 티켓 종료자 */
  closedBy?: User | GuildMember
  /** 티켓 카테고리 (예: '구매 문의', '신고') */
  category?: string
  /** 자유 메모/추가 메타데이터 */
  meta?: Record<string, unknown>
  /** 기본 테마 ('toggle'이면 사용자 토글 허용) */
  theme?: ThemeMode
  /**
   * HTML 에 포함할 언어.
   *
   * - `'all'` (기본) — 지원되는 모든 언어 포함 + 상단 선택 메뉴 표시
   * - 단일 코드 (예: `'ko'`) — 해당 언어로 고정, 선택 메뉴 숨김
   * - 배열 (예: `['ko','en']`) — 주어진 언어만 포함 + 선택 메뉴 표시
   *
   * 지원 언어:
   * - `'ko'` — 한국어 (Korean)
   * - `'en'` — English
   * - `'ja'` — 日本語 (Japanese)
   * - `'zh-CN'` — 简体中文 (Chinese, Simplified)
   */
  languages?: LanguageOption
  /**
   * HTML 로딩 시 초기 표시 언어.
   * 기본값은 `languages` 옵션의 첫 번째 항목.
   */
  defaultLanguage?: SupportedLanguageCode
  /** 첨부/이미지를 base64로 인라인 임베드할지 (기본 true — CDN 만료 대비) */
  inlineAssets?: boolean
  /** 인라인 임베드 대상 최대 파일 크기(byte). 넘어가면 URL만 저장 */
  maxAssetSize?: number
  /**
   * 추가로 fetch 를 허용할 호스트 접미사 목록. 예: `['cdn.mycorp.com']`.
   * 기본적으로 Discord CDN (`discordapp.com`, `discordapp.net`, `discord.com`,
   * `discord.media`) 만 허용됩니다. embed 의 이미지/아이콘 URL 은 사용자가
   * 임의로 지정할 수 있어 SSRF 벡터가 되므로 호스트가 다르면 inline 을 건너뜁니다.
   */
  allowedAssetHosts?: string[]
  /**
   * 호스트 검증 자체를 끄고 모든 URL 을 fetch. **불신 출처 메시지가 섞인
   * 채널에서는 사용 금지** — 내부망 스캔·메타데이터 탈취 위험이 있습니다.
   */
  allowAllAssetHosts?: boolean
  /** 메시지 수집 상한 (기본 무제한) */
  limit?: number
  /** 반환 파일명 (기본 ticket-<id>.html) */
  filename?: string
  /** 로그 콜백 */
  onProgress?: (info: { fetched: number; total?: number }) => void
}

export interface TranscriptFile {
  /** 생성된 파일명 */
  name: string
  /** HTML Buffer */
  buffer: Buffer
  /** discord.js AttachmentBuilder 에 바로 넘길 수 있는 형태 */
  attachment: Buffer
}

// ──────────────────────────────────────────────
// JSON 스키마 (HTML 내 임베드 & extract 반환 타입)
// ──────────────────────────────────────────────

export interface TicketTranscriptData {
  version: string
  generatedAt: string
  ticket: TicketMeta
  guild: GuildInfo
  channel: ChannelInfo
  opener?: UserInfo
  closedBy?: UserInfo
  participants: ParticipantInfo[]
  messages: TranscriptMessage[]
  stats: TranscriptStats
  meta?: Record<string, unknown>
}

export interface TicketMeta {
  id: string
  category?: string
  createdAt?: string
  closedAt: string
}

export interface GuildInfo {
  id: Snowflake
  name: string
  iconUrl?: string
}

export interface ChannelInfo {
  id: Snowflake
  name: string
  topic?: string
  type: number
  parentId?: Snowflake
  parentName?: string
  /** 티켓 종료 시점에 이 채널을 볼 수 있었던 역할/멤버 */
  viewers?: ChannelViewers
}

export interface ChannelViewers {
  roles: RoleBrief[]
  members: UserInfo[]
  /** 전체 인원이 너무 많아 생략한 경우 true */
  truncated?: boolean
}

export interface RoleBrief {
  id: Snowflake
  name: string
  color?: string
  position?: number
}

export interface UserInfo {
  id: Snowflake
  tag: string
  username: string
  displayName?: string
  avatarUrl?: string
  /** 프로필 이미지가 CDN 만료돼도 볼 수 있도록 base64 data URL 로 인라인 저장 */
  avatarDataUrl?: string
  bot?: boolean
  isStaff?: boolean
  roleColor?: string
  /** 해당 사용자가 티켓 종료 시점에 보유한 역할 목록 */
  roles?: RoleBrief[]
  /** 해당 채널에서 티켓 종료 시점에 유효한 권한 목록 (이름 배열) */
  permissions?: string[]
  /** 서버 가입 일시 */
  joinedAt?: string
}

export interface ParticipantInfo extends UserInfo {
  messageCount: number
}

export interface TranscriptMessage {
  id: Snowflake
  type: number
  author: UserInfo
  content: string
  createdAt: string
  editedAt?: string
  pinned?: boolean
  tts?: boolean
  system?: boolean
  reference?: { messageId?: Snowflake; channelId?: Snowflake; guildId?: Snowflake }
  mentions: {
    users: UserInfo[]
    roles: RoleBrief[]
    channels: { id: Snowflake; name: string }[]
    everyone: boolean
  }
  attachments: AttachmentInfo[]
  embeds: EmbedInfo[]
  stickers: StickerInfo[]
  reactions: ReactionInfo[]
  components: ComponentInfo[]
  /** Discord Components V2 flag (IS_COMPONENTS_V2 = 1<<15) */
  flags: number
  /** 스레드 정보 */
  thread?: { id: Snowflake; name: string }
  /** 스태프 여부 (옵션으로 판정) */
  isStaff?: boolean
  /** interaction / webhook 정보 */
  webhookId?: Snowflake
  interaction?: { id: Snowflake; type: number; name: string; user: UserInfo }
}

export interface AttachmentInfo {
  id: Snowflake
  name: string
  url: string
  proxyUrl?: string
  size: number
  contentType?: string
  width?: number
  height?: number
  description?: string
  /** CDN 만료 대비 base64 (data URL) */
  dataUrl?: string
  /** 임베드 실패 사유 */
  embedError?: string
}

export interface EmbedInfo {
  type?: string
  title?: string
  description?: string
  url?: string
  color?: number
  timestamp?: string
  footer?: { text: string; iconUrl?: string; iconDataUrl?: string }
  image?: { url: string; dataUrl?: string; width?: number; height?: number }
  thumbnail?: { url: string; dataUrl?: string; width?: number; height?: number }
  author?: { name: string; url?: string; iconUrl?: string; iconDataUrl?: string }
  fields: { name: string; value: string; inline?: boolean }[]
  video?: { url?: string; proxyUrl?: string; width?: number; height?: number }
  provider?: { name?: string; url?: string }
}

export interface StickerInfo {
  id: Snowflake
  name: string
  format: number
  url: string
  dataUrl?: string
}

export interface ReactionInfo {
  emoji: { id?: Snowflake; name: string; animated?: boolean; url?: string; dataUrl?: string }
  count: number
  burstCount?: number
  /** 이 반응을 누른 사용자 목록 (최대 수집 상한까지) */
  users?: UserInfo[]
  /** 실제 반응자 수가 상한 초과라 일부만 수집됨 */
  usersTruncated?: boolean
}

/** 버튼, 셀렉트 메뉴, 컴포넌트 v2 등 모두 수용 */
export interface ComponentInfo {
  type: number
  /** ActionRow, Container, Section 등 자식 */
  components?: ComponentInfo[]
  /** Button */
  style?: number
  label?: string
  emoji?: { id?: Snowflake; name: string; animated?: boolean; url?: string; dataUrl?: string }
  customId?: string
  url?: string
  disabled?: boolean
  /** Select Menu */
  placeholder?: string
  minValues?: number
  maxValues?: number
  options?: {
    label: string
    value: string
    description?: string
    emoji?: { name: string; id?: Snowflake }
    default?: boolean
  }[]
  /** Text Input */
  minLength?: number
  maxLength?: number
  required?: boolean
  value?: string
  /** Components V2: TextDisplay, MediaGallery, Section, Separator, File, Container */
  content?: string
  accessory?: ComponentInfo
  items?: {
    media?: { url: string; dataUrl?: string }
    description?: string
    spoiler?: boolean
  }[]
  spoiler?: boolean
  divider?: boolean
  spacing?: number
  accentColor?: number
  file?: { url: string; name?: string; dataUrl?: string; size?: number }
}

export interface TranscriptStats {
  totalMessages: number
  userMessages: number
  staffMessages: number
  botMessages: number
  attachmentCount: number
  embedCount: number
  reactionCount: number
  participantCount: number
  durationMs?: number
  durationHuman?: string
}

export type AnyTextChannel = TextBasedChannel
