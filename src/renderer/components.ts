import {
  TranscriptMessage,
  AttachmentInfo,
  EmbedInfo,
  ComponentInfo,
  ReactionInfo,
  StickerInfo
} from '../types'
import { escapeHtml, colorToHex } from '../utils/escape'
import { renderMarkdown } from './markdown'

const MSG_FLAG_COMPONENTS_V2 = 1 << 15

export function renderMessage(msg: TranscriptMessage, prev?: TranscriptMessage): string {
  const grouped =
    prev &&
    prev.author.id === msg.author.id &&
    !msg.reference &&
    new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000

  if (msg.system) return renderSystemMessage(msg)

  const avatarSrc = msg.author.avatarDataUrl ?? msg.author.avatarUrl
  const avatar = avatarSrc
    ? `<img class="avatar" src="${escapeHtml(avatarSrc)}" alt="" data-user-id="${escapeHtml(msg.author.id)}">`
    : `<div class="avatar" data-user-id="${escapeHtml(msg.author.id)}"></div>`
  const badge = msg.author.bot
    ? `<span class="badge" data-i18n="modal.bot"></span>`
    : msg.author.isStaff
    ? `<span class="badge staff" data-i18n="modal.staff"></span>`
    : ''
  const nameStyle = msg.author.roleColor ? ` style="color:${escapeHtml(msg.author.roleColor)}"` : ''

  const head = grouped
    ? ''
    : `<div class="head">
         <span class="author"${nameStyle} data-user-id="${escapeHtml(msg.author.id)}">${escapeHtml(msg.author.displayName ?? msg.author.username)}</span>
         ${badge}
         <span class="timestamp" title="${escapeHtml(msg.createdAt)}">${formatDate(msg.createdAt)}</span>
       </div>`

  const reply = msg.reference?.messageId ? renderReply(msg) : ''

  const isV2 = (msg.flags & MSG_FLAG_COMPONENTS_V2) !== 0
  const content = isV2
    ? '' // v2 에서는 content 대신 TextDisplay 컴포넌트를 사용
    : renderContent(msg)
  const edited = msg.editedAt ? `<span class="edited" data-i18n="messages.edited"></span>` : ''

  const attachments = msg.attachments.length ? renderAttachments(msg.attachments) : ''
  const stickers = msg.stickers.length ? renderStickers(msg.stickers) : ''
  const embeds = msg.embeds.map(renderEmbed).join('')
  const components = msg.components.length ? renderComponentTree(msg.components) : ''
  const reactions = msg.reactions.length ? renderReactions(msg.reactions) : ''

  return `
<div class="tt-msg${grouped ? ' grouped' : ''}" data-message-id="${msg.id}" data-user-id="${escapeHtml(msg.author.id)}">
  ${avatar}
  <div class="body">
    ${reply}
    ${head}
    ${content ? `<div class="content" data-raw="${escapeHtml(msg.content ?? '')}">${content}${edited}</div>` : ''}
    ${attachments}
    ${stickers}
    ${embeds}
    ${components}
    ${reactions}
  </div>
</div>`
}

function renderContent(msg: TranscriptMessage): string {
  if (!msg.content) return ''
  // 이모지 전용 메시지(짧은 content 에 custom emoji 만) → jumbo
  const content = renderMarkdown(msg.content, msg)
  const isOnlyEmoji = /^(\s|<img [^>]*tt-emoji[^>]*>)+$/.test(content)
  return isOnlyEmoji ? content.replace(/tt-emoji/g, 'tt-emoji jumbo') : content
}

function renderReply(msg: TranscriptMessage): string {
  const targetId = msg.reference?.messageId ?? ''
  const argsAttr = escapeHtml(JSON.stringify({ id: targetId }))
  return `<div class="tt-reply" data-target-message-id="${escapeHtml(targetId)}" data-i18n-title="reply.hoverTitle">
    <span>↩</span>
    <span data-i18n="reply.label" data-i18n-args="${argsAttr}"></span>
  </div>`
}

function renderSystemMessage(msg: TranscriptMessage): string {
  if (msg.content) {
    return `<div class="tt-system" data-message-id="${msg.id}">
      ${escapeHtml(msg.content)} · <span class="timestamp">${formatDate(msg.createdAt)}</span>
    </div>`
  }
  const argsAttr = escapeHtml(JSON.stringify({ type: msg.type }))
  return `<div class="tt-system" data-message-id="${msg.id}">
    <span data-i18n="messages.systemMessage" data-i18n-args="${argsAttr}"></span> · <span class="timestamp">${formatDate(msg.createdAt)}</span>
  </div>`
}

function renderAttachments(atts: AttachmentInfo[]): string {
  const out: string[] = ['<div class="tt-attachments">']
  for (const a of atts) {
    const src = a.dataUrl ?? a.url
    const isImage = (a.contentType ?? '').startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(a.name)
    const isVideo = (a.contentType ?? '').startsWith('video/') || /\.(mp4|webm|mov)$/i.test(a.name)
    const isAudio = (a.contentType ?? '').startsWith('audio/') || /\.(mp3|ogg|wav)$/i.test(a.name)
    if (isImage) {
      out.push(
        `<a href="${escapeHtml(src)}" target="_blank"><img class="tt-attachment-img" src="${escapeHtml(src)}" alt="${escapeHtml(a.name)}"></a>`
      )
    } else if (isVideo) {
      out.push(`<video class="tt-attachment-img" controls src="${escapeHtml(src)}"></video>`)
    } else if (isAudio) {
      out.push(`<audio controls src="${escapeHtml(src)}"></audio>`)
    } else {
      out.push(`
        <a class="tt-attachment-file" href="${escapeHtml(src)}" download="${escapeHtml(a.name)}" target="_blank">
          <span class="icon">📎</span>
          <div>
            <div class="name">${escapeHtml(a.name)}</div>
            <div class="size">${formatSize(a.size)}</div>
          </div>
        </a>`)
    }
  }
  out.push('</div>')
  return out.join('')
}

function renderStickers(stickers: StickerInfo[]): string {
  return (
    '<div class="tt-sticker">' +
    stickers
      .map((s) => `<img src="${escapeHtml(s.dataUrl ?? s.url)}" alt="${escapeHtml(s.name)}" title="${escapeHtml(s.name)}">`)
      .join('') +
    '</div>'
  )
}

function renderReactions(rs: ReactionInfo[]): string {
  return (
    '<div class="tt-reactions">' +
    rs
      .map((r, idx) => {
        const inner = r.emoji.dataUrl || r.emoji.url
          ? `<img class="tt-emoji" src="${escapeHtml(r.emoji.dataUrl ?? r.emoji.url!)}" alt=":${escapeHtml(r.emoji.name)}:">`
          : escapeHtml(r.emoji.name)
        const userIds = (r.users ?? []).map((u) => u.id).join(',')
        const names = (r.users ?? []).map((u) => u.displayName ?? u.username).join(',')
        const overflow = r.usersTruncated ? Math.max(0, r.count - (r.users?.length ?? 0)) : 0
        return `<span class="tt-reaction" data-reaction-index="${idx}" data-reaction-users="${escapeHtml(userIds)}" data-reaction-names="${escapeHtml(names)}" data-reaction-overflow="${overflow}">${inner} ${r.count}</span>`
      })
      .join('') +
    '</div>'
  )
}

function renderEmbed(e: EmbedInfo): string {
  const color = colorToHex(e.color) ?? '#5865f2'
  const author = e.author
    ? `<div class="author">
        ${e.author.iconDataUrl || e.author.iconUrl ? `<img src="${escapeHtml(e.author.iconDataUrl ?? e.author.iconUrl!)}" alt="">` : ''}
        ${e.author.url ? `<a href="${escapeHtml(e.author.url)}" target="_blank">${escapeHtml(e.author.name)}</a>` : escapeHtml(e.author.name)}
      </div>`
    : ''
  const title = e.title
    ? `<div class="title">${e.url ? `<a href="${escapeHtml(e.url)}" target="_blank">${escapeHtml(e.title)}</a>` : escapeHtml(e.title)}</div>`
    : ''
  const desc = e.description ? `<div class="description">${renderMarkdown(e.description)}</div>` : ''
  const fields = e.fields.length
    ? `<div class="fields">${e.fields
        .map(
          (f) => `<div class="field${f.inline ? ' inline' : ''}">
            <div class="name">${escapeHtml(f.name)}</div>
            <div class="value">${renderMarkdown(f.value)}</div>
          </div>`
        )
        .join('')}</div>`
    : ''
  const image = e.image
    ? `<div class="image"><img src="${escapeHtml(e.image.dataUrl ?? e.image.url)}" alt=""></div>`
    : ''
  const thumb = e.thumbnail
    ? `<div class="thumb"><img src="${escapeHtml(e.thumbnail.dataUrl ?? e.thumbnail.url)}" alt=""></div>`
    : ''
  const footer = e.footer || e.timestamp
    ? `<div class="footer">
         ${e.footer?.iconDataUrl || e.footer?.iconUrl ? `<img src="${escapeHtml(e.footer.iconDataUrl ?? e.footer.iconUrl!)}" alt="">` : ''}
         <span>${escapeHtml(e.footer?.text ?? '')}${e.footer?.text && e.timestamp ? ' · ' : ''}${e.timestamp ? formatDate(e.timestamp) : ''}</span>
       </div>`
    : ''

  return `<div class="tt-embed">
    <div class="bar" style="background:${color}"></div>
    <div class="main">${author}${title}${desc}${fields}</div>
    ${thumb}
    ${image}
    ${footer}
  </div>`
}

function renderComponentTree(components: ComponentInfo[]): string {
  return `<div class="tt-components">${components.map(renderComponent).join('')}</div>`
}

function renderComponent(c: ComponentInfo): string {
  switch (c.type) {
    case 1: // ActionRow
      return `<div class="tt-action-row">${(c.components ?? []).map(renderComponent).join('')}</div>`
    case 2: // Button
      return renderButton(c)
    case 3: // StringSelect
    case 5: // UserSelect
    case 6: // RoleSelect
    case 7: // MentionableSelect
    case 8: // ChannelSelect
      return renderSelect(c)
    case 4: // TextInput (Modal)
      return `<div class="tt-component-select">📝 ${escapeHtml(c.label ?? c.placeholder ?? 'Text Input')}: ${escapeHtml(c.value ?? '')}</div>`
    case 9: // Section
      return `<div class="tt-section">
        <div class="main" style="flex:1">${(c.components ?? []).map(renderComponent).join('')}</div>
        ${c.accessory ? `<div class="accessory">${renderComponent(c.accessory)}</div>` : ''}
      </div>`
    case 10: // TextDisplay
      return `<div class="content">${renderMarkdown(c.content ?? '')}</div>`
    case 11: // Thumbnail
      return renderThumbnail(c)
    case 12: // MediaGallery
      return renderMediaGallery(c)
    case 13: // File
      return renderFileComponent(c)
    case 14: // Separator
      return `<div class="tt-separator${c.divider ? ' divider' : ''}${c.spacing === 2 ? ' big' : ''}"></div>`
    case 17: // Container
      return `<div class="tt-container${c.accentColor != null ? ' accent' : ''}"${c.accentColor != null ? ` style="border-left-color:${colorToHex(c.accentColor)}"` : ''}>
        ${(c.components ?? []).map(renderComponent).join('')}
      </div>`
    default:
      return `<div class="tt-component-select">알 수 없는 컴포넌트 (type=${c.type})</div>`
  }
}

function renderButton(c: ComponentInfo): string {
  const emoji = c.emoji
    ? c.emoji.id
      ? `<img class="tt-emoji" src="${escapeHtml(c.emoji.dataUrl ?? c.emoji.url ?? '')}" alt="">`
      : escapeHtml(c.emoji.name ?? '')
    : ''
  const label = escapeHtml(c.label ?? '')
  const attrs = `data-style="${c.style ?? 2}"${c.disabled ? ' disabled' : ''}`
  if (c.style === 5 && c.url) {
    return `<a class="tt-component-btn" ${attrs} href="${escapeHtml(c.url)}" target="_blank">${emoji}${label} ↗</a>`
  }
  return `<button class="tt-component-btn" ${attrs}>${emoji}${label}</button>`
}

function renderSelect(c: ComponentInfo): string {
  const placeholder = escapeHtml(c.placeholder ?? '선택')
  const selected = (c.options ?? []).filter((o) => o.default).map((o) => o.label)
  const label = selected.length ? selected.join(', ') : placeholder
  return `<div class="tt-component-select">▾ ${label}</div>`
}

function renderThumbnail(c: ComponentInfo): string {
  const url = c.items?.[0]?.media?.dataUrl ?? c.items?.[0]?.media?.url ?? (c as any).media?.url
  if (!url) return ''
  return `<img class="tt-attachment-img" src="${escapeHtml(url)}" alt="">`
}

function renderMediaGallery(c: ComponentInfo): string {
  const items = (c.items ?? [])
    .map((it) => {
      const src = it.media?.dataUrl ?? it.media?.url
      if (!src) return ''
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(it.description ?? '')}">`
    })
    .join('')
  return `<div class="tt-media-gallery">${items}</div>`
}

function renderFileComponent(c: ComponentInfo): string {
  const f = c.file
  if (!f) return ''
  const src = f.dataUrl ?? f.url
  return `<a class="tt-attachment-file" href="${escapeHtml(src)}" download="${escapeHtml(f.name ?? 'file')}" target="_blank">
    <span class="icon">📎</span>
    <div>
      <div class="name">${escapeHtml(f.name ?? 'file')}</div>
      <div class="size">${formatSize(f.size ?? 0)}</div>
    </div>
  </a>`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatSize(size: number): string {
  if (!size) return ''
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(2)} MB`
}
