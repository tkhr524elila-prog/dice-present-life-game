import type { StatusChanges } from '../game/applyStatusChanges'

export type JobType = 'foreign-insurance' | 'local-agency'
export type RomanceType = 'playboy' | 'serious'

export type LifeChoiceSelection =
  | { kind: 'job'; value: JobType }
  | { kind: 'nisa'; value: boolean }
  | { kind: 'medical-insurance'; value: boolean }
  | { kind: 'romance'; value: RomanceType }
  | { kind: 'car-insurance'; value: boolean }

export type ContractData = {
  title: string
  summary: string
  cost: string
  benefit: string
  risk: string
}

export type LifeChoiceOption = {
  id: string
  label: string
  description: string
  merits: readonly string[]
  demerits: readonly string[]
  changes: Required<StatusChanges>
  selection: LifeChoiceSelection
  historyTitle: string
  historyDescription: string
  contract?: ContractData
}

export type LifeChoiceData = {
  squareId: 13 | 20 | 25 | 27 | 32
  title: string
  description: string
  options: readonly [LifeChoiceOption, LifeChoiceOption]
}

const changes = (
  points: number,
  health: number,
  love: number,
): Required<StatusChanges> => ({ points, health, love })

export const LIFE_CHOICE_DATA: readonly LifeChoiceData[] = [
  {
    squareId: 13,
    title: '働き方を選ぶ',
    description: '高収入を狙うか、健康と暮らしを守るか。',
    options: [
      {
        id: 'foreign-insurance',
        label: '外資系保険会社',
        description: '成果を出せば、青天井。\nただし、休めるとは言っていない。',
        merits: ['高収入を狙える', '仕事のプラスポイント×1.5'],
        demerits: ['健康を消耗しやすい', '家族との愛情が増えにくい'],
        changes: changes(500, -5, -5),
        selection: { kind: 'job', value: 'foreign-insurance' },
        historyTitle: '外資系保険会社を選択',
        historyDescription: '高収入を狙う働き方を選んだ。',
      },
      {
        id: 'local-agency',
        label: '地元の保険代理店',
        description: '大きくは稼げない。\nしかし、夕食の時間には帰れる。',
        merits: ['健康を守りやすい', '家族との愛情が増えやすい'],
        demerits: ['仕事の収入は控えめ', '仕事のプラスポイント×0.8'],
        changes: changes(100, 5, 5),
        selection: { kind: 'job', value: 'local-agency' },
        historyTitle: '地元の保険代理店を選択',
        historyDescription: '健康と暮らしを守る働き方を選んだ。',
      },
    ],
  },
  {
    squareId: 20,
    title: 'NISAを始めますか？',
    description: '今のお金を使うか、未来へ回すか。',
    options: [
      {
        id: 'start-nisa',
        label: '始める',
        description: '500ポイントを未来の運用へ回す。',
        merits: ['ゴール時に運用結果を抽選'],
        demerits: ['今、500ポイント支払う'],
        changes: changes(-500, 0, 0),
        selection: { kind: 'nisa', value: true },
        historyTitle: 'NISAを始めた',
        historyDescription: '将来のために500ポイントを投資へ回した。',
        contract: {
          title: 'NISA契約書',
          summary: 'NISAを始める',
          cost: '今回の支払い：500ポイント',
          benefit: 'ゴール時に運用結果を抽選',
          risk: '運用結果によって増減する',
        },
      },
      {
        id: 'skip-nisa',
        label: '始めない',
        description: '今のポイントを手元に残す。',
        merits: ['今の支払いはない'],
        demerits: ['ゴール時の運用抽選はない'],
        changes: changes(0, 0, 0),
        selection: { kind: 'nisa', value: false },
        historyTitle: 'NISAを始めなかった',
        historyDescription: '今は投資を始めないことにした。',
      },
    ],
  },
  {
    squareId: 25,
    title: '医療保険へ加入しますか？',
    description: '健康なら使わない。不健康になったときは助けになる。',
    options: [
      {
        id: 'join-medical-insurance',
        label: '加入する',
        description: '400ポイントで将来の不健康に備える。',
        merits: ['ゴール時の健康に応じて給付'],
        demerits: ['今、400ポイント支払う'],
        changes: changes(-400, 0, 0),
        selection: { kind: 'medical-insurance', value: true },
        historyTitle: '医療保険へ加入した',
        historyDescription: '将来の不健康に備えて医療保険へ加入した。',
        contract: {
          title: '医療保険契約書',
          summary: '医療保険へ加入する',
          cost: '今回の支払い：400ポイント',
          benefit: 'ゴール時の健康に応じて給付',
          risk: '健康状態によっては給付がない',
        },
      },
      {
        id: 'skip-medical-insurance',
        label: '加入しない',
        description: '保険料を支払わず、自分で備える。',
        merits: ['今の支払いはない'],
        demerits: ['ゴール時の医療給付はない'],
        changes: changes(0, 0, 0),
        selection: { kind: 'medical-insurance', value: false },
        historyTitle: '医療保険へ加入しなかった',
        historyDescription: '医療保険には加入しないことにした。',
      },
    ],
  },
  {
    squareId: 27,
    title: 'これからの恋愛スタイルを選ぶ',
    description: '自由な恋愛か、まっすぐな関係か。',
    options: [
      {
        id: 'playboy',
        label: '遊び人ルート',
        description: '自由を選んだ。\n来月のカード明細については、まだ考えない。',
        merits: ['ポイント＋300', '自由な恋愛イベント'],
        demerits: ['健康－5', '愛情－10'],
        changes: changes(300, -5, -10),
        selection: { kind: 'romance', value: 'playboy' },
        historyTitle: '遊び人ルートを選択',
        historyDescription: '自由な恋愛スタイルを選んだ。',
      },
      {
        id: 'serious',
        label: '真面目な恋愛ルート',
        description: '派手さよりも、帰る場所を選んだ。',
        merits: ['健康＋5', '愛情＋15'],
        demerits: ['ポイント－200'],
        changes: changes(-200, 5, 15),
        selection: { kind: 'romance', value: 'serious' },
        historyTitle: '真面目な恋愛ルートを選択',
        historyDescription: 'まっすぐな恋愛スタイルを選んだ。',
      },
    ],
  },
  {
    squareId: 32,
    title: '自動車保険を更新しますか？',
    description: '事故に備えるか、今の支払いを抑えるか。',
    options: [
      {
        id: 'renew-car-insurance',
        label: '更新する',
        description: '400ポイントで事故時の負担に備える。',
        merits: ['事故時の負担を軽減'],
        demerits: ['今、400ポイント支払う'],
        changes: changes(-400, 0, 0),
        selection: { kind: 'car-insurance', value: true },
        historyTitle: '自動車保険を更新した',
        historyDescription: '事故に備えて自動車保険を更新した。',
        contract: {
          title: '自動車保険更新書',
          summary: '自動車保険を更新する',
          cost: '今回の支払い：400ポイント',
          benefit: '事故時の負担を軽減',
          risk: '事故が起きなければ保険は使わない',
        },
      },
      {
        id: 'skip-car-insurance',
        label: '更新しない',
        description: '今回は保険を更新しない。',
        merits: ['今の支払いはない'],
        demerits: ['事故時は修理代が全額自己負担'],
        changes: changes(0, 0, 0),
        selection: { kind: 'car-insurance', value: false },
        historyTitle: '自動車保険を更新しなかった',
        historyDescription: '今回は自動車保険を更新しないことにした。',
      },
    ],
  },
] as const

const lifeChoicesBySquare = new Map<number, LifeChoiceData>(
  LIFE_CHOICE_DATA.map((choice) => [choice.squareId, choice]),
)

export const getLifeChoiceBySquareId = (squareId: number) =>
  lifeChoicesBySquare.get(squareId)

export const verifyLifeChoiceData = () => {
  if (lifeChoicesBySquare.size !== 5) {
    throw new Error('人生の選択データが5件揃っていません。')
  }

  const carInsurance = getLifeChoiceBySquareId(32)
  if (
    carInsurance?.title !== '自動車保険を更新しますか？' ||
    carInsurance.options.some(({ label }) => label.includes('加入'))
  ) {
    throw new Error('自動車保険の表示が「更新」に統一されていません。')
  }

  const job = getLifeChoiceBySquareId(13)
  const nisa = getLifeChoiceBySquareId(20)
  const medical = getLifeChoiceBySquareId(25)
  const romance = getLifeChoiceBySquareId(27)
  if (
    job?.options.some(({ contract }) => contract !== undefined) ||
    romance?.options.some(({ contract }) => contract !== undefined) ||
    !nisa?.options[0].contract ||
    nisa.options[1].contract ||
    !medical?.options[0].contract ||
    medical.options[1].contract ||
    !carInsurance?.options[0].contract ||
    carInsurance.options[1].contract
  ) {
    throw new Error('契約演出を行う選択肢の設定が一致しません。')
  }

  if (
    nisa.options[0].changes.points !== -500 ||
    nisa.options[1].changes.points !== 0 ||
    medical.options[0].changes.points !== -400 ||
    medical.options[1].changes.points !== 0 ||
    carInsurance.options[0].changes.points !== -400 ||
    carInsurance.options[1].changes.points !== 0
  ) {
    throw new Error('契約の加入・更新時だけ費用が発生する設定になっていません。')
  }
}
