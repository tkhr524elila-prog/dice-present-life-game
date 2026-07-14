import {
  BOARD_SQUARES,
  type ChapterNumber,
} from './boardData'
import type { RomanceType } from './lifeChoiceData'

export type JobModifierTarget = 'none' | 'work' | 'family-love'

export type NormalEventData = {
  eventId: string
  title: string
  description: string
  point: number
  health: number
  love: number
  squareId: number
  eventType: 'normal'
  category: string
  chapter: ChapterNumber
  jobModifierTarget: JobModifierTarget
}

const normalEvent = (
  squareId: number,
  eventId: string,
  category: string,
  title: string,
  description: string,
  point: number,
  health: number,
  love: number,
  jobModifierTarget: JobModifierTarget = 'none',
): NormalEventData => {
  const square = BOARD_SQUARES[squareId - 1]
  if (!square) throw new Error(`マス${squareId}の情報が見つかりません。`)

  return {
    eventId,
    title,
    description,
    point,
    health,
    love,
    squareId,
    eventType: 'normal',
    category,
    chapter: square.chapter,
    jobModifierTarget,
  }
}

export const NORMAL_EVENT_DATA: readonly NormalEventData[] = [
  normalEvent(1, 'EV_STUDENT_01', '学生', '大学入学', '自由を手に入れた。時間割はまだ他人が決める。', 100, 0, 5),
  normalEvent(2, 'EV_STUDENT_02', '学生', '一人暮らし開始', '自由になった。家事も全部ついてきた。', -200, 0, 3),
  normalEvent(3, 'EV_STUDENT_03', '学生', '大学の飲み会', '友達は増えた。財布の中身は減った。', -100, -3, 5),
  normalEvent(5, 'EV_STUDENT_04', '学生', 'アルバイト開始', '初給料より先に、シフト表が届いた。', 1_300, -2, 0),
  normalEvent(6, 'EV_STUDENT_05', '学生', '単位を落とす', '出席回数は、気持ちでは補えなかった。', -100, -3, 0),
  normalEvent(7, 'EV_STUDENT_06', '学生', 'サークル旅行', '思い出と写真と、少しの請求が残った。', -200, 2, 8),
  normalEvent(9, 'EV_STUDENT_07', '学生', '合コン', '会話は弾んだ。連絡先は増えなかった。', -150, -2, 3),
  normalEvent(10, 'EV_STUDENT_08', '学生', 'テスト前日の徹夜', '知識は増えた。睡眠時間は消えた。', 0, -8, 0),
  normalEvent(11, 'EV_STUDENT_09', '学生', '卒業旅行', '社会人になる前に、貯金を先に卒業させた。', -300, 3, 10),
  normalEvent(12, 'EV_STUDENT_10', '学生', '無事卒業', '単位は足りた。次は社会が待っている。', 1_300, 3, 5),
  normalEvent(14, 'EV_SQUARE_14', '仕事', '初出勤', '社会人初日。名刺だけは立派だった。', 1_100, -2, 0),
  normalEvent(15, 'EV_WORK_01', '仕事', '初契約', '初めて契約書に名前が入った。手汗も少し入った。', 1_400, -2, 0, 'work'),
  normalEvent(17, 'EV_WORK_02', '仕事', '顧客から断られる', '丁寧に断られた。結果だけははっきりしている。', -100, -3, 0, 'work'),
  normalEvent(18, 'EV_WORK_03', '仕事', '初ボーナス', '明細を三度見した。税金もこちらを見ていた。', 1_700, 0, 2, 'work'),
  normalEvent(19, 'EV_WORK_04', '仕事', '深夜残業', '会社の夜景に詳しくなった。', 1_500, -10, -5, 'work'),
  normalEvent(21, 'EV_SQUARE_21', '投資', '投資の勉強', '将来のために投資を勉強した。まず知らない言葉が多すぎた。', -100, -1, 0),
  normalEvent(23, 'EV_SQUARE_23', '仕事', '上司に怒られる', '上司に怒られた。内容よりも声量が記憶に残った。', -100, -5, -2),
  normalEvent(24, 'EV_WORK_05', '仕事', '大型契約獲得', '大きな契約を取った。責任も同じサイズだった。', 2_000, -8, -3, 'work'),
  normalEvent(26, 'EV_SQUARE_26', '健康', '健康診断', '健康診断を受けた。結果を見るまでは健康だった。', -100, -5, 0),
  normalEvent(31, 'EV_SQUARE_31', '車', '車で遠出', '車で遠出した。ガソリン代はかかったが、いい気分転換になった。', -200, 3, 5),
  normalEvent(35, 'EV_SQUARE_35', '人生', '人生の転機', 'これまでの働き方を見直した。人生は、たまに立ち止まる必要がある。', -100, 5, 5),
  normalEvent(37, 'EV_FAMILY_01', '家族', '結婚', '家族になった。支払い名義も増えた。', -500, 5, 20, 'family-love'),
  normalEvent(39, 'EV_FAMILY_02', '家族', '新生活開始', '新しい暮らしが始まった。段ボールは終わらない。', -300, 0, 10, 'family-love'),
  normalEvent(40, 'EV_SQUARE_40', '家族', '新しい家で暮らし始める', '家族のために新しい家を選んだ。広さと請求額が一緒に増えた。', -500, 2, 15, 'family-love'),
  normalEvent(41, 'EV_FAMILY_03', '家族', '子ども誕生', '小さな家族が増えた。睡眠は減る予定だ。', -500, -5, 25, 'family-love'),
  normalEvent(43, 'EV_FAMILY_04', '家族', '夜泣き', '午前3時。家族全員が起きている。', 0, -10, 3, 'family-love'),
  normalEvent(44, 'EV_FAMILY_05', '家族', '家族でマック', '全員分を頼んだ。ポテトは全員のものになった。', -100, 0, 8, 'family-love'),
  normalEvent(45, 'EV_SQUARE_45', '家族', '子どもと過ごす休日', '子どもと公園で遊んだ。体力は減ったが、いい休日だった。', -50, 5, 10, 'family-love'),
  normalEvent(47, 'EV_MONEY_05', 'お金・トラブル', '車が故障', '異音の正体は、無料ではなかった。', 0, -3, 0),
  normalEvent(48, 'EV_SQUARE_48', '家族', '家の修繕', '家の設備が壊れた。家は直るが、請求書は残る。', 0, -3, 0),
  normalEvent(49, 'EV_SQUARE_49', '仕事', '仕事の繁忙期', '仕事が一気に増えた。給料より先に疲労が振り込まれた。', 1_500, -8, -5, 'work'),
  normalEvent(51, 'EV_FAMILY_09', '家族', '家族旅行', '荷物は多い。写真も多い。', -500, 7, 18, 'family-love'),
  normalEvent(52, 'EV_MONEY_10', 'お金・トラブル', '友人が居候する', '部屋は狭くなった。会話は増えた。', 0, 0, 0),
  normalEvent(53, 'EV_HEALTH_01', '趣味・健康', 'ラーメンを食べ歩く', '名店を回った。塩分も順調に回った。', -100, -5, 3),
  normalEvent(55, 'EV_SQUARE_55', '健康', '体調を崩す', '体調を崩した。休むことも仕事のうちだと、遅れて気づいた。', -200, -10, 0),
  normalEvent(56, 'EV_SQUARE_56', '仕事', '仕事で大成功', '仕事で大きな成果を出した。忙しかった時間が数字になって返ってきた。', 2_000, -8, -3, 'work'),
  normalEvent(58, 'EV_SQUARE_58', '家族', '家族との休日', '何もしない休日を家族と過ごした。それが一番ぜいたくだった。', -100, 5, 12, 'family-love'),
  normalEvent(59, 'EV_SQUARE_59', '人生', '29歳の今を振り返る', 'うまくいった日も、そうでない日もあった。全部まとめて今の自分だった。', 1_300, 3, 5),
] as const

const eventsBySquareId = new Map(
  NORMAL_EVENT_DATA.map((event) => [event.squareId, event]),
)

const ROMANCE_EVENT_DATA: Record<
  RomanceType,
  ReadonlyMap<number, NormalEventData>
> = {
  playboy: new Map([
    [28, normalEvent(28, 'EV_PLAYBOY_01', '恋愛', 'Tinderでマッチ', 'マッチした。まだ人生が良くなったとは限らない。', 100, 0, -3)],
    [30, normalEvent(30, 'EV_PLAYBOY_03', '恋愛', 'セフレができる', '関係は軽かった。生活への影響は軽くなかった。', 200, -8, -12)],
    [36, normalEvent(36, 'EV_SQUARE_36_PLAYBOY', '恋愛', '本気で好きな人ができる', '遊びのつもりだった。気づけば返信を待っていた。', -100, 3, 15)],
  ]),
  serious: new Map([
    [28, normalEvent(28, 'EV_SERIOUS_01', '恋愛', '初デート', '行き先よりも、次も会えるかが気になった。', -200, 2, 8)],
    [30, normalEvent(30, 'EV_SERIOUS_04', '恋愛', '一緒に旅行', '思い出は増えた。支出も増えた。', -400, 5, 15)],
    [36, normalEvent(36, 'EV_SQUARE_36_SERIOUS', '恋愛', '結婚を決める', '派手な演出はなかった。でも、この人と生きていこうと思った。', -500, 5, 20)],
  ]),
}

const DEFERRED_NORMAL_SQUARES = new Set([28, 30, 33, 36])

export const getNormalEventBySquareId = (
  squareId: number,
  romanceType: RomanceType | null = null,
) =>
  romanceType && ROMANCE_EVENT_DATA[romanceType].has(squareId)
    ? ROMANCE_EVENT_DATA[romanceType].get(squareId)
    : eventsBySquareId.get(squareId)

export const verifyNormalEventData = () => {
  if (eventsBySquareId.size !== NORMAL_EVENT_DATA.length) {
    throw new Error('通常イベントのマス番号が重複しています。')
  }

  BOARD_SQUARES.forEach((square) => {
    const event = eventsBySquareId.get(square.id)
    const shouldHaveEvent =
      square.type === 'normal' && !DEFERRED_NORMAL_SQUARES.has(square.id)

    if (shouldHaveEvent && !event) {
      throw new Error(`マス${square.id}の通常イベントが見つかりません。`)
    }

    if (!event) return

    if (
      square.type !== 'normal' ||
      event.eventId !== square.eventId ||
      event.chapter !== square.chapter
    ) {
      throw new Error(`マス${square.id}のイベント割り当てが一致しません。`)
    }
  })

  ;(['playboy', 'serious'] as const).forEach((romanceType) => {
    ;([28, 30, 36] as const).forEach((squareId) => {
      const routeEvent = getNormalEventBySquareId(squareId, romanceType)
      if (!routeEvent || routeEvent.squareId !== squareId) {
        throw new Error(`マス${squareId}の恋愛ルートイベントが見つかりません。`)
      }
    })
  })

  const routeChecks = [
    getNormalEventBySquareId(28, 'playboy')?.title === 'Tinderでマッチ',
    getNormalEventBySquareId(30, 'playboy')?.title === 'セフレができる',
    getNormalEventBySquareId(36, 'playboy')?.love === 15,
    getNormalEventBySquareId(28, 'serious')?.title === '初デート',
    getNormalEventBySquareId(30, 'serious')?.point === -400,
    getNormalEventBySquareId(36, 'serious')?.title === '結婚を決める',
  ]
  if (routeChecks.some((passed) => !passed)) {
    throw new Error('恋愛ルート固有イベントの内容が一致しません。')
  }
}
