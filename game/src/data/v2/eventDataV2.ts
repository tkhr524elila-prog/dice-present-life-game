import type { LifeCardId } from '../lifeCardData'
import type {
  BoardEventV2,
  ConditionalOutcomeV2,
  ForcedStopTypeV2,
} from './boardTypesV2'

type EventSeedV2 = readonly [
  physicalId: string,
  title: string,
  category: string,
  points: number,
  health: number,
  love: number,
  cardId?: LifeCardId | null,
  characters?: readonly string[],
]

const event = (
  [physicalId, eventTitle, eventCategory, points, health, love, guaranteedCardId = null, characters = []]: EventSeedV2,
  options: {
    basePoints?: number
    baseLove?: number
    forcedStopType?: ForcedStopTypeV2
    guaranteedCardCondition?: string
    conditionalOutcomes?: readonly ConditionalOutcomeV2[]
  } = {},
): BoardEventV2 => ({
  eventId: `V2_EVENT_${physicalId.replace('-', '_')}`,
  eventTitle,
  eventCategory,
  basePoints: options.basePoints ?? points,
  baseHealth: health,
  baseLove: options.baseLove ?? love,
  resolvedPoints: points,
  resolvedHealth: health,
  resolvedLove: love,
  guaranteedCardId,
  guaranteedCardCondition: options.guaranteedCardCondition ?? null,
  forcedStopType: options.forcedStopType ?? null,
  characters,
  conditionalOutcomes: options.conditionalOutcomes ?? [],
})

const present = (physicalId: string, title: string) =>
  event([physicalId, title, 'プレゼント抽選', 0, 0, 0])

const stop = (
  physicalId: string,
  title: string,
  forcedStopType: ForcedStopTypeV2,
  conditionalOutcomes: readonly ConditionalOutcomeV2[] = [],
) =>
  event([physicalId, title, '強制ストップ', 0, 0, 0], {
    forcedStopType,
    conditionalOutcomes,
  })

const COMMON_EVENT_SEEDS: readonly BoardEventV2[] = [
  event(['001', '大学入学', '学生', 100, 0, 5]),
  event(['002', '初めての一人暮らし', '学生', -200, 0, 3]),
  event(['003', '大学の飲み会', '学生', -100, -3, 5]),
  present('004', '入学祝い'),
  event(['005', 'アルバイト開始', '学生', 1_300, -2, 0]),
  event(['006', '単位を落とす', '学生', -100, -3, 0]),
  event(['007', 'サークル旅行', '学生', -200, 2, 8]),
  present('008', '友人からのお土産'),
  event(['009', '田中さんと出会う', '友人', -100, 0, 5, null, ['田中さん']]),
  event(['010', 'テスト前日の徹夜', '学生', 0, -8, 0]),
  event(['011', '田中さんとマック', '友人', 0, -2, 5, 'PRIZE_MCDONALDS', ['田中さん']]),
  event(['012', '卒業旅行', '学生', -300, 3, 10]),
  event(['013', 'ひろむが遊びに来る', '友人', -100, 2, 8, null, ['ひろむ']]),
  present('014', '誕生日プレゼント'),
  event(['015', 'すき家で締め', '友人', 0, -3, 5, 'PRIZE_SUKIYA']),
  event(['016', '沼垂祭で怪我', '健康', -300, -10, -2]),
  event(['017', 'バイト初給料', '学生', 1_300, -2, 0]),
  event(['018', '大学生活を振り返る', '人生', 100, 2, 5]),
  present('019', '卒業祝い'),
  event(['020', '大学卒業・社会人へ', '人生', 1_300, 3, 5]),
  stop('021', '職業選択', 'job', [
    { condition: 'foreign-insurance-company', points: 2_500, health: -5, love: -5, guaranteedCardId: null },
    { condition: 'local-insurance-agency', points: 2_100, health: 5, love: 5, guaranteedCardId: null },
  ]),
  event(['022', '初出勤', '仕事', 1_100, -2, 0]),
  event(['023', '上司との初対面', '仕事', 0, -2, 0, null, ['菊田さん', '平さん']]),
  present('024', '会社の歓迎品'),
  event(['025', '初契約', '仕事', 1_400, -2, 0]),
  event(['026', '顧客から断られる', '仕事', -100, -3, 0]),
  event(['027', '初ボーナス', '仕事', 1_500, 0, 2]),
  event(['028', '深夜まで残業', '仕事', 1_500, -10, -5]),
  present('029', '会社のビンゴ大会'),
  stop('030', 'NISAを始めるか', 'nisa-1', [
    { condition: 'join', points: -500, health: 0, love: 0, guaranteedCardId: null },
    { condition: 'do-not-join', points: 0, health: 0, love: 0, guaranteedCardId: null },
  ]),
  event(['031', '投資の勉強', '投資', -100, -1, 0]),
  event(['032', '田中さんへ相談', '友人・仕事', -100, 2, 5, null, ['田中さん']]),
  event(['033', '大型契約を獲得', '仕事', 1_500, -8, -3]),
  present('034', 'キャンペーン当選'),
  event(['035', '健康診断', '健康', -100, -5, 0]),
  stop('036', '医療保険に加入するか', 'medical-insurance', [
    { condition: 'join', points: -400, health: 0, love: 0, guaranteedCardId: null },
    { condition: 'do-not-join', points: 0, health: 0, love: 0, guaranteedCardId: null },
  ]),
  event(['037', '仕事で表彰される', '仕事', 700, -5, 3]),
  event(['038', '車で遠出', '車', -200, 3, 5]),
  present('039', '誕生日プレゼント'),
  stop('040', '恋愛スタイル選択', 'romance', [
    { condition: 'playboy', points: 0, health: 0, love: 0, guaranteedCardId: null },
    { condition: 'pure-love', points: 0, health: 0, love: 0, guaranteedCardId: null },
  ]),
  event(['061', 'れいなと結婚', '家族', -700, 10, 25, null, ['れいな']]),
  event(['062', 'れいなと新生活開始', '家族', -300, 2, 10, null, ['れいな']]),
  stop('063', '自動車保険を更新するか', 'car-insurance', [
    { condition: 'renew', points: -400, health: 0, love: 0, guaranteedCardId: null },
    { condition: 'do-not-renew', points: 0, health: 0, love: 0, guaranteedCardId: null },
  ]),
  present('064', '結婚祝い'),
  event(['065', '建売住宅購入', '家族', 0, 2, 15, 'TROUBLE_PROPERTY_TAX', ['れいな']]),
  event(['066', '家の破損', '家族', 0, -5, -2, 'TROUBLE_HOME_REPAIR']),
  event(['067', '交通事故', '車', 0, -5, 0], {
    guaranteedCardCondition: 'car-insurance-inactive',
    conditionalOutcomes: [
      { condition: 'car-insurance-active', points: -200, health: -5, love: 0, guaranteedCardId: null },
      { condition: 'car-insurance-inactive', points: 0, health: -5, love: 0, guaranteedCardId: 'TROUBLE_CAR_REPAIR' },
    ],
  }),
  present('068', '新築祝い'),
  event(['069', 'かなが生まれる', '家族', -700, -10, 25, null, ['れいな', 'かな']]),
  event(['070', 'かなの夜泣き', '家族', 0, -10, 5, null, ['れいな', 'かな']]),
  event(['071', 'れいな・かなとマック', '家族', 0, -2, 8, 'PRIZE_MCDONALDS', ['れいな', 'かな']]),
  present('072', '出産祝い'),
  event(['073', 'かなと公園で遊ぶ', '家族', -100, 5, 10, null, ['かな']]),
  event(['074', 'いとが生まれる', '家族', -700, -10, 25, null, ['れいな', 'かな', 'いと']]),
  event(['075', 'いとのおむつ交換', '家族', 0, -2, 8, 'PRIZE_DIAPER', ['いと']]),
  present('076', '家族への贈り物'),
  event(['077', 'ひろむが遊びに来る', '友人・家族', -100, 2, 8, null, ['ひろむ']]),
  event(['078', 'ひろむが泊まる', '友人・家族', -200, -2, 10, null, ['ひろむ']]),
  event(['079', 'ひろむが住み着く', '友人・家族', 0, 0, 0, 'SPECIAL_LODGER', ['ひろむ']]),
  present('080', '家族のお祝い'),
  event(['081', 'れいな・かな・いとと家族旅行', '家族', -500, 7, 15, null, ['れいな', 'かな', 'いと']]),
  event(['082', '仕事で大成功', '仕事', 1_500, -8, -3, null, ['菊田さん', '平さん']]),
  stop('083', '分散投資！NISA2枠目', 'nisa-2', [
    { condition: 'contract-if-nisa-1-active', points: -500, health: 0, love: 0, guaranteedCardId: null },
    { condition: 'do-not-contract', points: 0, health: 0, love: 0, guaranteedCardId: null },
    { condition: 'unavailable-if-nisa-1-inactive', points: 0, health: 0, love: 0, guaranteedCardId: null },
  ]),
  present('084', '会社の抽選会'),
  event(['085', '沼垂祭で怪我', '健康', -300, -10, -2]),
  event(['086', '体調を崩す', '健康', -200, -10, 0]),
  event(['087', '家の破損', '家族', 0, -5, -2, 'TROUBLE_HOME_REPAIR']),
  present('088', '地域のお祭り抽選会'),
  event(['089', 'れいな・かな・いとと休日', '家族', -100, 5, 12, null, ['れいな', 'かな', 'いと']]),
  event(['090', '田中さんが遊びに来る', '友人・家族', -100, 2, 8, null, ['田中さん']]),
  event(['091', '家族とすき家で締め', '家族', 0, -3, 5, 'PRIZE_SUKIYA', ['れいな', 'かな', 'いと']]),
  present('092', '家族からの贈り物'),
  event(['093', '車の故障', '車', 0, -3, 0, 'TROUBLE_CAR_REPAIR']),
  event(['094', '上司から評価される', '仕事', 700, -5, 3, null, ['菊田さん', '平さん']]),
  event(['095', 'れいな・かな・いとと家族写真', '家族', -100, 2, 15, null, ['れいな', 'かな', 'いと']]),
  present('096', '人生のご褒美'),
  event(['097', '仕事の繁忙期', '仕事', 1_500, -8, -5]),
  event(['098', '29歳の今を振り返る', '人生', 1_300, 3, 5]),
  present('099', '29歳の誕生日'),
  event(['100', 'ゴール', 'ゴール', 0, 0, 0]),
] as const

const PLAYBOY_EVENT_SEEDS: readonly BoardEventV2[] = [
  event(['041-A', 'Tinderでマッチ', '恋愛', 200, 0, -6], { basePoints: 100, baseLove: -3 }),
  event(['042-A', '合コンに参加', '恋愛', -400, -3, 6], { basePoints: -200, baseLove: 3 }),
  event(['043-A', '夜遊び', '恋愛', -600, -8, -10], { basePoints: -300, baseLove: -5 }),
  event(['044-A', '朝帰り', '恋愛', 0, -8, -10], { basePoints: 0, baseLove: -5 }),
  event(['045-A', 'ひろむと飲みに行く', '友人・恋愛', -400, -5, 10, null, ['ひろむ']], { basePoints: -200, baseLove: 5 }),
  present('046-A', 'プレゼント抽選'),
  event(['047-A', 'カードを使いすぎる', 'お金・トラブル', 0, -2, -6, 'TROUBLE_CREDIT_CARD_BILL'], { basePoints: 0, baseLove: -3 }),
  event(['048-A', '誰からも返信がない', '恋愛', 0, -2, -10], { basePoints: 0, baseLove: -5 }),
  event(['049-A', '合コンで人気者', '恋愛', 600, -4, -10], { basePoints: 300, baseLove: -5 }),
  event(['050-A', '遊び疲れる', '恋愛', 0, -10, -6], { basePoints: 0, baseLove: -3 }),
  event(['051-A', '本気で好きな人ができる', '恋愛', -200, 3, 20, null, ['れいな']], { basePoints: -100, baseLove: 10 }),
  event(['052-A', 'すき家で締め', '恋愛', 0, -3, 8, 'PRIZE_SUKIYA'], { basePoints: 0, baseLove: 4 }),
  event(['053-A', 'ひろむが泊まる', '友人・恋愛', -200, -2, 12, null, ['ひろむ']], { basePoints: -100, baseLove: 6 }),
  event(['054-A', '過去の関係を整理する', '恋愛', -400, 3, 16], { basePoints: -200, baseLove: 8 }),
  event(['055-A', '過去を清算する', '恋愛', -600, 5, 20], { basePoints: -300, baseLove: 10 }),
  present('056-A', 'プレゼント抽選'),
  event(['057-A', '恋愛と仕事の両立', '恋愛・仕事', 600, -8, -8], { basePoints: 300, baseLove: -4 }),
  event(['058-A', '大切な人と向き合う', '恋愛', -400, 3, 16, null, ['れいな']], { basePoints: -200, baseLove: 8 }),
  event(['059-A', 'これまでの恋愛を振り返る', '恋愛', 200, 2, 10], { basePoints: 100, baseLove: 5 }),
  event(['060-A', 'れいなと一緒に生きることを決める', '恋愛', -600, 5, 24, null, ['れいな']], { basePoints: -300, baseLove: 12 }),
] as const

const PURE_LOVE_EVENT_SEEDS: readonly BoardEventV2[] = [
  event(['041-B', 'れいなと初デート', '恋愛', -200, 2, 8, null, ['れいな']]),
  event(['042-B', 'れいなへ手料理を振る舞う', '恋愛', -100, 3, 10, null, ['れいな']]),
  event(['043-B', 'れいなと記念日を過ごす', '恋愛', -300, 3, 12, null, ['れいな']]),
  event(['044-B', 'れいなと一緒に旅行', '恋愛', -400, 5, 15, null, ['れいな']]),
  event(['045-B', '田中さんへ恋愛相談', '友人・恋愛', -100, 2, 5, null, ['田中さん']]),
  present('046-B', 'プレゼント抽選'),
  event(['047-B', 'れいなの家族へあいさつ', '恋愛', -200, -2, 12, null, ['れいな']]),
  event(['048-B', 'れいなと将来について話す', '恋愛', 0, 2, 10, null, ['れいな']]),
  event(['049-B', 'れいなとけんかする', '恋愛', 0, -3, -5, null, ['れいな']]),
  event(['050-B', 'れいなと仲直りする', '恋愛', -100, 3, 12, null, ['れいな']]),
  event(['051-B', 'れいなとの時間を大切にする', '恋愛', -100, 3, 10, null, ['れいな']]),
  event(['052-B', 'れいなと同棲を始める', '恋愛', -300, 3, 15, null, ['れいな']]),
  event(['053-B', 'れいなと家でゆっくり過ごす', '恋愛', -100, 5, 10, null, ['れいな']]),
  event(['054-B', 'ひろむが遊びに来る', '友人・恋愛', -100, 2, 8, null, ['ひろむ', 'れいな']]),
  event(['055-B', 'れいなとの結婚を決める', '恋愛', -500, 5, 20, null, ['れいな']]),
  present('056-B', 'プレゼント抽選'),
  event(['057-B', 'れいなとの結婚を準備する', '恋愛', -500, -3, 12, null, ['れいな']]),
  event(['058-B', 'れいなとデート', '恋愛', -200, 3, 10, null, ['れいな']]),
  event(['059-B', 'れいなと二人の未来を考える', '恋愛', 100, 3, 12, null, ['れいな']]),
  event(['060-B', 'れいなと一緒に生きることを決める', '恋愛', -300, 5, 20, null, ['れいな']]),
] as const

export const BOARD_EVENTS_V2: readonly BoardEventV2[] = [
  ...COMMON_EVENT_SEEDS,
  ...PLAYBOY_EVENT_SEEDS,
  ...PURE_LOVE_EVENT_SEEDS,
] as const

export const BOARD_EVENTS_BY_PHYSICAL_ID_V2 = new Map(
  BOARD_EVENTS_V2.map((boardEvent) => [
    boardEvent.eventId.replace('V2_EVENT_', '').replace('_', '-'),
    boardEvent,
  ]),
)
