import { TextBasedChannel, AttachmentBuilder, User, GuildMember, GuildTextBasedChannel } from 'discord.js'
import {
  CreateOptions,
  TranscriptFile,
  TicketTranscriptData,
  UserInfo,
  TranscriptStats
} from './types'
import { AssetCache } from './utils/asset'
import { humanizeDuration } from './utils/escape'
import { collectMessages, inferGuildChannelName } from './collectors/messages'
import { collectViewers } from './collectors/viewers'
import { renderHtml } from './renderer/template'
import { resolveLanguages } from './i18n'

const VERSION = '0.1.0'

/**
 * 티켓 채널의 모든 데이터를 수집해서 HTML 파일 1개로 반환.
 * HTML 내부에는 사람이 보기 좋은 UI + `<script id="ticket-data">` 에 JSON 임베드.
 */
export async function create(
  channel: TextBasedChannel,
  options: CreateOptions = {}
): Promise<TranscriptFile> {
  const assets = new AssetCache({
    enabled: options.inlineAssets !== false,
    maxSize: options.maxAssetSize
  })

  const i18n = resolveLanguages(options.languages, options.defaultLanguage)
  const { messages, participants, firstCreatedAt } = await collectMessages(channel, options, assets)
  const viewers = await collectViewers(channel, assets)

  const ticketId = options.ticketId ?? (channel as any).id
  const guild = (channel as GuildTextBasedChannel).guild
  const channelName = inferGuildChannelName(channel)
  const createdAtIso =
    firstCreatedAt ??
    (channel as any).createdAt?.toISOString?.() ??
    undefined
  const closedAt = new Date().toISOString()

  const stats: TranscriptStats = computeStats(
    messages,
    createdAtIso,
    closedAt,
    participants.length,
    i18n.locales.find((l) => l.code === i18n.defaultCode)?.duration
  )

  const data: TicketTranscriptData = {
    version: VERSION,
    generatedAt: closedAt,
    ticket: {
      id: ticketId,
      category: options.category,
      createdAt: createdAtIso,
      closedAt
    },
    guild: {
      id: guild?.id ?? '0',
      name: guild?.name ?? 'Direct Message',
      iconUrl: guild?.iconURL({ size: 128 }) ?? undefined
    },
    channel: {
      id: (channel as any).id,
      name: channelName,
      topic: (channel as any).topic ?? undefined,
      type: (channel as any).type ?? 0,
      parentId: (channel as any).parentId ?? undefined,
      parentName: (channel as any).parent?.name ?? undefined,
      viewers
    },
    opener: options.opener ? await toUserInfo(options.opener, assets, channel) : undefined,
    closedBy: options.closedBy ? await toUserInfo(options.closedBy, assets, channel) : undefined,
    participants,
    messages,
    stats,
    meta: options.meta
  }

  const html = renderHtml(data, {
    theme: options.theme ?? 'toggle',
    locales: i18n.locales,
    defaultLanguageCode: i18n.defaultCode,
    allowLanguageToggle: i18n.allowToggle
  })
  const buffer = Buffer.from(html, 'utf-8')
  const name = options.filename ?? `ticket-${sanitizeFilename(ticketId)}.html`

  return {
    name,
    buffer,
    attachment: buffer
  }
}

/** create() 결과를 discord.js 에 바로 보낼 수 있는 AttachmentBuilder 로 변환 */
export function toAttachment(file: TranscriptFile): AttachmentBuilder {
  return new AttachmentBuilder(file.buffer, { name: file.name })
}

function computeStats(
  messages: TicketTranscriptData['messages'],
  createdAtIso: string | undefined,
  closedAt: string,
  participantCount: number,
  durationUnits?: { days: string; hours: string; minutes: string; seconds: string }
): TranscriptStats {
  let userMessages = 0
  let staffMessages = 0
  let botMessages = 0
  let attachmentCount = 0
  let embedCount = 0
  let reactionCount = 0
  for (const m of messages) {
    if (m.author.bot) botMessages++
    else if (m.isStaff) staffMessages++
    else userMessages++
    attachmentCount += m.attachments.length
    embedCount += m.embeds.length
    reactionCount += m.reactions.reduce((s, r) => s + r.count, 0)
  }
  const durationMs =
    createdAtIso != null ? new Date(closedAt).getTime() - new Date(createdAtIso).getTime() : undefined
  return {
    totalMessages: messages.length,
    userMessages,
    staffMessages,
    botMessages,
    attachmentCount,
    embedCount,
    reactionCount,
    participantCount,
    durationMs,
    durationHuman: durationMs != null ? humanizeDuration(durationMs, durationUnits) : undefined
  }
}

async function toUserInfo(
  src: User | GuildMember,
  assets: AssetCache,
  channel?: TextBasedChannel
): Promise<UserInfo> {
  const user = 'user' in src ? src.user : src
  const member = 'user' in src ? src : undefined
  const avatar = member?.displayAvatarURL?.({ size: 128 }) ?? user.displayAvatarURL?.({ size: 128 })
  const roles = member?.roles?.cache
    ? [...member.roles.cache.values()]
        .filter((r) => r.id !== member.guild.id)
        .sort((a, b) => b.position - a.position)
        .map((r) => ({ id: r.id, name: r.name, color: r.hexColor, position: r.position }))
    : undefined
  let permissions: string[] | undefined
  if (member && channel && typeof (channel as any).permissionsFor === 'function') {
    try {
      permissions = (channel as any).permissionsFor(member)?.toArray()
    } catch {
      /* noop */
    }
  }
  return {
    id: user.id,
    tag: (user as any).tag ?? `${user.username}#${user.discriminator ?? '0'}`,
    username: user.username,
    displayName: member?.displayName ?? (user as any).globalName ?? user.username,
    avatarUrl: avatar,
    avatarDataUrl: await assets.toDataUrl(avatar),
    bot: user.bot,
    roleColor: member?.roles?.color?.hexColor,
    roles,
    permissions,
    joinedAt: member?.joinedAt?.toISOString()
  }
}

function sanitizeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9_.-]/g, '_')
}
