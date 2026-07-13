import type { NormalEventData } from '../data/normalEventData'
import type { LifeCardId } from '../data/lifeCardData'

export type TrafficAccidentResult = {
  event: NormalEventData
  outcomeLabel: string
  historyTitle: string
  historyDescription: string
  cardId: LifeCardId | null
}

const accidentEvent = (
  eventId: string,
  title: string,
  description: string,
  point: number,
  health: number,
): NormalEventData => ({
  eventId,
  title,
  description,
  point,
  health,
  love: 0,
  squareId: 33,
  eventType: 'normal',
  category: '車',
  chapter: 3,
  jobModifierTarget: 'none',
})

export const resolveTrafficAccident = (
  isCarInsuranceActive: boolean,
  random: () => number = Math.random,
): TrafficAccidentResult => {
  if (random() < 0.5) {
    return {
      event: accidentEvent(
        'EV_ACCIDENT_NONE',
        '事故なし',
        '無事に目的地へ着いた。\n何も起きない日が、一番ありがたい。',
        0,
        0,
      ),
      outcomeLabel: '無事に到着',
      historyTitle: '交通事故は発生しなかった',
      historyDescription: '何事もなく目的地へ到着した。',
      cardId: null,
    }
  }

  if (isCarInsuranceActive) {
    return {
      event: accidentEvent(
        'EV_ACCIDENT_INSURED',
        '交通事故',
        '交通事故が発生した。\n保険が適用され、負担は最小限で済んだ。',
        -200,
        -5,
      ),
      outcomeLabel: '保険適用',
      historyTitle: '交通事故が発生。保険が適用された',
      historyDescription: '自動車保険が適用され、負担を最小限に抑えた。',
      cardId: null,
    }
  }

  return {
    event: accidentEvent(
      'EV_ACCIDENT_UNINSURED',
      '交通事故',
      '交通事故が発生した。\n保険を更新していなかったため、修理代は全額自己負担になった。',
      0,
      -5,
    ),
    outcomeLabel: '保険未更新・全額自己負担',
    historyTitle: '交通事故が発生。保険は適用されなかった',
    historyDescription: '車修理カードを取得した。',
    cardId: 'TROUBLE_CAR_REPAIR',
  }
}

export const verifyTrafficAccidentRules = () => {
  const noAccident = resolveTrafficAccident(false, () => 0.49)
  const insured = resolveTrafficAccident(true, () => 0.5)
  const uninsured = resolveTrafficAccident(false, () => 0.5)

  if (
    noAccident.event.eventId !== 'EV_ACCIDENT_NONE' ||
    insured.event.point !== -200 ||
    insured.cardId !== null ||
    uninsured.event.point > 0 ||
    uninsured.cardId !== 'TROUBLE_CAR_REPAIR'
  ) {
    throw new Error('交通事故の保険分岐テストに失敗しました。')
  }

  const hundredResults = Array.from({ length: 100 }, (_, index) =>
    resolveTrafficAccident(false, () => index / 100),
  )
  const accidentCount = hundredResults.filter(
    ({ event }) => event.eventId !== 'EV_ACCIDENT_NONE',
  ).length
  if (accidentCount !== 50) {
    throw new Error('交通事故の発生率が50%になっていません。')
  }
}
