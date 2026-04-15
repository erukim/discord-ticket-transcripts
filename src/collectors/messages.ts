import {
  Message,
  Collection,
  TextBasedChannel,
  GuildTextBasedChannel,
  PermissionFlagsBits,
  User,
  GuildMember
} from 'discord.js'
import {
  TranscriptMessage,
  AttachmentInfo,
  EmbedInfo,
  StickerInfo,
  ReactionInfo,
  ComponentInfo,
  UserInfo,
  ParticipantInfo,
  CreateOptions
} from '../types'
import { AssetCache } from '../utils/asset'

export interface CollectResult {
  messages: TranscriptMessage[]
  participants: ParticipantInfo[]
  firstCreatedAt?: string
  lastCreatedAt?: string
}

export async function collectMessages(
  channel: TextBasedChannel,
  opts: CreateOptions,
  assets: AssetCache
): Promise<CollectResult> {
  const raw = await fetchAllMessages(channel, opts)
  const participants = new Map<string, ParticipantInfo>()
  const out: TranscriptMessage[] = []

  for (const msg of raw) {
    const m = await serializeMessage(msg, assets)
    out.push(m)
    const key = m.author.id
    const existing = participants.get(key)
    if (existing) {
      existing.messageCount++
    } else {
      participants.set(key, { ...m.author, messageCount: 1 })
    }
  }

  return {
    messages: out,
    participants: [...participants.values()],
    firstCreatedAt: out[0]?.createdAt,
    lastCreatedAt: out[out.length - 1]?.createdAt
  }
}

async function fetchAllMessages(
  channel: TextBasedChannel,
  opts: CreateOptions
): Promise<Message[]> {
  const limit = opts.limit ?? Infinity
  const all: Message[] = []
  let before: string | undefined

  while (true) {
    const remaining = Math.min(100, limit - all.length)
    if (remaining <= 0) break
    const batch = (await (channel as any).messages.fetch({
      limit: remaining,
      before
    })) as Collection<string, Message>

    if (!batch.size) break
    const arr = [...batch.values()]
    all.push(...arr)
    opts.onProgress?.({ fetched: all.length })
    before = arr[arr.length - 1].id
    if (batch.size < remaining) break
  }
  return all.sort((a, b) => Number(BigInt(a.id) - BigInt(b.id)))
}

async function serializeMessage(msg: Message, assets: AssetCache): Promise<TranscriptMessage> {
  const author = await serializeUser(msg.author, msg.member ?? undefined, assets, msg.channel)
  // Staff 여부: ManageChannels 퍼미션 보유 시 true
  if (msg.member) {
    try {
      author.isStaff = msg.member.permissions.has(PermissionFlagsBits.ManageChannels)
    } catch {
      /* noop */
    }
  }

  const attachments: AttachmentInfo[] = []
  for (const a of msg.attachments.values()) {
    attachments.push({
      id: a.id,
      name: a.name ?? 'file',
      url: a.url,
      proxyUrl: a.proxyURL,
      size: a.size,
      contentType: a.contentType ?? undefined,
      width: a.width ?? undefined,
      height: a.height ?? undefined,
      description: a.description ?? undefined,
      dataUrl: await assets.toDataUrl(a.url, a.contentType ?? undefined)
    })
  }

  const embeds: EmbedInfo[] = []
  for (const e of msg.embeds) {
    embeds.push({
      type: e.data.type,
      title: e.title ?? undefined,
      description: e.description ?? undefined,
      url: e.url ?? undefined,
      color: e.color ?? undefined,
      timestamp: e.timestamp ?? undefined,
      footer: e.footer
        ? {
            text: e.footer.text,
            iconUrl: e.footer.iconURL ?? undefined,
            iconDataUrl: await assets.toDataUrl(e.footer.iconURL ?? undefined)
          }
        : undefined,
      image: e.image
        ? {
            url: e.image.url,
            dataUrl: await assets.toDataUrl(e.image.url),
            width: e.image.width ?? undefined,
            height: e.image.height ?? undefined
          }
        : undefined,
      thumbnail: e.thumbnail
        ? {
            url: e.thumbnail.url,
            dataUrl: await assets.toDataUrl(e.thumbnail.url),
            width: e.thumbnail.width ?? undefined,
            height: e.thumbnail.height ?? undefined
          }
        : undefined,
      author: e.author
        ? {
            name: e.author.name,
            url: e.author.url ?? undefined,
            iconUrl: e.author.iconURL ?? undefined,
            iconDataUrl: await assets.toDataUrl(e.author.iconURL ?? undefined)
          }
        : undefined,
      fields: (e.fields ?? []).map((f) => ({
        name: f.name,
        value: f.value,
        inline: f.inline ?? undefined
      })),
      video: e.video
        ? {
            url: e.video.url ?? undefined,
            proxyUrl: e.video.proxyURL ?? undefined,
            width: e.video.width ?? undefined,
            height: e.video.height ?? undefined
          }
        : undefined,
      provider: e.provider
        ? { name: e.provider.name ?? undefined, url: e.provider.url ?? undefined }
        : undefined
    })
  }

  const stickers: StickerInfo[] = []
  for (const s of msg.stickers.values()) {
    stickers.push({
      id: s.id,
      name: s.name,
      format: s.format,
      url: s.url,
      dataUrl: await assets.toDataUrl(s.url)
    })
  }

  const REACTION_USER_LIMIT = 50
  const reactions: ReactionInfo[] = []
  for (const r of msg.reactions.cache.values()) {
    const emojiUrl = r.emoji.id
      ? `https://cdn.discordapp.com/emojis/${r.emoji.id}.${r.emoji.animated ? 'gif' : 'png'}`
      : undefined

    let users: UserInfo[] | undefined
    let usersTruncated = false
    try {
      const fetched = await r.users.fetch({ limit: REACTION_USER_LIMIT })
      usersTruncated = (r.count ?? fetched.size) > fetched.size
      users = await Promise.all(
        [...fetched.values()].map((u) => {
          const guild = (msg.channel as any).guild
          const member = guild?.members?.cache?.get(u.id)
          return serializeUser(u, member, assets, msg.channel)
        })
      )
    } catch {
      /* 권한 부족/만료 등 */
    }

    reactions.push({
      emoji: {
        id: r.emoji.id ?? undefined,
        name: r.emoji.name ?? '',
        animated: r.emoji.animated ?? undefined,
        url: emojiUrl,
        dataUrl: await assets.toDataUrl(emojiUrl)
      },
      count: r.count ?? 0,
      burstCount: (r as any).burstCount ?? undefined,
      users,
      usersTruncated: usersTruncated || undefined
    })
  }

  const components: ComponentInfo[] = []
  for (const c of msg.components ?? []) {
    components.push(await serializeComponent(c as any, assets))
  }

  const mentions = {
    users: await Promise.all(msg.mentions.users.map((u) => serializeUser(u, undefined, assets))),
    roles: msg.mentions.roles.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.hexColor
    })),
    channels: msg.mentions.channels.map((ch: any) => ({
      id: ch.id,
      name: ch.name ?? ch.id
    })),
    everyone: msg.mentions.everyone
  }

  const interaction = (msg as any).interaction
    ? {
        id: (msg as any).interaction.id,
        type: (msg as any).interaction.type,
        name: (msg as any).interaction.commandName,
        user: await serializeUser((msg as any).interaction.user, undefined, assets)
      }
    : undefined

  return {
    id: msg.id,
    type: msg.type,
    author,
    content: msg.content ?? '',
    createdAt: msg.createdAt.toISOString(),
    editedAt: msg.editedAt?.toISOString(),
    pinned: msg.pinned,
    tts: msg.tts,
    system: msg.system,
    reference: msg.reference
      ? {
          messageId: msg.reference.messageId ?? undefined,
          channelId: msg.reference.channelId,
          guildId: msg.reference.guildId ?? undefined
        }
      : undefined,
    mentions,
    attachments,
    embeds,
    stickers,
    reactions,
    components,
    flags: msg.flags?.bitfield ?? 0,
    thread: msg.thread ? { id: msg.thread.id, name: msg.thread.name } : undefined,
    isStaff: author.isStaff,
    webhookId: msg.webhookId ?? undefined,
    interaction
  }
}

async function serializeComponent(c: any, assets: AssetCache): Promise<ComponentInfo> {
  const base: ComponentInfo = { type: c.type }

  // ActionRow / Container / Section 자식
  if (Array.isArray(c.components)) {
    base.components = []
    for (const child of c.components) {
      base.components.push(await serializeComponent(child, assets))
    }
  }

  // Button
  if (c.style !== undefined) base.style = c.style
  if (c.label !== undefined) base.label = c.label
  if (c.customId !== undefined) base.customId = c.customId
  if (c.url !== undefined) base.url = c.url
  if (c.disabled !== undefined) base.disabled = c.disabled

  // Emoji
  if (c.emoji) {
    const emojiUrl = c.emoji.id
      ? `https://cdn.discordapp.com/emojis/${c.emoji.id}.${c.emoji.animated ? 'gif' : 'png'}`
      : undefined
    base.emoji = {
      id: c.emoji.id,
      name: c.emoji.name ?? '',
      animated: c.emoji.animated,
      url: emojiUrl,
      dataUrl: await assets.toDataUrl(emojiUrl)
    }
  }

  // Select Menu
  if (c.placeholder !== undefined) base.placeholder = c.placeholder
  if (c.minValues !== undefined) base.minValues = c.minValues
  if (c.maxValues !== undefined) base.maxValues = c.maxValues
  if (Array.isArray(c.options)) {
    base.options = c.options.map((o: any) => ({
      label: o.label,
      value: o.value,
      description: o.description,
      emoji: o.emoji,
      default: o.default
    }))
  }

  // Text Input
  if (c.minLength !== undefined) base.minLength = c.minLength
  if (c.maxLength !== undefined) base.maxLength = c.maxLength
  if (c.required !== undefined) base.required = c.required
  if (c.value !== undefined) base.value = c.value

  // Components V2
  if (c.content !== undefined) base.content = c.content
  if (c.accessory) base.accessory = await serializeComponent(c.accessory, assets)
  if (c.spoiler !== undefined) base.spoiler = c.spoiler
  if (c.divider !== undefined) base.divider = c.divider
  if (c.spacing !== undefined) base.spacing = c.spacing
  if (c.accentColor !== undefined) base.accentColor = c.accentColor

  // MediaGallery items
  if (Array.isArray(c.items)) {
    base.items = []
    for (const it of c.items) {
      const mediaUrl = it.media?.url ?? it.url
      base.items.push({
        media: mediaUrl
          ? { url: mediaUrl, dataUrl: await assets.toDataUrl(mediaUrl) }
          : undefined,
        description: it.description,
        spoiler: it.spoiler
      })
    }
  }

  // File component
  if (c.file) {
    base.file = {
      url: c.file.url,
      name: c.file.name,
      size: c.file.size,
      dataUrl: await assets.toDataUrl(c.file.url)
    }
  }

  return base
}

async function serializeUser(
  u: User,
  member?: GuildMember,
  assets?: AssetCache,
  channel?: TextBasedChannel
): Promise<UserInfo> {
  const avatar = (member?.displayAvatarURL?.({ size: 128 }) ??
    u.displayAvatarURL?.({ size: 128 })) as string | undefined
  const roles = member?.roles?.cache
    ? [...member.roles.cache.values()]
        .filter((r) => r.id !== member.guild.id) // @everyone 제외
        .sort((a, b) => b.position - a.position)
        .map((r) => ({
          id: r.id,
          name: r.name,
          color: r.hexColor,
          position: r.position
        }))
    : undefined

  let permissions: string[] | undefined
  if (member && channel && typeof (channel as any).permissionsFor === 'function') {
    try {
      const p = (channel as any).permissionsFor(member)
      if (p) permissions = p.toArray()
    } catch {
      /* noop */
    }
  }

  return {
    id: u.id,
    tag: (u as any).tag ?? `${u.username}#${u.discriminator ?? '0'}`,
    username: u.username,
    displayName: member?.displayName ?? (u as any).globalName ?? u.username,
    avatarUrl: avatar,
    avatarDataUrl: assets ? await assets.toDataUrl(avatar) : undefined,
    bot: u.bot,
    roleColor: member?.roles?.color?.hexColor,
    roles,
    permissions,
    joinedAt: member?.joinedAt?.toISOString()
  }
}

export function inferGuildChannelName(channel: TextBasedChannel): string {
  return (channel as GuildTextBasedChannel).name ?? (channel as any).recipient?.username ?? channel.id
}
