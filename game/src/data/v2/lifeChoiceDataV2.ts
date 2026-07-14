import type { StatusChanges } from '../../game/applyStatusChanges'
import type { LifeChoiceData, LifeChoiceOption } from '../lifeChoiceData'

const changes = (
  points: number,
  health: number,
  love: number,
): Required<StatusChanges> => ({ points, health, love })

const contract = (
  title: string,
  summary: string,
  cost: string,
  benefit: string,
  risk: string,
) => ({ title, summary, cost, benefit, risk })

const CHOICES_V2: readonly LifeChoiceData[] = [
  {
    squareId: 21,
    title: '働き方を選ぶ',
    description: 'これからの仕事と暮らしを選びます。',
    options: [
      {
        id: 'foreign-insurance',
        label: '外資系保険会社',
        description: '成果によって大きな収入を狙える働き方。上司は菊田さん。',
        merits: ['仕事のプラスポイント×1.5'],
        demerits: ['仕事の健康減少量×1.3'],
        changes: changes(2_500, -5, -5),
        selection: { kind: 'job', value: 'foreign-insurance' },
        historyTitle: '外資系保険会社を選択',
        historyDescription: '菊田さんのもとで、成果によって大きな収入を狙える働き方を選んだ。',
      },
      {
        id: 'local-agency',
        label: '地元の保険代理店',
        description: '安定した収入を得ながら、健康や家族との時間も守りやすい働き方。上司は平さん。',
        merits: ['健康と家族との時間を守りやすい'],
        demerits: ['仕事の収入は外資より控えめ'],
        changes: changes(2_100, 5, 5),
        selection: { kind: 'job', value: 'local-agency' },
        historyTitle: '地元の保険代理店を選択',
        historyDescription: '平さんのもとで、安定した収入と暮らしを守る働き方を選んだ。',
      },
    ],
  },
  {
    squareId: 30,
    title: 'NISAを始めますか？',
    description: '今のお金を使うか、未来へ回すか。',
    options: [
      {
        id: 'start-nisa', label: '始める', description: '500ポイントを未来の運用へ回す。',
        merits: ['ゴール時に運用結果を1回抽選'], demerits: ['500ポイント支払う'],
        changes: changes(-500, 0, 0), selection: { kind: 'nisa', value: true },
        historyTitle: 'NISA1枠目を契約', historyDescription: 'NISA1枠目へ500ポイントを投資した。',
        contract: contract('NISA契約書', 'NISA1枠目を始める', '今回の支払い：500ポイント', 'ゴール時に運用結果を抽選', '運用結果によって増減する'),
      },
      {
        id: 'skip-nisa', label: '始めない', description: '今のポイントを手元に残す。',
        merits: ['支払いなし'], demerits: ['NISA運用抽選なし'], changes: changes(0, 0, 0),
        selection: { kind: 'nisa', value: false }, historyTitle: 'NISA1枠目を契約しなかった', historyDescription: 'NISA1枠目は契約しなかった。',
      },
    ],
  },
  {
    squareId: 36,
    title: '医療保険へ加入しますか？',
    description: '将来の健康状態に備えます。',
    options: [
      {
        id: 'join-medical-insurance', label: '加入する', description: '400ポイントで将来の不健康に備える。',
        merits: ['ゴール時の健康に応じて給付'], demerits: ['400ポイント支払う'], changes: changes(-400, 0, 0),
        selection: { kind: 'medical-insurance', value: true }, historyTitle: '医療保険へ加入', historyDescription: '医療保険へ加入した。',
        contract: contract('医療保険契約書', '医療保険へ加入する', '今回の支払い：400ポイント', 'ゴール時の健康に応じて給付', '健康状態によっては給付がない'),
      },
      {
        id: 'skip-medical-insurance', label: '加入しない', description: '今回は加入しない。', merits: ['支払いなし'], demerits: ['医療給付なし'],
        changes: changes(0, 0, 0), selection: { kind: 'medical-insurance', value: false }, historyTitle: '医療保険へ加入しなかった', historyDescription: '医療保険へ加入しなかった。',
      },
    ],
  },
  {
    squareId: 40,
    title: '恋愛スタイルを選ぶ',
    description: '選択によって進むコースだけが変わります。',
    options: [
      {
        id: 'playboy', label: '遊び人ルート', description: '41-A～60-Aの夜街を進む。', merits: ['変化の大きい恋愛イベント'], demerits: ['ポイントと愛情の変動が2倍'],
        changes: changes(0, 0, 0), selection: { kind: 'romance', value: 'playboy' }, historyTitle: '遊び人ルートを選択', historyDescription: '遊び人ルート（Aルート）を選んだ。',
      },
      {
        id: 'pure-love', label: '純愛ルート', description: '41-B～60-Bで、れいなとの関係を育てる。', merits: ['愛情増加イベントが多い'], demerits: ['追加倍率なし'],
        changes: changes(0, 0, 0), selection: { kind: 'romance', value: 'serious' }, historyTitle: '純愛ルートを選択', historyDescription: '純愛ルート（Bルート）を選んだ。',
      },
    ],
  },
  {
    squareId: 63,
    title: '自動車保険を更新しますか？',
    description: '事故に備えるか、今の支払いを抑えるか。',
    options: [
      {
        id: 'renew-car-insurance', label: '更新する', description: '400ポイントで事故時の負担に備える。', merits: ['事故時の負担を軽減'], demerits: ['400ポイント支払う'],
        changes: changes(-400, 0, 0), selection: { kind: 'car-insurance', value: true }, historyTitle: '自動車保険を更新', historyDescription: '自動車保険を更新した。',
        contract: contract('自動車保険更新書', '自動車保険を更新する', '今回の支払い：400ポイント', '事故時の負担を軽減', '事故が起きなければ保険は使わない'),
      },
      {
        id: 'skip-car-insurance', label: '更新しない', description: '今回は更新しない。', merits: ['支払いなし'], demerits: ['事故時は修理カードを獲得'],
        changes: changes(0, 0, 0), selection: { kind: 'car-insurance', value: false }, historyTitle: '自動車保険を更新しなかった', historyDescription: '自動車保険を更新しなかった。',
      },
    ],
  },
  {
    squareId: 83,
    title: '分散投資！NISA2枠目',
    description: '1枠目と分けて、もう1回運用します。',
    options: [
      {
        id: 'start-nisa-2', label: '契約する', description: '500ポイントでNISA抽選を1回追加する。', merits: ['ゴール時に2枠を個別抽選'], demerits: ['500ポイント支払う'],
        changes: changes(-500, 0, 0), selection: { kind: 'nisa-2', value: true }, historyTitle: '分散投資！NISA2枠目を契約', historyDescription: 'NISA2枠目へ500ポイントを投資した。',
        contract: contract('NISA2枠目契約書', '分散投資！NISA2枠目を契約する', '今回の支払い：500ポイント', 'ゴール時のNISA抽選が2回になる', '1枠目と2枠目を個別に抽選する'),
      },
      {
        id: 'skip-nisa-2', label: '契約しない', description: 'NISAは1枠だけで運用する。', merits: ['追加費用なし'], demerits: ['抽選は1枠分'],
        changes: changes(0, 0, 0), selection: { kind: 'nisa-2', value: false }, historyTitle: 'NISA2枠目を契約しなかった', historyDescription: 'NISA2枠目は契約しなかった。',
      },
    ],
  },
] as const

const choicesBySquare = new Map(CHOICES_V2.map((choice) => [choice.squareId, choice]))

export const getLifeChoiceV2 = (
  squareId: number,
  hasNisa = false,
): LifeChoiceData | undefined => {
  const choice = choicesBySquare.get(squareId)
  if (!choice || squareId !== 83 || hasNisa) return choice
  return {
    ...choice,
    description: 'まずNISA1枠目の契約が必要です',
    options: [
      { ...choice.options[0], disabledReason: 'まずNISA1枠目の契約が必要です' },
      choice.options[1],
    ],
  }
}

export const verifyLifeChoiceDataV2 = () => {
  if (choicesBySquare.size !== 6) throw new Error('Phase 7の強制ストップ選択が6件ではありません。')
  if (getLifeChoiceV2(40)?.options.some(({ changes }) => changes.points || changes.health || changes.love)) {
    throw new Error('恋愛選択時にステータス変動があります。')
  }
  if (!getLifeChoiceV2(83, false)?.options[0].disabledReason) {
    throw new Error('NISA1枠目未加入時に2枠目を契約できます。')
  }
}

export type { LifeChoiceOption }
