# discord-ticket-transcript

Archive any Discord channel (tickets, support rooms, chat logs) into a **single self-contained HTML file** with embedded structured JSON data.

- 📄 **One file** — Discord-style HTML viewer + machine-readable JSON, all in one
- 🖼 **Survives CDN expiry** — every image, attachment, emoji and avatar is inlined as base64
- 🌍 **24 built-in languages** — English, 한국어, 日本語, 中文 (简/繁), Español, Português (BR), Français, Deutsch, Italiano, Русский, Türkçe, Polski, Nederlands, العربية, हिन्दी, Bahasa Indonesia, Tiếng Việt, ไทย, Українська, Čeština, Svenska, Suomi, Ελληνικά
- 🧩 **Every Discord surface** — embeds, reactions, buttons, select menus, modals, stickers, threads, system messages, and **Components V2** (Container / Section / TextDisplay / MediaGallery / Separator / File / Thumbnail)
- 🖱 **Interactive viewer** — right-click to copy message / user IDs & text, click avatar to see role/permission snapshot, click reactions to see who reacted, click reply to jump + highlight original message
- 🌓 **Dark / light theme toggle**
- 📦 **JSON + plain-text export** — download buttons baked into the HTML
- 👥 **Captures viewer snapshot** — which roles and members could see the channel at close time

---

## Install

```bash
npm install discord-ticket-transcript discord.js
# or
yarn add discord-ticket-transcript discord.js
```

> `discord.js` is a **peer dependency** (v14+). Install it alongside.

**Node.js 16.9+** required.

---

## Quick start

```ts
import { TicketTranscript, toAttachment } from 'discord-ticket-transcript'

// When a ticket is being closed:
const file = await TicketTranscript.create(channel, {
  ticketId: '0042',
  opener: openerUser,
  closedBy: interaction.user,
  category: 'Purchase inquiry',
  theme: 'toggle',
  languages: 'all',          // or 'ko' / ['ko','en','ja']
  defaultLanguage: 'en',
  meta: { orderId: 'A-12345', totalPrice: 39900 }
})

// Upload to a log channel
await logChannel.send({
  content: `Archived ticket: ${file.name}`,
  files: [toAttachment(file)]
})

// Or write to disk
import { writeFile } from 'node:fs/promises'
await writeFile(`./tickets/${file.name}`, file.buffer)
```

Open the generated `.html` in any browser. All assets are self-contained; no network access required.

---

## API

### `TicketTranscript.create(channel, options?) → Promise<TranscriptFile>`

Auto-fetches every message, reaction, attachment, embed, component, participant, and viewer from the given channel, then produces a single HTML file with embedded JSON data.

```ts
interface CreateOptions {
  ticketId?: string               // default: channel.id
  opener?: User | GuildMember
  closedBy?: User | GuildMember
  category?: string               // e.g. 'Purchase', 'Refund', 'Report'
  meta?: Record<string, unknown>  // free-form payload stored in the JSON

  theme?: 'dark' | 'light' | 'toggle'   // default: 'toggle'
  languages?: 'all' | LangCode | LangCode[]   // default: 'all'
  defaultLanguage?: LangCode                   // default: first in languages

  inlineAssets?: boolean          // base64-embed images/attachments (default true)
  maxAssetSize?: number           // skip embedding files larger than N bytes (default 8 MB)
  limit?: number                  // cap on messages to fetch (default unlimited)

  filename?: string               // default: ticket-<id>.html
  onProgress?: (info: { fetched: number }) => void
}

// Returns:
{ name: string, buffer: Buffer, attachment: Buffer }
```

### `toAttachment(file) → AttachmentBuilder`

Wraps the result for `channel.send({ files: [...] })`.

### `TicketTranscript.extract(input) → Promise<TicketTranscriptData>`

Pulls the embedded JSON back out of any previously generated HTML file. Accepts a file path, a `Buffer`, or an HTML string.

```ts
const data = await TicketTranscript.extract('./tickets/ticket-0042.html')
console.log(data.stats.totalMessages)
console.log(data.messages.length)
console.log(data.channel.viewers?.roles)
```

### `TicketTranscript.aggregate(dir) → Promise<{ count, totalMessages, tickets }>`

Scans a directory of HTML transcripts and aggregates stats.

### i18n helpers

```ts
import {
  SUPPORTED_LANGUAGE_CODES,    // ['en','ko','ja','zh-CN', ... 24 codes]
  LANGUAGE_DESCRIPTIONS,       // { ko: '한국어 (Korean)', ... }
  LOCALES,                     // full translation dictionaries
  DEFAULT_LANGUAGE,            // 'en'
  resolveLanguages
} from 'discord-ticket-transcript'
```

---

## What's inside the generated HTML

| Section | Contents |
|---|---|
| `<header>` | Title, channel/guild, time range, language selector, theme toggle, JSON/TXT download |
| `<div class="tt-details">` | Collapsible summary cards, participants (users / bots split), channel viewers (roles / users / bots) |
| `<main class="tt-messages">` | Discord-styled message list |
| `<script id="ticket-data" type="application/json">` | Full `TicketTranscriptData` (see types) |
| `<script id="ticket-i18n" type="application/json">` | Translation dictionaries for chosen languages |
| `<script id="ticket-text" type="text/plain">` | Plain-text dump for one-click export |

The viewer script handles:
- **Right-click menus** — copy user ID / username / message ID / message text / message link
- **Reply clicks** — smooth-scroll to the original message + 2s highlight flash
- **Avatar/name clicks** — profile modal with role chips, **permissions** at close-time, join date
- **Reaction clicks** — popup with the list of people who reacted
- **Theme / language toggles** — live switch, no page reload

---

## Data model (excerpt)

```ts
interface TicketTranscriptData {
  version: string
  generatedAt: string
  ticket: { id, category?, createdAt?, closedAt }
  guild: { id, name, iconUrl? }
  channel: {
    id, name, topic?, type, parentId?, parentName?,
    viewers?: {
      roles: RoleBrief[],
      members: UserInfo[],     // each with roles[] + permissions[]
      truncated?: boolean
    }
  }
  opener?: UserInfo
  closedBy?: UserInfo
  participants: ParticipantInfo[]
  messages: TranscriptMessage[]   // with attachments, embeds, components,
                                  // stickers, reactions (+ who reacted)
  stats: { totalMessages, userMessages, staffMessages, botMessages,
           attachmentCount, embedCount, reactionCount,
           participantCount, durationMs, durationHuman }
  meta?: Record<string, unknown>
}
```

Full TypeScript types are shipped in the package (`dist/*.d.ts`).

---

## Language options

```ts
// 1) Show language dropdown for every supported language (default)
languages: 'all'

// 2) Lock to a single language — dropdown hidden
languages: 'ko'

// 3) Offer a curated subset — dropdown visible with only these
languages: ['en', 'ko', 'ja', 'zh-CN', 'zh-TW']

// Plus: which language to show first
defaultLanguage: 'en'
```

Built-in language codes:

| | | | |
|---|---|---|---|
| `en` — English | `ko` — 한국어 | `ja` — 日本語 | `zh-CN` — 简体中文 |
| `zh-TW` — 繁體中文 | `es` — Español | `pt-BR` — Português (BR) | `fr` — Français |
| `de` — Deutsch | `it` — Italiano | `ru` — Русский | `tr` — Türkçe |
| `pl` — Polski | `nl` — Nederlands | `ar` — العربية | `hi` — हिन्दी |
| `id` — Bahasa Indonesia | `vi` — Tiếng Việt | `th` — ไทย | `uk` — Українська |
| `cs` — Čeština | `sv` — Svenska | `fi` — Suomi | `el` — Ελληνικά |

Message text and user identifiers are **never** translated — only UI chrome, summary cards, modal labels, permissions, context menu, and time units.

---

## Requirements and caveats

- **Bot intents** — enable `GuildMessages`, `MessageContent`, `GuildMembers`, `GuildMessageReactions`. Otherwise message content, member data, and reaction-user lookups will be empty.
- **Permissions** — the bot needs `View Channel` + `Read Message History` on the target channel. For reactor lookups, no extra permission is needed beyond reading the channel.
- **Asset inlining** — `inlineAssets: true` (default) downloads every attachment; large channels can produce multi-MB HTML files. Cap via `maxAssetSize`. Setting `inlineAssets: false` keeps raw Discord URLs which eventually expire (~24h).
- **Rate limits** — message fetch pages of 100 are sequential; 10k-message channels take roughly a minute.

---

## License

GPL-3.0
