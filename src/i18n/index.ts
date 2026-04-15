import { Translations } from './types'
import { ko } from './ko'
import { en } from './en'
import { ja } from './ja'
import { zhCN } from './zh-CN'
import { zhTW } from './zh-TW'
import { es } from './es'
import { ptBR } from './pt-BR'
import { fr } from './fr'
import { de } from './de'
import { it } from './it'
import { ru } from './ru'
import { tr } from './tr'
import { pl } from './pl'
import { nl } from './nl'
import { ar } from './ar'
import { hi } from './hi'
import { id as idLang } from './id'
import { vi } from './vi'
import { th } from './th'
import { uk } from './uk'
import { cs } from './cs'
import { sv } from './sv'
import { fi } from './fi'
import { el } from './el'

export type { Translations } from './types'

/**
 * 지원되는 언어 코드 (BCP-47).
 * 각 멤버에 커서를 올리면 해당 언어 설명이 표시됩니다.
 */
export type SupportedLanguageCode =
  /** 한국어 (Korean) */
  | 'ko'
  /** English */
  | 'en'
  /** 日本語 (Japanese) */
  | 'ja'
  /** 简体中文 (Chinese, Simplified) */
  | 'zh-CN'
  /** 繁體中文 (Chinese, Traditional) */
  | 'zh-TW'
  /** Español (Spanish) */
  | 'es'
  /** Português do Brasil (Brazilian Portuguese) */
  | 'pt-BR'
  /** Français (French) */
  | 'fr'
  /** Deutsch (German) */
  | 'de'
  /** Italiano (Italian) */
  | 'it'
  /** Русский (Russian) */
  | 'ru'
  /** Türkçe (Turkish) */
  | 'tr'
  /** Polski (Polish) */
  | 'pl'
  /** Nederlands (Dutch) */
  | 'nl'
  /** العربية (Arabic) */
  | 'ar'
  /** हिन्दी (Hindi) */
  | 'hi'
  /** Bahasa Indonesia (Indonesian) */
  | 'id'
  /** Tiếng Việt (Vietnamese) */
  | 'vi'
  /** ไทย (Thai) */
  | 'th'
  /** Українська (Ukrainian) */
  | 'uk'
  /** Čeština (Czech) */
  | 'cs'
  /** Svenska (Swedish) */
  | 'sv'
  /** Suomi (Finnish) */
  | 'fi'
  /** Ελληνικά (Greek) */
  | 'el'

/**
 * 언어 옵션.
 *
 * - `'all'` — 지원되는 모든 언어를 HTML 에 포함하고 상단에 선택 메뉴 표시
 * - 단일 코드 (예: `'ko'`) — 해당 언어로 고정, 선택 메뉴 숨김
 * - 배열 (예: `['ko','en']`) — 주어진 언어만 포함 + 선택 메뉴 표시
 */
export type LanguageOption = 'all' | SupportedLanguageCode | SupportedLanguageCode[]

/** 지원되는 모든 언어 레지스트리 */
export const LOCALES: Record<SupportedLanguageCode, Translations> = {
  en,
  ko,
  ja,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  es,
  'pt-BR': ptBR,
  fr,
  de,
  it,
  ru,
  tr,
  pl,
  nl,
  ar,
  hi,
  id: idLang,
  vi,
  th,
  uk,
  cs,
  sv,
  fi,
  el
}

/**
 * 각 언어 코드에 대한 사람이 읽을 수 있는 설명.
 * IDE 에서 자동완성 힌트로 활용하거나, 외부에서 선택 UI 를 만들 때 참조하세요.
 */
export const LANGUAGE_DESCRIPTIONS: Record<SupportedLanguageCode, string> = {
  en: 'English',
  ko: '한국어 (Korean)',
  ja: '日本語 (Japanese)',
  'zh-CN': '简体中文 (Chinese, Simplified)',
  'zh-TW': '繁體中文 (Chinese, Traditional)',
  es: 'Español (Spanish)',
  'pt-BR': 'Português do Brasil (Brazilian Portuguese)',
  fr: 'Français (French)',
  de: 'Deutsch (German)',
  it: 'Italiano (Italian)',
  ru: 'Русский (Russian)',
  tr: 'Türkçe (Turkish)',
  pl: 'Polski (Polish)',
  nl: 'Nederlands (Dutch)',
  ar: 'العربية (Arabic)',
  hi: 'हिन्दी (Hindi)',
  id: 'Bahasa Indonesia (Indonesian)',
  vi: 'Tiếng Việt (Vietnamese)',
  th: 'ไทย (Thai)',
  uk: 'Українська (Ukrainian)',
  cs: 'Čeština (Czech)',
  sv: 'Svenska (Swedish)',
  fi: 'Suomi (Finnish)',
  el: 'Ελληνικά (Greek)'
}

export const SUPPORTED_LANGUAGE_CODES: SupportedLanguageCode[] = [
  'en',
  'ko',
  'ja',
  'zh-CN',
  'zh-TW',
  'es',
  'pt-BR',
  'fr',
  'de',
  'it',
  'ru',
  'tr',
  'pl',
  'nl',
  'ar',
  'hi',
  'id',
  'vi',
  'th',
  'uk',
  'cs',
  'sv',
  'fi',
  'el'
]

export const DEFAULT_LANGUAGE: SupportedLanguageCode = 'en'

/**
 * CreateOptions.languages 옵션을 해석해서 실제 임베드할 언어 목록과
 * 기본 언어를 결정합니다.
 */
export function resolveLanguages(
  opt: LanguageOption | undefined,
  defaultLang?: SupportedLanguageCode
): { locales: Translations[]; defaultCode: SupportedLanguageCode; allowToggle: boolean } {
  const all = SUPPORTED_LANGUAGE_CODES
  let codes: SupportedLanguageCode[]
  if (!opt || opt === 'all') {
    codes = [...all]
  } else if (Array.isArray(opt)) {
    codes = opt.filter((c): c is SupportedLanguageCode => c in LOCALES)
    if (!codes.length) codes = [DEFAULT_LANGUAGE]
  } else {
    codes = opt in LOCALES ? [opt] : [DEFAULT_LANGUAGE]
  }
  const defaultCode =
    (defaultLang && codes.includes(defaultLang) && defaultLang) || codes[0] || DEFAULT_LANGUAGE
  return {
    locales: codes.map((c) => LOCALES[c]),
    defaultCode,
    allowToggle: codes.length > 1
  }
}

/** {key} 자리표시자 치환 */
export function interpolate(template: string, args?: Record<string, unknown>): string {
  if (!args) return template
  return template.replace(/\{(\w+)\}/g, (m, k) => (args[k] != null ? String(args[k]) : m))
}
