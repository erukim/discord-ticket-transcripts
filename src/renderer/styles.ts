export const STYLES = /* css */ `
:root {
  --bg: #313338;
  --bg-alt: #2b2d31;
  --bg-elev: #1e1f22;
  --text: #dbdee1;
  --text-muted: #949ba4;
  --text-link: #00a8fc;
  --border: #3f4147;
  --mention-bg: rgba(88,101,242,.3);
  --mention-text: #c9cdfb;
  --embed-bg: #2b2d31;
  --embed-border: #1e1f22;
  --button-primary: #5865f2;
  --button-secondary: #4e5058;
  --button-success: #248046;
  --button-danger: #da373c;
  --accent: #5865f2;
  --reaction-bg: rgba(255,255,255,.05);
  --reaction-border: transparent;
  --code-bg: #1e1f22;
  --staff: #f0b132;
  --spoiler: #202225;
}
[data-theme="light"] {
  --bg: #ffffff;
  --bg-alt: #f2f3f5;
  --bg-elev: #e3e5e8;
  --text: #2e3338;
  --text-muted: #5c5e66;
  --text-link: #0068e0;
  --border: #e3e5e8;
  --mention-bg: rgba(88,101,242,.15);
  --mention-text: #5865f2;
  --embed-bg: #f2f3f5;
  --embed-border: #e3e5e8;
  --code-bg: #f0f0f0;
  --reaction-bg: rgba(0,0,0,.05);
  --spoiler: #b9bbbe;
}
* { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0;
  background: var(--bg);
  color: var(--text);
  font-family: "gg sans","Noto Sans KR","Apple SD Gothic Neo",Helvetica,Arial,sans-serif;
  font-size: 15px;
  line-height: 1.4;
}
a { color: var(--text-link); text-decoration: none; }
a:hover { text-decoration: underline; }
header.tt-header {
  position: sticky; top: 0; z-index: 10;
  background: var(--bg-elev); border-bottom: 1px solid var(--border);
  padding: 14px 24px; display: flex; align-items: center; gap: 16px;
}
header.tt-header .title { font-weight: 600; font-size: 16px; flex: 1; }
header.tt-header .meta { color: var(--text-muted); font-size: 13px; }
.tt-actions { display: flex; gap: 8px; }
.tt-btn {
  background: var(--bg-alt); color: var(--text);
  border: 1px solid var(--border); border-radius: 6px;
  padding: 6px 12px; cursor: pointer; font-size: 13px;
}
.tt-btn:hover { background: var(--border); }
select.tt-btn { padding-right: 24px; appearance: menulist; }
.tt-details { display: none; }
.tt-details.open { display: block; }
.tt-summary {
  display: grid; grid-template-columns: repeat(auto-fit,minmax(160px,1fr));
  gap: 8px; padding: 12px 24px; background: var(--bg-alt);
  border-bottom: 1px solid var(--border);
}
.tt-summary .card {
  background: var(--bg); border: 1px solid var(--border); border-radius: 6px;
  padding: 6px 10px;
}
.tt-summary .card .label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: .4px; }
.tt-summary .card .value { font-size: 13px; font-weight: 600; margin-top: 2px; }
.tt-participants { padding: 8px 24px 16px; background: var(--bg-alt); border-bottom: 1px solid var(--border); }
.tt-participants h3 { margin: 0 0 8px; font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: .5px; }
.tt-participants .chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--bg); border: 1px solid var(--border); border-radius: 999px;
  padding: 3px 10px 3px 3px; margin: 0 6px 6px 0; font-size: 13px;
}
.tt-participants .chip img { width: 22px; height: 22px; border-radius: 50%; }
.tt-participants .chip .staff { color: var(--staff); font-weight: 600; margin-left: 4px; }
.tt-messages { padding: 16px 24px 64px; }
.tt-msg { display: flex; gap: 14px; padding: 4px 0; margin-top: 14px; position: relative; }
.tt-msg.grouped { margin-top: 2px; }
.tt-msg .avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; background: var(--bg-alt); }
.tt-msg.grouped .avatar { visibility: hidden; height: 0; }
.tt-msg .body { flex: 1; min-width: 0; }
.tt-msg .head { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.tt-msg .author { font-weight: 600; }
.tt-msg .badge {
  font-size: 10px; font-weight: 600;
  background: var(--accent); color: #fff;
  padding: 1px 5px; border-radius: 3px; text-transform: uppercase;
}
.tt-msg .badge.staff { background: var(--staff); color: #1e1f22; }
.tt-msg .timestamp { font-size: 12px; color: var(--text-muted); }
.tt-msg .edited { font-size: 11px; color: var(--text-muted); }
.tt-msg .content { white-space: pre-wrap; overflow-wrap: anywhere; }
.tt-reply {
  display: flex; gap: 6px; align-items: center; font-size: 13px; color: var(--text-muted);
  margin-bottom: 4px; cursor: pointer;
}
.tt-reply:hover { color: var(--text); }
@keyframes tt-flash {
  0% { background: transparent; }
  20% { background: rgba(88,101,242,.25); }
  100% { background: transparent; }
}
.tt-msg.tt-highlight { animation: tt-flash 1.8s ease-out; border-radius: 4px; }
.tt-reply::before {
  content: ''; display: inline-block; width: 28px; height: 10px;
  border-left: 2px solid var(--border); border-top: 2px solid var(--border);
  border-top-left-radius: 6px; margin-right: 2px; margin-left: 20px;
}
.tt-mention {
  background: var(--mention-bg); color: var(--mention-text);
  padding: 0 2px; border-radius: 3px; font-weight: 500;
}
.tt-code-inline {
  background: var(--code-bg); padding: 1px 4px; border-radius: 3px; font-family: Consolas,"Courier New",monospace; font-size: 13px;
}
.tt-code-block {
  background: var(--code-bg); padding: 8px 12px; border-radius: 4px; margin: 4px 0;
  font-family: Consolas,"Courier New",monospace; font-size: 13px; white-space: pre; overflow-x: auto;
}
.tt-spoiler { background: var(--spoiler); color: transparent; border-radius: 3px; padding: 0 2px; cursor: pointer; }
.tt-spoiler.revealed { background: var(--bg-alt); color: inherit; }
.tt-emoji { width: 1.375em; height: 1.375em; vertical-align: bottom; }
.tt-emoji.jumbo { width: 48px; height: 48px; }
.tt-attachments { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.tt-attachment-img { max-width: 400px; max-height: 300px; border-radius: 4px; cursor: pointer; }
.tt-attachment-file {
  display: flex; gap: 10px; align-items: center;
  background: var(--bg-alt); border: 1px solid var(--border); border-radius: 6px;
  padding: 10px 14px; min-width: 260px;
}
.tt-attachment-file .icon { font-size: 24px; }
.tt-attachment-file .name { font-size: 14px; font-weight: 500; }
.tt-attachment-file .size { font-size: 12px; color: var(--text-muted); }
.tt-embed {
  display: grid; grid-template-columns: 4px 1fr auto;
  background: var(--embed-bg); border-radius: 4px; max-width: 520px;
  margin-top: 4px; overflow: hidden;
}
.tt-embed .bar { grid-column: 1; background: var(--accent); }
.tt-embed .main { grid-column: 2; padding: 8px 14px 14px; min-width: 0; }
.tt-embed .thumb { grid-column: 3; padding: 8px; }
.tt-embed .thumb img { max-width: 80px; max-height: 80px; border-radius: 4px; }
.tt-embed .author { display: flex; align-items: center; gap: 6px; margin-top: 6px; font-size: 13px; font-weight: 500; }
.tt-embed .author img { width: 22px; height: 22px; border-radius: 50%; }
.tt-embed .title { font-weight: 600; margin-top: 6px; }
.tt-embed .description { margin-top: 4px; color: var(--text); font-size: 14px; white-space: pre-wrap; }
.tt-embed .fields { display: grid; grid-template-columns: repeat(12,1fr); gap: 6px; margin-top: 8px; }
.tt-embed .fields .field { grid-column: span 12; }
.tt-embed .fields .field.inline { grid-column: span 4; }
.tt-embed .fields .field .name { font-size: 13px; font-weight: 600; }
.tt-embed .fields .field .value { font-size: 13px; white-space: pre-wrap; }
.tt-embed .image { grid-column: 2 / span 2; padding: 0 14px 10px; }
.tt-embed .image img { max-width: 100%; border-radius: 4px; }
.tt-embed .footer { grid-column: 2 / span 2; display: flex; align-items: center; gap: 6px; padding: 0 14px 10px; font-size: 12px; color: var(--text-muted); }
.tt-embed .footer img { width: 18px; height: 18px; border-radius: 50%; }
.tt-sticker img { max-width: 160px; max-height: 160px; }
.tt-reactions { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.tt-reaction {
  display: inline-flex; align-items: center; gap: 4px;
  background: var(--reaction-bg); border: 1px solid var(--reaction-border);
  border-radius: 8px; padding: 2px 6px; font-size: 13px; cursor: pointer;
}
.tt-reaction:hover { border-color: var(--accent); }
.tt-reaction-pop {
  position: fixed; z-index: 999; display: none;
  background: var(--bg-elev); border: 1px solid var(--border);
  border-radius: 6px; padding: 8px 0; min-width: 200px; max-width: 260px;
  box-shadow: 0 8px 24px rgba(0,0,0,.35); font-size: 13px;
}
.tt-reaction-pop.open { display: block; }
.tt-reaction-pop .hdr { padding: 4px 12px 6px; color: var(--text-muted); font-size: 11px; border-bottom: 1px solid var(--border); margin-bottom: 4px; }
.tt-reaction-pop .row {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 12px; cursor: pointer;
}
.tt-reaction-pop .row:hover { background: var(--accent); color: #fff; }
.tt-reaction-pop .row img { width: 22px; height: 22px; border-radius: 50%; }
.tt-components { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
.tt-action-row { display: flex; flex-wrap: wrap; gap: 6px; }
.tt-component-btn {
  display: inline-flex; align-items: center; gap: 4px;
  background: var(--button-secondary); color: #fff;
  border: none; border-radius: 4px; padding: 6px 12px; font-size: 14px; font-weight: 500;
  cursor: default;
}
.tt-component-btn[data-style="1"] { background: var(--button-primary); }
.tt-component-btn[data-style="3"] { background: var(--button-success); }
.tt-component-btn[data-style="4"] { background: var(--button-danger); }
.tt-component-btn[data-style="5"] { background: transparent; border: 1px solid var(--border); color: var(--text-link); }
.tt-component-btn[disabled] { opacity: .6; }
.tt-component-select {
  background: var(--bg-alt); border: 1px solid var(--border);
  border-radius: 4px; padding: 8px 12px; font-size: 14px;
  color: var(--text-muted); min-width: 240px;
}
.tt-container {
  border: 1px solid var(--border); border-radius: 6px; padding: 12px; background: var(--bg-alt);
}
.tt-container.accent { border-left: 4px solid var(--accent); }
.tt-section { display: flex; gap: 12px; align-items: flex-start; }
.tt-section .accessory { flex-shrink: 0; }
.tt-separator { height: 1px; background: var(--border); margin: 4px 0; }
.tt-separator.divider { background: var(--border); }
.tt-separator.big { margin: 12px 0; }
.tt-media-gallery { display: grid; grid-template-columns: repeat(auto-fit,minmax(140px,1fr)); gap: 4px; }
.tt-media-gallery img { width: 100%; border-radius: 4px; }
.tt-system {
  color: var(--text-muted); font-style: italic; font-size: 13px;
  padding-left: 54px;
}
/* 컨텍스트 메뉴 */
.tt-ctx-menu {
  position: fixed; z-index: 1000; display: none;
  background: var(--bg-elev); border: 1px solid var(--border);
  border-radius: 6px; padding: 4px 0; min-width: 200px;
  box-shadow: 0 8px 24px rgba(0,0,0,.35); font-size: 13px;
}
.tt-ctx-menu.open { display: block; }
.tt-ctx-menu .item {
  padding: 7px 14px; cursor: pointer; color: var(--text);
  display: flex; gap: 8px; align-items: center;
}
.tt-ctx-menu .item:hover { background: var(--accent); color: #fff; }
.tt-ctx-menu .sep { height: 1px; background: var(--border); margin: 4px 0; }
.tt-ctx-menu .hdr { padding: 6px 14px; color: var(--text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: .5px; }
.tt-msg .avatar, .tt-msg .author { cursor: pointer; }
.tt-msg .avatar:hover { outline: 2px solid var(--accent); outline-offset: 1px; border-radius: 50%; }

/* 유저 프로필 모달 */
.tt-modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 900;
  display: none; align-items: center; justify-content: center;
}
.tt-modal-backdrop.open { display: flex; }
.tt-modal {
  background: var(--bg-alt); border: 1px solid var(--border); border-radius: 10px;
  max-width: 420px; width: 90%; overflow: hidden;
}
.tt-modal .banner { height: 60px; background: linear-gradient(135deg, var(--accent), #4752c4); }
.tt-modal .avatar-wrap {
  margin: -40px 0 0 16px;
  width: 80px; height: 80px; border-radius: 50%;
  border: 6px solid var(--bg-alt); background: var(--bg-alt);
  overflow: hidden;
}
.tt-modal .avatar-wrap img { width: 100%; height: 100%; object-fit: cover; }
.tt-modal .body { padding: 8px 16px 20px; }
.tt-modal .name { font-size: 18px; font-weight: 700; }
.tt-modal .tag { font-size: 13px; color: var(--text-muted); margin-bottom: 10px; }
.tt-modal .row { display: flex; gap: 10px; margin-top: 10px; font-size: 13px; }
.tt-modal .row .label { width: 80px; color: var(--text-muted); flex-shrink: 0; }
.tt-modal .row .value { flex: 1; }
.tt-modal .roles, .tt-modal .perms { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; max-height: 160px; overflow-y: auto; }
.tt-modal .perms .perm-chip {
  background: var(--bg); border: 1px solid var(--border); border-radius: 4px;
  padding: 2px 8px; font-size: 11px; color: var(--text-muted);
}
.tt-modal .role-chip {
  display: inline-flex; align-items: center; gap: 4px;
  background: var(--bg); border: 1px solid var(--border); border-radius: 999px;
  padding: 2px 9px; font-size: 12px;
}
.tt-modal .role-chip .dot { width: 10px; height: 10px; border-radius: 50%; background: #888; }
.tt-modal .close {
  position: absolute; top: 8px; right: 12px; color: #fff; cursor: pointer;
  background: rgba(0,0,0,.3); border-radius: 50%; width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center; border: none; font-size: 16px;
}

/* 뷰어(열람 가능자) 섹션 */
.tt-viewers {
  padding: 8px 24px 16px; background: var(--bg-alt); border-bottom: 1px solid var(--border);
}
.tt-viewers h3 { margin: 0 0 8px; font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: .5px; }
.tt-viewers .group { margin-top: 6px; }
.tt-viewers .group-label { font-size: 11px; color: var(--text-muted); margin-right: 8px; }
.tt-viewers .chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--bg); border: 1px solid var(--border); border-radius: 999px;
  padding: 3px 10px 3px 3px; margin: 0 6px 6px 0; font-size: 13px; cursor: pointer;
}
.tt-viewers .chip img { width: 22px; height: 22px; border-radius: 50%; }
.tt-viewers .role-chip {
  background: var(--bg); border: 1px solid var(--border); border-radius: 4px;
  padding: 2px 8px; margin: 0 6px 6px 0; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;
}
.tt-viewers .role-chip .dot { width: 8px; height: 8px; border-radius: 50%; }

/* 토스트 */
.tt-toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: var(--bg-elev); border: 1px solid var(--border); border-radius: 6px;
  padding: 10px 18px; font-size: 13px; color: var(--text);
  opacity: 0; transition: opacity .2s; pointer-events: none; z-index: 1100;
}
.tt-toast.show { opacity: 1; }

footer.tt-footer {
  padding: 18px 24px; border-top: 1px solid var(--border);
  color: var(--text-muted); font-size: 12px; text-align: center;
}
`
