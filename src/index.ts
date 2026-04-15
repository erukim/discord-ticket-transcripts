export * from './types'
export { create, toAttachment } from './create'
export { extract, aggregate } from './extract'
export {
  LOCALES,
  LANGUAGE_DESCRIPTIONS,
  SUPPORTED_LANGUAGE_CODES,
  DEFAULT_LANGUAGE,
  resolveLanguages
} from './i18n'
export type { Translations, LanguageOption, SupportedLanguageCode } from './i18n'

import { create, toAttachment } from './create'
import { extract, aggregate } from './extract'

/** 네임스페이스 형태로도 사용 가능: `TicketTranscript.create(channel)` */
export const TicketTranscript = {
  create,
  toAttachment,
  extract,
  aggregate
}

export default TicketTranscript
