import { GuildTextBasedChannel, PermissionFlagsBits, TextBasedChannel, Role } from 'discord.js'
import { ChannelViewers, RoleBrief, UserInfo } from '../types'
import { AssetCache } from '../utils/asset'

const MAX_MEMBER_VIEWERS = 200

/**
 * 티켓 종료 시점에 채널을 열람할 수 있었던 역할/멤버 목록을 수집.
 * - 역할: ViewChannel 퍼미션이 허용되는 모든 역할
 * - 멤버: channel.members 컬렉션 (discord.js 가 이미 ViewChannel 기준으로 필터)
 */
export async function collectViewers(
  channel: TextBasedChannel,
  assets: AssetCache
): Promise<ChannelViewers | undefined> {
  const guild = (channel as GuildTextBasedChannel).guild
  if (!guild) return undefined

  const roles: RoleBrief[] = []
  const permissionsFor = (target: Role) =>
    typeof (channel as any).permissionsFor === 'function'
      ? (channel as any).permissionsFor(target)
      : null
  try {
    for (const role of guild.roles.cache.values()) {
      if (role.id === guild.id) continue // @everyone 은 별도 계산
      const perms = permissionsFor(role as Role)
      if (perms?.has(PermissionFlagsBits.ViewChannel)) {
        roles.push({
          id: role.id,
          name: role.name,
          color: role.hexColor,
          position: role.position
        })
      }
    }
    const everyoneRole = guild.roles.everyone
    const everyonePerms = permissionsFor(everyoneRole)
    if (everyonePerms?.has(PermissionFlagsBits.ViewChannel)) {
      roles.push({
        id: everyoneRole.id,
        name: '@everyone',
        color: everyoneRole.hexColor,
        position: 0
      })
    }
  } catch {
    /* guild 없는 채널 */
  }
  roles.sort((a, b) => (b.position ?? 0) - (a.position ?? 0))

  const members: UserInfo[] = []
  let truncated = false
  try {
    const memberCollection = (channel as any).members
    if (memberCollection && typeof memberCollection.values === 'function') {
      const list = [...memberCollection.values()]
      const slice = list.slice(0, MAX_MEMBER_VIEWERS)
      truncated = list.length > MAX_MEMBER_VIEWERS
      for (const m of slice) {
        const u = m.user
        const avatar = m.displayAvatarURL?.({ size: 128 }) ?? u?.displayAvatarURL?.({ size: 128 })
        members.push({
          id: u?.id ?? m.id,
          tag: u?.tag ?? `${u?.username}#${u?.discriminator ?? '0'}`,
          username: u?.username ?? m.displayName ?? 'unknown',
          displayName: m.displayName,
          avatarUrl: avatar,
          avatarDataUrl: await assets.toDataUrl(avatar),
          bot: u?.bot,
          roleColor: m.roles?.color?.hexColor,
          roles: [...(m.roles?.cache?.values() ?? [])]
            .filter((r: Role) => r.id !== guild.id)
            .sort((a: Role, b: Role) => b.position - a.position)
            .map((r: Role) => ({ id: r.id, name: r.name, color: r.hexColor, position: r.position })),
          permissions: (() => {
            try {
              const p = (channel as any).permissionsFor?.(m)
              return p?.toArray?.()
            } catch {
              return undefined
            }
          })(),
          joinedAt: m.joinedAt?.toISOString()
        })
      }
    }
  } catch {
    /* noop */
  }

  return { roles, members, truncated: truncated || undefined }
}
