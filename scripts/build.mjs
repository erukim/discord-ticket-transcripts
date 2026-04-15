#!/usr/bin/env node
/**
 * 배포용 빌드 + 강화 난독화 파이프라인.
 *
 *   src/**.ts
 *     │
 *     ├─ tsc --emitDeclarationOnly ──▶ dist/**.d.ts  (타입 정보 — IDE 자동완성 유지)
 *     │
 *     └─ esbuild ──▶ 단일 번들 ──▶ terser ──▶ javascript-obfuscator
 *                                                ├─ 문자열 배열 + base64 인코딩
 *                                                ├─ 제어 흐름 평탄화
 *                                                ├─ 죽은 코드 주입
 *                                                ├─ 식별자 → hex 이름
 *                                                ├─ 객체 키 변환
 *                                                └─ 숫자 리터럴 난독화
 *     외부 모듈 (axios, discord.js) 은 번들 제외 → peerDependency/dependency 로 해결
 *
 * 결과: dist/index.js (난독화) + dist/**.d.ts (타입)
 *       사용자: require('discord-ticket-transcript') → 정상 동작
 *       분석자: minified + mangled + obfuscated → 사실상 해석 불가
 */
import { execSync } from 'node:child_process'
import { readFile, writeFile, rm, stat, readdir, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const ROOT = join(__filename, '..', '..')
const DIST = join(ROOT, 'dist')
const ENTRY = join(ROOT, 'src', 'index.ts')
const PKG = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf-8'))

// 번들에 포함시키지 않을 모듈 — 사용자가 자기 환경에서 resolve
const EXTERNAL = [
  ...Object.keys(PKG.dependencies ?? {}),
  ...Object.keys(PKG.peerDependencies ?? {}),
  // node 내장 모듈
  'fs', 'path', 'os', 'crypto', 'stream', 'util', 'events', 'http', 'https', 'url', 'zlib',
  'buffer', 'querystring', 'child_process', 'node:fs', 'node:path', 'node:os', 'node:crypto'
]

// 0) clean
if (existsSync(DIST)) await rm(DIST, { recursive: true, force: true })
await mkdir(DIST, { recursive: true })

// 1) 타입 선언 (.d.ts) 만 생성
console.log('▶ 타입 선언 생성 중 (tsc --emitDeclarationOnly)...')
execSync('npx tsc --project tsconfig.json --emitDeclarationOnly', { cwd: ROOT, stdio: 'inherit' })

// 2) esbuild 로 번들
console.log('▶ esbuild 번들링 중...')
const { build } = await import('esbuild')
const OUT = join(DIST, 'index.js')
await build({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  target: 'node16',
  format: 'cjs',
  outfile: OUT,
  external: EXTERNAL,
  minify: false,            // terser + obfuscator 로 따로 처리
  sourcemap: false,         // 소스맵 없음 = 역추적 차단
  treeShaking: true,
  legalComments: 'none',
  logLevel: 'warning',
  define: {
    __PKG_VERSION__: JSON.stringify(PKG.version)
  }
})

// 3) terser 로 먼저 축약 (변수명 망글링 + 죽은 코드 제거)
console.log('▶ terser 압축 중...')
const { minify } = await import('terser')
let code = await readFile(OUT, 'utf-8')
const beforeTerser = code.length
const terserResult = await minify(code, {
  ecma: 2020,
  compress: {
    passes: 3,
    pure_getters: true,
    unsafe_arrows: true,
    toplevel: true,
    drop_console: false
  },
  mangle: {
    toplevel: true,
    properties: false
  },
  format: { comments: false, beautify: false },
  sourceMap: false
})
if (terserResult.error) throw terserResult.error
code = terserResult.code
console.log(`  ${(beforeTerser / 1024).toFixed(1)}KB → ${(code.length / 1024).toFixed(1)}KB`)

// 4) javascript-obfuscator 로 강화 난독화
console.log('▶ javascript-obfuscator 강화 난독화 중...')
const JSO = (await import('javascript-obfuscator')).default
const result = JSO.obfuscate(code, {
  compact: true,

  // 제어 흐름 평탄화 — 함수 내부 로직을 switch-case 기반 상태 기계로 변환
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,

  // 죽은 코드 주입 — 실행되지 않는 코드로 난독화 가중
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,

  // 문자열 배열 → 인코딩된 테이블로 분리
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayCallsTransform: true,
  stringArrayCallsTransformThreshold: 0.75,
  stringArrayThreshold: 1,
  stringArrayWrappersCount: 4,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  splitStrings: true,
  splitStringsChunkLength: 10,

  // 식별자 → 16진수 이름
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,          // CommonJS export 이름은 유지 (API 호환)
  renameProperties: false,       // 속성명도 유지 (외부 API)

  // 숫자 리터럴 난독화
  numbersToExpressions: true,
  simplify: true,

  // 객체 키 변환
  transformObjectKeys: true,

  // 유니코드 이스케이프
  unicodeEscapeSequence: false,  // true 로 하면 파일 크기 폭증

  // 런타임 방해 요소 (과하면 사용자 디버깅에 피해 — OFF)
  debugProtection: false,
  selfDefending: false,
  disableConsoleOutput: false,

  target: 'node',
  seed: Number(process.env.OBFUSCATION_SEED) || 0
})

await writeFile(OUT, result.getObfuscatedCode(), 'utf-8')
const finalSize = (await stat(OUT)).size

// 5) 결과 요약
console.log(`✔ 빌드 완료`)
console.log(`  출력: dist/index.js (${(finalSize / 1024).toFixed(1)} KB, 난독화)`)
const dtsCount = (await walkCount(DIST, '.d.ts'))
console.log(`  타입: ${dtsCount}개 .d.ts 파일 (비난독화 — IDE 자동완성용)`)

async function walkCount(dir, ext) {
  let n = 0
  for (const name of await readdir(dir)) {
    const p = join(dir, name)
    const s = await stat(p)
    if (s.isDirectory()) n += await walkCount(p, ext)
    else if (p.endsWith(ext)) n++
  }
  return n
}
