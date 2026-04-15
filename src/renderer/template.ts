import { TicketTranscriptData, ThemeMode, ParticipantInfo, UserInfo } from '../types'
import { Translations } from '../i18n/types'
import { STYLES } from './styles'
import { renderMessage } from './components'
import { renderPlainText } from './markdown'
import { escapeHtml, escapeJsonForScript } from '../utils/escape'

export interface TemplateOptions {
  theme: ThemeMode
  locales: Translations[]
  defaultLanguageCode: string
  allowLanguageToggle: boolean
}

export function renderHtml(data: TicketTranscriptData, opts: TemplateOptions): string {
  const defaultTheme = opts.theme === 'light' ? 'light' : 'dark'
  const canToggleTheme = opts.theme === 'toggle'
  const canToggleLang = opts.allowLanguageToggle
  const locales = opts.locales
  const localeMap: Record<string, Translations> = {}
  for (const l of locales) localeMap[l.code] = l

  const messageHtml: string[] = []
  for (let i = 0; i < data.messages.length; i++) {
    messageHtml.push(renderMessage(data.messages[i], data.messages[i - 1]))
  }

  const textDump = buildTextDump(data, localeMap[opts.defaultLanguageCode] ?? locales[0])
  const title = `#${escapeHtml(data.ticket.id)} - ${escapeHtml(data.channel.name)}`
  const fileId = escapeJsForAttr(data.ticket.id)

  const langSelector = canToggleLang
    ? `<select class="tt-btn" id="tt-lang-select" aria-label="language">${locales
        .map(
          (l) =>
            `<option value="${escapeHtml(l.code)}"${l.code === opts.defaultLanguageCode ? ' selected' : ''}>${escapeHtml(l.name)}</option>`
        )
        .join('')}</select>`
    : ''

  return `<!DOCTYPE html>
<html lang="${escapeHtml(opts.defaultLanguageCode)}" data-theme="${defaultTheme}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>${STYLES}</style>
</head>
<body>
<header class="tt-header">
  <div>
    <div class="title">${title}</div>
    <div class="meta">${escapeHtml(data.guild.name)} · ${formatDate(data.ticket.createdAt)} → ${formatDate(data.ticket.closedAt)} · <span id="tt-duration" data-duration-ms="${data.stats.durationMs ?? ''}">${escapeHtml(data.stats.durationHuman ?? '-')}</span></div>
  </div>
  <div style="flex:1"></div>
  <div class="tt-actions">
    ${langSelector}
    <button class="tt-btn" id="tt-details-toggle" data-i18n="header.detailsToggle"></button>
    ${canToggleTheme ? `<button class="tt-btn" id="tt-theme-toggle" data-i18n="header.themeToggle"></button>` : ''}
    <button class="tt-btn" id="tt-download-json" data-i18n="header.downloadJson"></button>
    <button class="tt-btn" id="tt-download-text" data-i18n="header.downloadText"></button>
  </div>
</header>

<div class="tt-details" id="tt-details">
  <section class="tt-summary">
    <div class="card"><div class="label" data-i18n="summary.ticketId"></div><div class="value">${escapeHtml(data.ticket.id)}</div></div>
    <div class="card"><div class="label" data-i18n="summary.category"></div><div class="value">${escapeHtml(data.ticket.category ?? '-')}</div></div>
    <div class="card"><div class="label" data-i18n="summary.opener"></div><div class="value">${escapeHtml(data.opener?.displayName ?? data.opener?.username ?? '-')}</div></div>
    <div class="card"><div class="label" data-i18n="summary.closedBy"></div><div class="value">${escapeHtml(data.closedBy?.displayName ?? data.closedBy?.username ?? '-')}</div></div>
    <div class="card"><div class="label" data-i18n="summary.totalMessages"></div><div class="value">${data.stats.totalMessages}</div></div>
    <div class="card"><div class="label" data-i18n="summary.participants"></div><div class="value">${data.stats.participantCount}</div></div>
    <div class="card"><div class="label" data-i18n="summary.attachmentsEmbeds"></div><div class="value">${data.stats.attachmentCount} / ${data.stats.embedCount}</div></div>
    <div class="card"><div class="label" data-i18n="summary.duration"></div><div class="value" id="tt-duration-card" data-duration-ms="${data.stats.durationMs ?? ''}">${escapeHtml(data.stats.durationHuman ?? '-')}</div></div>
  </section>

  ${renderParticipantsSection(data)}
  ${renderViewersSection(data)}
</div>

<main class="tt-messages">
  ${messageHtml.join('\n')}
</main>

<footer class="tt-footer">
  <span data-i18n="footer" data-i18n-args='${escapeHtml(JSON.stringify({ version: data.version, time: data.generatedAt }))}'></span>
</footer>

<div class="tt-ctx-menu" id="tt-ctx-menu"></div>
<div class="tt-reaction-pop" id="tt-reaction-pop"></div>
<div class="tt-modal-backdrop" id="tt-modal-backdrop">
  <div class="tt-modal" id="tt-modal" style="position:relative">
    <button class="close" id="tt-modal-close" aria-label="close">×</button>
    <div class="banner"></div>
    <div class="avatar-wrap"><img id="tt-modal-avatar" src="" alt=""></div>
    <div class="body">
      <div class="name" id="tt-modal-name"></div>
      <div class="tag" id="tt-modal-tag"></div>
      <div class="row"><div class="label" data-i18n="modal.id"></div><div class="value" id="tt-modal-id"></div></div>
      <div class="row"><div class="label" data-i18n="modal.joined"></div><div class="value" id="tt-modal-joined"></div></div>
      <div class="row" style="flex-direction:column"><div class="label" data-i18n="modal.roles"></div><div class="roles" id="tt-modal-roles"></div></div>
      <div class="row" style="flex-direction:column"><div class="label" data-i18n="modal.permissions"></div><div class="perms" id="tt-modal-perms"></div></div>
    </div>
  </div>
</div>
<div class="tt-toast" id="tt-toast"></div>

<script id="ticket-data" type="application/json">${escapeJsonForScript(data)}</script>
<script id="ticket-i18n" type="application/json">${escapeJsonForScript({ default: opts.defaultLanguageCode, locales: localeMap })}</script>
<script id="ticket-text" type="text/plain">${escapeHtml(textDump)}</script>
<script>
(function() {
  var DATA = JSON.parse(document.getElementById('ticket-data').textContent);
  var I18N = JSON.parse(document.getElementById('ticket-i18n').textContent);
  var LOCALES = I18N.locales;
  var CURRENT = I18N.default;

  // USER 인덱스
  var USERS = {};
  (DATA.participants || []).forEach(function(p){ USERS[p.id] = p; });
  ((DATA.channel && DATA.channel.viewers && DATA.channel.viewers.members) || []).forEach(function(m){ if(!USERS[m.id]) USERS[m.id] = m; });
  if (DATA.opener) USERS[DATA.opener.id] = USERS[DATA.opener.id] || DATA.opener;
  if (DATA.closedBy) USERS[DATA.closedBy.id] = USERS[DATA.closedBy.id] || DATA.closedBy;
  (DATA.messages || []).forEach(function(m) {
    (m.reactions || []).forEach(function(r) { (r.users || []).forEach(function(u){ if(!USERS[u.id]) USERS[u.id] = u; }); });
    (m.mentions && m.mentions.users || []).forEach(function(u){ if(!USERS[u.id]) USERS[u.id] = u; });
  });

  // ── i18n ──
  function getByPath(obj, path) {
    var parts = path.split('.');
    var cur = obj;
    for (var i = 0; i < parts.length; i++) { if (cur == null) return null; cur = cur[parts[i]]; }
    return cur;
  }
  function interp(tpl, args) {
    if (!args) return tpl;
    return String(tpl).replace(/\\{(\\w+)\\}/g, function(_, k){ return args[k] != null ? args[k] : '{' + k + '}'; });
  }
  function t(key, args) {
    var loc = LOCALES[CURRENT] || LOCALES[I18N.default];
    var v = getByPath(loc && loc.ui, key);
    if (v == null) v = getByPath(LOCALES[I18N.default] && LOCALES[I18N.default].ui, key);
    if (v == null) return key;
    return interp(v, args);
  }
  function tRoot(key, args) {
    var loc = LOCALES[CURRENT] || LOCALES[I18N.default];
    var v = getByPath(loc, key);
    if (v == null) return key;
    return typeof v === 'string' ? interp(v, args) : v;
  }
  function permLabel(name) {
    var loc = LOCALES[CURRENT] || LOCALES[I18N.default];
    return (loc.permissions && loc.permissions[name]) || name;
  }
  function humanizeDuration(ms) {
    if (ms == null || ms === '') return '-';
    ms = Math.max(0, Number(ms));
    var loc = LOCALES[CURRENT] || LOCALES[I18N.default];
    var u = loc.duration || { days: 'd', hours: 'h', minutes: 'm', seconds: 's' };
    var s = Math.floor(ms / 1000) % 60;
    var m = Math.floor(ms / 60000) % 60;
    var h = Math.floor(ms / 3600000) % 24;
    var d = Math.floor(ms / 86400000);
    var parts = [];
    if (d) parts.push(d + u.days);
    if (h) parts.push(h + u.hours);
    if (m) parts.push(m + u.minutes);
    if (s || !parts.length) parts.push(s + u.seconds);
    return parts.join(' ');
  }
  function applyI18n() {
    // data-i18n → textContent
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      var args = null;
      var a = el.getAttribute('data-i18n-args');
      if (a) { try { args = JSON.parse(a); } catch(e){} }
      el.textContent = key === 'footer' ? tRoot('ui.footer', args) : t(key, args);
    });
    // data-i18n-title → title attr
    document.querySelectorAll('[data-i18n-title]').forEach(function(el) {
      el.title = t(el.getAttribute('data-i18n-title'));
    });
    // 지속시간 재계산
    ['tt-duration','tt-duration-card'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.textContent = humanizeDuration(el.getAttribute('data-duration-ms'));
    });
    // 반응 title 재계산
    document.querySelectorAll('.tt-reaction').forEach(function(el) {
      var names = el.getAttribute('data-reaction-names') || '';
      var overflow = Number(el.getAttribute('data-reaction-overflow') || 0);
      if (names) {
        var title = names.split(',').join(', ');
        if (overflow > 0) title += ' ' + t('reactions.overflow', { count: overflow });
        el.title = title;
      } else {
        el.title = t('reactions.noUsersTooltip');
      }
    });
    // <html lang>
    document.documentElement.setAttribute('lang', CURRENT);
  }
  function setLang(code) {
    if (!LOCALES[code]) return;
    CURRENT = code;
    applyI18n();
  }

  // 초기 적용
  applyI18n();

  // 언어 선택기
  var langSel = document.getElementById('tt-lang-select');
  if (langSel) langSel.addEventListener('change', function(){ setLang(this.value); });

  // 테마 토글
  var themeBtn = document.getElementById('tt-theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', function() {
    var html = document.documentElement;
    html.setAttribute('data-theme', html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  // 상세 토글
  var detailsBtn = document.getElementById('tt-details-toggle');
  var detailsPanel = document.getElementById('tt-details');
  if (detailsBtn && detailsPanel) detailsBtn.addEventListener('click', function() {
    detailsPanel.classList.toggle('open');
  });

  // 다운로드
  function download(filename, content, mime) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
  }
  var dj = document.getElementById('tt-download-json');
  if (dj) dj.addEventListener('click', function() {
    download('ticket-${fileId}.json', document.getElementById('ticket-data').textContent, 'application/json');
  });
  var dt = document.getElementById('tt-download-text');
  if (dt) dt.addEventListener('click', function() {
    download('ticket-${fileId}.txt', document.getElementById('ticket-text').textContent, 'text/plain;charset=utf-8');
  });

  // 토스트
  var toastEl = document.getElementById('tt-toast');
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toastEl.classList.remove('show'); }, 1600);
  }

  // 클립보드
  function copy(text) {
    if (!text) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function(){ toast(t('toast.copied')); }, fallback);
    } else fallback();
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast(t('toast.copied')); } catch(e){}
      document.body.removeChild(ta);
    }
  }

  // 컨텍스트 메뉴
  var menu = document.getElementById('tt-ctx-menu');
  function openMenu(x, y, items) {
    menu.innerHTML = '';
    items.forEach(function(it) {
      if (it.sep) { var s = document.createElement('div'); s.className = 'sep'; menu.appendChild(s); return; }
      if (it.header) { var h = document.createElement('div'); h.className = 'hdr'; h.textContent = it.header; menu.appendChild(h); return; }
      var el = document.createElement('div'); el.className = 'item'; el.textContent = it.label;
      el.addEventListener('click', function(e){ e.stopPropagation(); closeMenu(); it.onClick(); });
      menu.appendChild(el);
    });
    menu.style.left = Math.min(x, window.innerWidth - 220) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - menu.offsetHeight - 20) + 'px';
    menu.classList.add('open');
  }
  function closeMenu(){ menu.classList.remove('open'); }
  document.addEventListener('click', closeMenu);
  document.addEventListener('scroll', closeMenu, true);
  window.addEventListener('resize', closeMenu);

  document.addEventListener('contextmenu', function(e) {
    var userEl = e.target.closest('[data-user-id]');
    var msgEl = e.target.closest('.tt-msg');
    var items = [];
    if (userEl) {
      var uid = userEl.getAttribute('data-user-id');
      var user = USERS[uid] || { id: uid, username: uid };
      items.push({ header: user.displayName || user.username });
      items.push({ label: t('contextMenu.viewProfile'), onClick: function(){ showProfile(uid); } });
      items.push({ label: t('contextMenu.copyUserId'), onClick: function(){ copy(uid); } });
      items.push({ label: t('contextMenu.copyUsername'), onClick: function(){ copy(user.displayName || user.username || ''); } });
    }
    if (msgEl) {
      if (items.length) items.push({ sep: true });
      var mid = msgEl.getAttribute('data-message-id');
      items.push({ header: t('contextMenu.message') });
      items.push({ label: t('contextMenu.copyMessageId'), onClick: function(){ copy(mid); } });
      items.push({ label: t('contextMenu.copyMessageText'), onClick: function() {
        var contentEl = msgEl.querySelector('.content');
        var raw = contentEl ? (contentEl.getAttribute('data-raw') || contentEl.innerText) : '';
        copy(raw);
      }});
      items.push({ label: t('contextMenu.copyMessageLink'), onClick: function() {
        var url = 'https://discord.com/channels/' + (DATA.guild.id || '@me') + '/' + DATA.channel.id + '/' + mid;
        copy(url);
      }});
    }
    if (!items.length) return;
    e.preventDefault();
    openMenu(e.clientX, e.clientY, items);
  });

  // 반응 클릭 팝업
  var reactionPop = document.getElementById('tt-reaction-pop');
  function closeReactionPop(){ reactionPop.classList.remove('open'); }
  document.addEventListener('scroll', closeReactionPop, true);
  window.addEventListener('resize', closeReactionPop);
  document.addEventListener('click', function(e) {
    var reactionEl = e.target.closest('.tt-reaction');
    if (reactionEl) {
      e.stopPropagation();
      var idsAttr = reactionEl.getAttribute('data-reaction-users') || '';
      var ids = idsAttr ? idsAttr.split(',') : [];
      if (!ids.length) { toast(t('reactions.noUsers')); return; }
      reactionPop.innerHTML = '';
      var hdr = document.createElement('div'); hdr.className = 'hdr';
      hdr.textContent = t('reactions.reactedBy', { count: ids.length });
      reactionPop.appendChild(hdr);
      ids.forEach(function(uid) {
        var u = USERS[uid];
        var row = document.createElement('div'); row.className = 'row'; row.setAttribute('data-user-id', uid);
        var avatar = document.createElement('img');
        avatar.src = (u && (u.avatarDataUrl || u.avatarUrl)) || '';
        avatar.onerror = function(){ this.style.display = 'none'; };
        row.appendChild(avatar);
        var name = document.createElement('span');
        name.textContent = (u && (u.displayName || u.username)) || uid;
        row.appendChild(name);
        row.addEventListener('click', function(ev){ ev.stopPropagation(); closeReactionPop(); showProfile(uid); });
        reactionPop.appendChild(row);
      });
      var rect = reactionEl.getBoundingClientRect();
      reactionPop.classList.add('open');
      var top = Math.min(rect.bottom + 4, window.innerHeight - reactionPop.offsetHeight - 10);
      var left = Math.min(rect.left, window.innerWidth - reactionPop.offsetWidth - 10);
      reactionPop.style.top = top + 'px';
      reactionPop.style.left = Math.max(10, left) + 'px';
      return;
    }
    closeReactionPop();
  });

  // 답장 클릭 → 이동 + 하이라이트
  function jumpToMessage(mid) {
    if (!mid) return;
    var target = document.querySelector('.tt-msg[data-message-id="' + mid + '"]');
    if (!target) { toast(t('reply.notFound')); return; }
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.remove('tt-highlight');
    void target.offsetWidth;
    target.classList.add('tt-highlight');
    setTimeout(function(){ target.classList.remove('tt-highlight'); }, 2000);
  }
  document.addEventListener('click', function(e) {
    var reply = e.target.closest('.tt-reply');
    if (reply) { e.stopPropagation(); jumpToMessage(reply.getAttribute('data-target-message-id')); }
  });

  // 프로필 모달
  var modal = document.getElementById('tt-modal-backdrop');
  function showProfile(uid) {
    var u = USERS[uid];
    if (!u) return;
    document.getElementById('tt-modal-avatar').src = u.avatarDataUrl || u.avatarUrl || '';
    document.getElementById('tt-modal-name').textContent = u.displayName || u.username || t('modal.unknown');
    document.getElementById('tt-modal-tag').textContent = (u.tag || '') + (u.bot ? ' · ' + t('modal.bot') : u.isStaff ? ' · ' + t('modal.staff') : '');
    document.getElementById('tt-modal-id').textContent = u.id;
    document.getElementById('tt-modal-joined').textContent = u.joinedAt ? new Date(u.joinedAt).toLocaleString(CURRENT) : '-';

    var rolesEl = document.getElementById('tt-modal-roles');
    rolesEl.innerHTML = '';
    var roles = u.roles || [];
    if (!roles.length) {
      var empty = document.createElement('span');
      empty.style.cssText = 'color:var(--text-muted);font-size:12px';
      empty.textContent = t('modal.noRoles');
      rolesEl.appendChild(empty);
    } else {
      roles.forEach(function(r) {
        var c = document.createElement('span'); c.className = 'role-chip';
        var dot = document.createElement('span'); dot.className = 'dot';
        if (r.color && r.color !== '#000000') dot.style.background = r.color;
        c.appendChild(dot);
        var tn = document.createElement('span'); tn.textContent = r.name;
        if (r.color && r.color !== '#000000') tn.style.color = r.color;
        c.appendChild(tn);
        rolesEl.appendChild(c);
      });
    }

    var permsEl = document.getElementById('tt-modal-perms');
    permsEl.innerHTML = '';
    var perms = u.permissions || [];
    if (!perms.length) {
      var e2 = document.createElement('span');
      e2.style.cssText = 'color:var(--text-muted);font-size:12px';
      e2.textContent = t('modal.noPermissions');
      permsEl.appendChild(e2);
    } else {
      perms.forEach(function(p) {
        var c = document.createElement('span'); c.className = 'perm-chip';
        c.textContent = permLabel(p);
        c.title = p;
        permsEl.appendChild(c);
      });
    }
    modal.classList.add('open');
  }
  document.getElementById('tt-modal-close').addEventListener('click', function(){ modal.classList.remove('open'); });
  modal.addEventListener('click', function(e){ if (e.target === modal) modal.classList.remove('open'); });

  // 아바타/이름/칩 좌클릭 → 프로필
  document.addEventListener('click', function(e) {
    var avatarEl = e.target.closest('.tt-msg .avatar, .tt-msg .author, .tt-participants .chip, .tt-viewers .chip');
    if (!avatarEl) return;
    var uid = avatarEl.getAttribute('data-user-id') || (avatarEl.closest('[data-user-id]') && avatarEl.closest('[data-user-id]').getAttribute('data-user-id'));
    if (uid) { e.stopPropagation(); showProfile(uid); }
  });
})();
</script>
</body>
</html>`
}

function renderParticipantChip(p: ParticipantInfo | UserInfo, count?: number): string {
  const src = p.avatarDataUrl ?? p.avatarUrl
  const cnt = count ?? (p as ParticipantInfo).messageCount
  return `<span class="chip" data-user-id="${escapeHtml(p.id)}">
    ${src ? `<img src="${escapeHtml(src)}" alt="">` : ''}
    <span>${escapeHtml(p.displayName ?? p.username)}</span>
    ${p.isStaff ? `<span class="staff" data-i18n="modal.staff"></span>` : ''}
    ${cnt != null ? `<span style="color:var(--text-muted);font-size:12px">(${cnt})</span>` : ''}
  </span>`
}

function renderParticipantsSection(data: TicketTranscriptData): string {
  const users = data.participants.filter((p) => !p.bot)
  const bots = data.participants.filter((p) => p.bot)
  return `
<section class="tt-participants">
  <h3 data-i18n="participants.title"></h3>
  <div class="group">
    <span class="group-label" data-i18n="participants.users" data-i18n-args='${escapeHtml(JSON.stringify({ count: users.length }))}'></span>
    ${users.map((p) => renderParticipantChip(p)).join('') || '<span style="color:var(--text-muted);font-size:12px" data-i18n="participants.none"></span>'}
  </div>
  <div class="group" style="margin-top:6px">
    <span class="group-label" data-i18n="participants.bots" data-i18n-args='${escapeHtml(JSON.stringify({ count: bots.length }))}'></span>
    ${bots.map((p) => renderParticipantChip(p)).join('') || '<span style="color:var(--text-muted);font-size:12px" data-i18n="participants.none"></span>'}
  </div>
</section>`
}

function renderViewersSection(data: TicketTranscriptData): string {
  const v = data.channel.viewers
  if (!v || (!v.roles.length && !v.members.length)) return ''
  const roleChips = v.roles
    .map((r) => {
      const c = r.color && r.color !== '#000000' ? r.color : '#949ba4'
      return `<span class="role-chip"><span class="dot" style="background:${escapeHtml(c)}"></span>${escapeHtml(r.name)}</span>`
    })
    .join('')
  const users = v.members.filter((m) => !m.bot)
  const bots = v.members.filter((m) => m.bot)
  const userChips = users.map((m) => renderParticipantChip(m, undefined)).join('')
  const botChips = bots.map((m) => renderParticipantChip(m, undefined)).join('')
  const extraUsers = v.truncated ? '+' : ''
  return `
<section class="tt-viewers">
  <h3 data-i18n="viewers.title"></h3>
  <div class="group">
    <span class="group-label" data-i18n="viewers.roles" data-i18n-args='${escapeHtml(JSON.stringify({ count: v.roles.length }))}'></span>
    ${roleChips || '<span style="color:var(--text-muted);font-size:12px" data-i18n="viewers.none"></span>'}
  </div>
  <div class="group">
    <span class="group-label" data-i18n="viewers.users" data-i18n-args='${escapeHtml(JSON.stringify({ count: users.length + (v.truncated ? 0 : 0) }))}'>${extraUsers}</span>
    ${userChips || '<span style="color:var(--text-muted);font-size:12px" data-i18n="viewers.none"></span>'}
  </div>
  <div class="group">
    <span class="group-label" data-i18n="viewers.bots" data-i18n-args='${escapeHtml(JSON.stringify({ count: bots.length }))}'></span>
    ${botChips || '<span style="color:var(--text-muted);font-size:12px" data-i18n="viewers.none"></span>'}
  </div>
</section>`
}

function buildTextDump(data: TicketTranscriptData, loc: Translations): string {
  const lines: string[] = []
  const L = loc.ui
  lines.push(`═════════════════════════════════════════`)
  lines.push(`  #${data.ticket.id}`)
  lines.push(`═════════════════════════════════════════`)
  lines.push(`${L.summary.ticketId.padEnd(12)}: ${data.ticket.id}`)
  lines.push(`Guild/Channel: ${data.guild.name} / #${data.channel.name}`)
  if (data.ticket.category) lines.push(`${L.summary.category.padEnd(12)}: ${data.ticket.category}`)
  if (data.opener) lines.push(`${L.summary.opener.padEnd(12)}: ${data.opener.displayName ?? data.opener.username} (${data.opener.id})`)
  if (data.closedBy) lines.push(`${L.summary.closedBy.padEnd(12)}: ${data.closedBy.displayName ?? data.closedBy.username}`)
  if (data.ticket.createdAt) lines.push(`Created     : ${data.ticket.createdAt}`)
  lines.push(`Closed      : ${data.ticket.closedAt}`)
  if (data.stats.durationHuman) lines.push(`${L.summary.duration.padEnd(12)}: ${data.stats.durationHuman}`)
  lines.push(`${L.summary.totalMessages.padEnd(12)}: ${data.stats.totalMessages}`)
  lines.push(`${L.summary.participants.padEnd(12)}: ${data.stats.participantCount}`)
  if (data.channel.viewers) {
    lines.push('')
    lines.push(`─ ${L.viewers.title} ─`)
    for (const r of data.channel.viewers.roles) lines.push(`  · ${r.name} (${r.id})`)
    const users = data.channel.viewers.members.filter((m) => !m.bot)
    const bots = data.channel.viewers.members.filter((m) => m.bot)
    for (const m of users) lines.push(`  · ${m.displayName ?? m.username} (${m.id})`)
    for (const m of bots) lines.push(`  · [BOT] ${m.displayName ?? m.username} (${m.id})`)
  }
  lines.push('')
  lines.push(`─ Messages ─────────────────────────────`)
  lines.push('')
  for (const m of data.messages) {
    lines.push(renderPlainText(m))
    lines.push('')
  }
  return lines.join('\n')
}

function formatDate(iso?: string): string {
  if (!iso) return '-'
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function escapeJsForAttr(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, '_')
}
