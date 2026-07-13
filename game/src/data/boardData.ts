export type SquareType = 'normal' | 'gift' | 'stop' | 'goal'
export type EffectTone = 'positive' | 'negative' | 'mixed' | 'neutral'
export type ChapterNumber = 1 | 2 | 3 | 4 | 5

type StatusEffect = {
  point: number
  health: number
  love: number
}

type SquareDefinition = {
  id: number
  type: SquareType
  label: string
  eventId: string
  effects: readonly StatusEffect[]
}

export type ChapterData = {
  id: ChapterNumber
  title: string
  startSquare: number
  endSquare: number
  borderColor: string
  environment: {
    background: string
    ground: string
    fog: string
    ambientLight: string
    directionalLight: string
  }
}

export type BoardSquareData = {
  id: number
  type: SquareType
  chapter: ChapterNumber
  chapterTitle: string
  position: readonly [number, number, number]
  label: string
  eventId: string
  effectTone: EffectTone
  chapterColor: string
  squareColor: string
}

export const CHAPTERS: readonly ChapterData[] = [
  {
    id: 1,
    title: '青春の草原',
    startSquare: 1,
    endSquare: 12,
    borderColor: '#66d177',
    environment: {
      background: '#8fd1ed',
      ground: '#70b978',
      fog: '#b7e2f3',
      ambientLight: '#fff4d9',
      directionalLight: '#fff0c7',
    },
  },
  {
    id: 2,
    title: '社会人の城下町',
    startSquare: 13,
    endSquare: 26,
    borderColor: '#4d9fe0',
    environment: {
      background: '#7898b7',
      ground: '#718493',
      fog: '#aabac7',
      ambientLight: '#d6e7f4',
      directionalLight: '#d9efff',
    },
  },
  {
    id: 3,
    title: '欲望の夜街',
    startSquare: 27,
    endSquare: 38,
    borderColor: '#a16bd1',
    environment: {
      background: '#26213f',
      ground: '#453758',
      fog: '#4c3f63',
      ambientLight: '#9b83ca',
      directionalLight: '#d9a8ff',
    },
  },
  {
    id: 4,
    title: '家族の王国',
    startSquare: 39,
    endSquare: 50,
    borderColor: '#ee9948',
    environment: {
      background: '#e8b884',
      ground: '#c89c72',
      fog: '#f3d7b2',
      ambientLight: '#fff0d4',
      directionalLight: '#ffe3ae',
    },
  },
  {
    id: 5,
    title: '人生の山脈',
    startSquare: 51,
    endSquare: 60,
    borderColor: '#e3ce6b',
    environment: {
      background: '#dcecf2',
      ground: '#b8cdd0',
      fog: '#f3f8f6',
      ambientLight: '#fff9e2',
      directionalLight: '#ffe99b',
    },
  },
] as const

const effect = (point: number, health: number, love: number): StatusEffect => ({
  point,
  health,
  love,
})

const normal = (
  id: number,
  label: string,
  eventId: string,
  point: number,
  health: number,
  love: number,
): SquareDefinition => ({
  id,
  type: 'normal',
  label,
  eventId,
  effects: [effect(point, health, love)],
})

const gift = (id: number, eventId: string): SquareDefinition => ({
  id,
  type: 'gift',
  label: 'プレゼント抽選',
  eventId,
  effects: [effect(0, 0, 0)],
})

const stop = (id: number, label: string, eventId: string): SquareDefinition => ({
  id,
  type: 'stop',
  label,
  eventId,
  effects: [effect(0, 0, 0)],
})

const SQUARE_DEFINITIONS: readonly SquareDefinition[] = [
  normal(1, '大学入学', 'EV_STUDENT_01', 100, 0, 5),
  normal(2, '初めての一人暮らし', 'EV_STUDENT_02', -200, 0, 3),
  normal(3, '大学の飲み会', 'EV_STUDENT_03', -100, -3, 5),
  gift(4, '入学祝い'),
  normal(5, 'アルバイト開始', 'EV_STUDENT_04', 300, -2, 0),
  normal(6, '単位を落とす', 'EV_STUDENT_05', -100, -3, 0),
  normal(7, 'サークル旅行', 'EV_STUDENT_06', -200, 2, 8),
  gift(8, '友人からのお土産'),
  normal(9, '合コンに参加', 'EV_STUDENT_07', -150, -2, 3),
  normal(10, 'テスト前日の徹夜', 'EV_STUDENT_08', 0, -8, 0),
  normal(11, '卒業旅行', 'EV_STUDENT_09', -300, 3, 10),
  normal(12, '大学卒業・社会人へ', 'EV_STUDENT_10', 300, 3, 5),
  stop(13, '職業選択', 'PROCESS_JOB_SELECTION'),
  normal(14, '初出勤', 'EV_SQUARE_14', 100, -2, 0),
  normal(15, '初契約', 'EV_WORK_01', 400, -2, 0),
  gift(16, '会社のビンゴ大会'),
  normal(17, '顧客から断られる', 'EV_WORK_02', -100, -3, 0),
  normal(18, '初ボーナス', 'EV_WORK_03', 700, 0, 2),
  normal(19, '深夜まで残業', 'EV_WORK_04', 500, -10, -5),
  stop(20, 'NISAを始めるか', 'PROCESS_NISA_SELECTION'),
  normal(21, '投資の勉強', 'EV_SQUARE_21', -100, -1, 0),
  gift(22, 'キャンペーン当選'),
  normal(23, '上司に怒られる', 'EV_SQUARE_23', -100, -5, -2),
  normal(24, '大型契約を獲得', 'EV_WORK_05', 1_000, -8, -3),
  stop(25, '医療保険に加入するか', 'PROCESS_MEDICAL_INSURANCE'),
  normal(26, '健康診断', 'EV_SQUARE_26', -100, -5, 0),
  stop(27, '恋愛スタイル選択', 'PROCESS_ROMANCE_SELECTION'),
  {
    id: 28,
    type: 'normal',
    label: '恋愛ルート固有イベント',
    eventId: 'EV_PLAYBOY_01 / EV_SERIOUS_01',
    effects: [effect(100, 0, -3), effect(-200, 2, 8)],
  },
  gift(29, '誕生日プレゼント'),
  {
    id: 30,
    type: 'normal',
    label: '恋愛ルート固有イベント',
    eventId: 'EV_PLAYBOY_03 / EV_SERIOUS_04',
    effects: [effect(200, -8, -12), effect(-400, 5, 15)],
  },
  normal(31, '車で遠出', 'EV_SQUARE_31', -200, 3, 5),
  stop(32, '自動車保険を更新するか', 'PROCESS_CAR_INSURANCE_RENEWAL'),
  {
    id: 33,
    type: 'normal',
    label: '交通事故の可能性',
    eventId: 'EV_ACCIDENT_NONE / EV_ACCIDENT_INSURED / EV_ACCIDENT_UNINSURED',
    effects: [effect(0, 0, 0), effect(-200, -5, 0), effect(0, -5, 0)],
  },
  gift(34, '商店街の福引き'),
  normal(35, '人生の転機', 'EV_SQUARE_35', -100, 5, 5),
  {
    id: 36,
    type: 'normal',
    label: '本気の恋愛',
    eventId: 'EV_SQUARE_36_PLAYBOY / EV_SQUARE_36_SERIOUS',
    effects: [effect(-100, 3, 15), effect(-500, 5, 20)],
  },
  normal(37, '結婚', 'EV_FAMILY_01', -500, 5, 20),
  gift(38, '結婚祝い'),
  normal(39, '新生活開始', 'EV_FAMILY_02', -300, 0, 10),
  normal(40, '住宅に関する出来事', 'EV_SQUARE_40', -500, 2, 15),
  normal(41, '子どもの誕生', 'EV_FAMILY_03', -500, -5, 25),
  gift(42, '出産祝い'),
  normal(43, '夜泣き', 'EV_FAMILY_04', 0, -10, 3),
  normal(44, '家族でマック', 'EV_FAMILY_05', -100, 0, 8),
  normal(45, '子どもと過ごす休日', 'EV_SQUARE_45', -50, 5, 10),
  gift(46, '親族からの贈り物'),
  normal(47, '車の故障', 'EV_MONEY_05', 0, -3, 0),
  normal(48, '家の修繕', 'EV_SQUARE_48', 0, -3, 0),
  normal(49, '仕事の繁忙期', 'EV_SQUARE_49', 500, -8, -5),
  gift(50, '会社の抽選会'),
  normal(51, '家族旅行', 'EV_FAMILY_09', -500, 7, 18),
  normal(52, '友人が居候', 'EV_MONEY_10', 0, 0, 0),
  normal(53, 'ラーメンを食べ歩く', 'EV_HEALTH_01', -100, -5, 3),
  gift(54, '地域のお祭り抽選会'),
  normal(55, '体調を崩す', 'EV_SQUARE_55', -200, -10, 0),
  normal(56, '仕事で大成功', 'EV_SQUARE_56', 1_000, -8, -3),
  gift(57, '29歳の誕生日'),
  normal(58, '家族との休日', 'EV_SQUARE_58', -100, 5, 12),
  normal(59, '最後の人生イベント', 'EV_SQUARE_59', 300, 3, 5),
  {
    id: 60,
    type: 'goal',
    label: 'ゴール',
    eventId: 'PROCESS_GOAL',
    effects: [effect(0, 0, 0)],
  },
] as const

const NORMAL_COLORS: Record<EffectTone, string> = {
  positive: '#48bfe3',
  negative: '#a85064',
  mixed: '#806caf',
  neutral: '#8b949e',
}

const SPECIAL_COLORS: Record<Exclude<SquareType, 'normal'>, string> = {
  gift: '#f1c644',
  stop: '#eb873d',
  goal: '#fff0ad',
}

const findChapter = (squareId: number) => {
  const chapter = CHAPTERS.find(
    ({ startSquare, endSquare }) =>
      squareId >= startSquare && squareId <= endSquare,
  )

  if (!chapter) throw new Error(`マス${squareId}の章情報が見つかりません。`)
  return chapter
}

const classifyEffectTone = (effects: readonly StatusEffect[]): EffectTone => {
  const values = effects.flatMap(({ point, health, love }) => [
    point,
    health,
    love,
  ])
  const hasPositive = values.some((value) => value > 0)
  const hasNegative = values.some((value) => value < 0)

  if (hasPositive && hasNegative) return 'mixed'
  if (hasPositive) return 'positive'
  if (hasNegative) return 'negative'
  return 'neutral'
}

const createPosition = (squareId: number): readonly [number, number, number] => {
  const index = squareId - 1
  const x = Math.sin(index * 0.34) * 5.8 + Math.sin(index * 0.11) * 1.8
  const y = 1.1 + Math.sin(index * 0.27) * 0.9 + Math.sin(index * 0.09) * 0.55
  const z = index * 1.65
  return [x, y, z]
}

export const BOARD_SQUARES: readonly BoardSquareData[] = SQUARE_DEFINITIONS.map(
  (definition) => {
    const chapter = findChapter(definition.id)
    const effectTone = classifyEffectTone(definition.effects)

    return {
      id: definition.id,
      type: definition.type,
      chapter: chapter.id,
      chapterTitle: chapter.title,
      position: createPosition(definition.id),
      label: definition.label,
      eventId: definition.eventId,
      effectTone,
      chapterColor: chapter.borderColor,
      squareColor:
        definition.type === 'normal'
          ? NORMAL_COLORS[effectTone]
          : SPECIAL_COLORS[definition.type],
    }
  },
)

export const getBoardSquare = (squareId: number) =>
  BOARD_SQUARES[squareId - 1]

export const getChapter = (chapterNumber: ChapterNumber) =>
  CHAPTERS[chapterNumber - 1]

export const getSquareTypeLabel = (type: SquareType) => {
  const labels: Record<SquareType, string> = {
    normal: '通常イベント',
    gift: 'プレゼント抽選',
    stop: '強制ストップ',
    goal: 'ゴール',
  }
  return labels[type]
}
