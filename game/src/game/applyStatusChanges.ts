export type StatusValues = {
  points: number
  health: number
  love: number
}

export type StatusChanges = Partial<StatusValues>

export type AppliedStatusResult = {
  next: StatusValues
  applied: StatusValues
}

const clampPercentage = (value: number) => Math.min(100, Math.max(0, value))

export const applyStatusChanges = (
  current: StatusValues,
  changes: StatusChanges,
): AppliedStatusResult => {
  const next = {
    points: current.points + (changes.points ?? 0),
    health: clampPercentage(current.health + (changes.health ?? 0)),
    love: clampPercentage(current.love + (changes.love ?? 0)),
  }

  return {
    next,
    applied: {
      points: next.points - current.points,
      health: next.health - current.health,
      love: next.love - current.love,
    },
  }
}

export const verifyStatusBoundaryRules = () => {
  const cases = [
    applyStatusChanges({ points: 0, health: 95, love: 50 }, { health: 10 })
      .next.health === 100,
    applyStatusChanges({ points: 0, health: 5, love: 50 }, { health: -10 })
      .next.health === 0,
    applyStatusChanges({ points: 0, health: 50, love: 95 }, { love: 10 })
      .next.love === 100,
    applyStatusChanges({ points: 0, health: 50, love: 5 }, { love: -10 })
      .next.love === 0,
  ]

  if (cases.some((passed) => !passed)) {
    throw new Error('健康・愛情の0～100補正テストに失敗しました。')
  }
}
