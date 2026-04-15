/**
 * discord.js 를 사용한 실제 동작 테스트.
 *
 * 실행 방법:
 *   1) 테스트용 봇 토큰 준비 (https://discord.com/developers/applications)
 *      - Bot 탭에서 "MESSAGE CONTENT INTENT", "SERVER MEMBERS INTENT" ON
 *      - 봇을 테스트 서버에 초대 (최소 권한: View Channel, Read Message History)
 *
 *   2) 환경변수 지정 후 실행
 *      BOT_TOKEN=xxxxx CHANNEL_ID=123456789 npx ts-node tests/demo.ts
 *
 *   (Windows PowerShell:
 *      $env:BOT_TOKEN="xxx"; $env:CHANNEL_ID="123"; npx ts-node tests/demo.ts )
 *
 * 결과물: tests/output/ticket-<channelId>.html
 *   - 브라우저로 열어 UI 확인
 *   - 우클릭/아바타 클릭/테마 토글/JSON·텍스트 다운로드 테스트
 */

import { promises as fs } from 'fs'
import path from 'path'
import { Client, TextBasedChannel } from 'discord.js'
import { TicketTranscript } from '../src'

const TOKEN = process.env.BOT_TOKEN
const CHANNEL_ID = process.env.CHANNEL_ID

if (!TOKEN || !CHANNEL_ID) {
  console.error('❌ BOT_TOKEN 과 CHANNEL_ID 환경변수가 필요합니다.')
  console.error('   예: BOT_TOKEN=xxx CHANNEL_ID=123 npx ts-node tests/demo.ts')
  process.exit(1)
}

const OUT_DIR = path.join(__dirname, 'output')

const client = new Client({ intents: [131071] })

client.once('ready', async () => {
  console.log(`✓ 로그인: ${client.user?.tag}`)

  const channel = client.channels.cache.get(CHANNEL_ID) as TextBasedChannel | undefined
  if (!channel) {
    console.error(`❌ 채널을 찾을 수 없습니다: ${CHANNEL_ID}`)
    console.error('   봇이 해당 서버/채널에 들어가 있는지 확인하세요.')
    await client.destroy()
    process.exit(1)
  }

  console.log(`✓ 채널: #${(channel as any).name ?? channel.id}`)
  console.log(`  수집 시작...`)

  try {
    const t0 = Date.now()
    const file = await TicketTranscript.create(channel, {
      ticketId: channel.id,
      theme: 'toggle',
      onProgress: ({ fetched }) => {
        process.stdout.write(`\r  fetched ${fetched} messages...`)
      }
    })
    process.stdout.write('\n')

    await fs.mkdir(OUT_DIR, { recursive: true })
    const outPath = path.join(OUT_DIR, file.name)
    await fs.writeFile(outPath, file.buffer)

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
    const sizeKb = (file.buffer.byteLength / 1024).toFixed(1)
    console.log(`✓ 저장 완료 (${elapsed}s, ${sizeKb} KB)`)
    console.log(`  → ${outPath}`)

    // 왕복 검증
    const parsed = await TicketTranscript.extract(outPath)
    console.log(`✓ extract() 검증: 메시지 ${parsed.messages.length}개, 참여자 ${parsed.stats.participantCount}명`)
  } catch (e: any) {
    console.error('❌ 오류:', e?.message ?? e)
    console.error(e)
  } finally {
    await client.destroy()
  }
})

client.login(TOKEN)
