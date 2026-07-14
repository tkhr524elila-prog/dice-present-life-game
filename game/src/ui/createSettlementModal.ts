import { LODGER_CARD_EFFECT } from '../data/settlementData'
import type { SettlementResult } from '../game/calculateSettlement'

export type SettlementOverview = {
  job: string
  romance: string
  hasNisa: boolean
  hasNisaSecondSlot?: boolean
  hasMedicalInsurance: boolean
  isCarInsuranceActive: boolean
  lifeCardCount: number
}

type SettlementModal = {
  element: HTMLElement
  show: (
    result: Readonly<SettlementResult>,
    overview: Readonly<SettlementOverview>,
    onComplete: () => void,
  ) => Promise<void>
  dispose: () => void
}

const formatNumber = (value: number) => value.toLocaleString('ja-JP')
const formatChange = (value: number, unit = 'ポイント') => {
  if (value === 0) return `変化なし`
  return `${value > 0 ? '＋' : '－'}${formatNumber(Math.abs(value))}${unit}`
}
const formatMultiplier = (value: number) => `×${value.toFixed(2)}`

const createStage = (label: string, title: string, description?: string) => {
  const stage = document.createElement('section')
  stage.className = 'settlement-stage'
  const labelElement = document.createElement('p')
  labelElement.className = 'settlement-label'
  labelElement.textContent = label
  const titleElement = document.createElement('h2')
  titleElement.id = 'settlement-title'
  titleElement.textContent = title
  stage.append(labelElement, titleElement)
  if (description) {
    const descriptionElement = document.createElement('p')
    descriptionElement.className = 'settlement-description'
    descriptionElement.textContent = description
    stage.appendChild(descriptionElement)
  }
  return stage
}

const createValueGrid = (values: readonly [string, string][]) => {
  const grid = document.createElement('dl')
  grid.className = 'settlement-value-grid'
  values.forEach(([label, value]) => {
    const item = document.createElement('div')
    const term = document.createElement('dt')
    const detail = document.createElement('dd')
    term.textContent = label
    detail.textContent = value
    item.append(term, detail)
    grid.appendChild(item)
  })
  return grid
}

export const createSettlementModal = (): SettlementModal => {
  const element = document.createElement('div')
  element.className = 'settlement-modal'
  element.hidden = true
  element.setAttribute('role', 'dialog')
  element.setAttribute('aria-modal', 'true')
  element.setAttribute('aria-labelledby', 'settlement-title')
  element.innerHTML = `
    <div class="settlement-panel">
      <div class="settlement-progress" aria-label="精算の進行状況"></div>
      <div class="settlement-content"></div>
      <button class="settlement-next" type="button">次へ</button>
    </div>
  `

  const panel = element.querySelector<HTMLElement>('.settlement-panel')!
  const progress = element.querySelector<HTMLElement>('.settlement-progress')!
  const content = element.querySelector<HTMLElement>('.settlement-content')!
  const nextButton = element.querySelector<HTMLButtonElement>('.settlement-next')!
  let activeHandler: (() => void) | undefined
  const timers = new Set<number>()

  const show = (
    result: Readonly<SettlementResult>,
    overview: Readonly<SettlementOverview>,
    onComplete: () => void,
  ) => new Promise<void>((resolve) => {
    let stageIndex = 0
    let completed = false

    const stages = [
      () => {
        const stage = createStage('29歳のゴール', '人生の精算へ', '歩いてきた人生を、ひとつずつ振り返ります。')
        stage.classList.add('settlement-stage--goal')
        const goal = document.createElement('div')
        goal.className = 'settlement-goal-mark'
        goal.textContent = 'GOAL'
        const message = document.createElement('p')
        message.className = 'settlement-lead'
        message.textContent = 'この人生を精算します'
        stage.append(goal, message)
        return stage
      },
      () => {
        const stage = createStage('人生ノート概要', 'この人生の歩み')
        stage.appendChild(createValueGrid([
          ['職業', overview.job],
          ['恋愛スタイル', overview.romance],
          ['NISA', overview.hasNisa ? '始めた' : '始めなかった'],
          ['NISA2枠目', overview.hasNisaSecondSlot ? '契約済み' : '未契約'],
          ['医療保険', overview.hasMedicalInsurance ? '加入済み' : '未加入'],
          ['自動車保険', overview.isCarInsuranceActive ? '更新済み' : '未更新'],
          ['現在のポイント', `${formatNumber(result.startingPoints)}ポイント`],
          ['現在の健康', String(result.startingHealth)],
          ['現在の愛情', String(result.startingLove)],
          ['所持ライフカード', `${overview.lifeCardCount}枚`],
        ]))
        return stage
      },
      () => {
        const stage = createStage('特殊カード精算', '居候カード')
        if (result.lodgerCount === 0) {
          const message = document.createElement('p')
          message.textContent = '居候はいませんでした'
          stage.append(message, createValueGrid([
            ['処理前', `${formatNumber(result.startingPoints)}ポイント`],
            ['変動', '変化なし'],
            ['処理後', `${formatNumber(result.startingPoints)}ポイント`],
          ]))
        } else {
          const count = document.createElement('p')
          count.className = 'settlement-card-title'
          count.textContent = `🧳 居候 ×${result.lodgerCount}`
          const description = document.createElement('p')
          description.className = 'settlement-fixed-copy'
          description.textContent = LODGER_CARD_EFFECT.description
          stage.append(count, description, createValueGrid([
            ['処理前ポイント', `${formatNumber(result.startingPoints)}ポイント`],
            ['ポイント変動', formatChange(result.lodgerPointsChange, '')],
            ['処理後ポイント', `${formatNumber(result.startingPoints + result.lodgerPointsChange)}ポイント`],
            ['健康', `${result.startingHealth} → ${result.finalHealth}`],
            ['愛情', `${result.startingLove} → ${result.finalLove}`],
          ]))
        }
        return stage
      },
      () => {
        const stage = createStage('カード精算', 'トラブルカード')
        if (result.troubleCards.length === 0) {
          const message = document.createElement('p')
          message.textContent = '精算するトラブルカードはありませんでした'
          const pointsAfterLodger = result.startingPoints + result.lodgerPointsChange
          stage.append(message, createValueGrid([
            ['処理前', `${formatNumber(pointsAfterLodger)}ポイント`],
            ['変動', '変化なし'],
            ['処理後', `${formatNumber(pointsAfterLodger)}ポイント`],
          ]))
        } else {
          const list = document.createElement('div')
          list.className = 'settlement-card-list settlement-card-list--trouble'
          result.troubleCards.forEach((card) => {
            const item = document.createElement('div')
            item.innerHTML = `<strong></strong><span></span>`
            item.querySelector('strong')!.textContent = `${card.name} ×${card.count}`
            item.querySelector('span')!.textContent = formatChange(card.amount)
            list.appendChild(item)
          })
          const total = document.createElement('p')
          total.className = 'settlement-total settlement-total--negative'
          total.textContent = `合計 ${formatChange(result.troubleTotal)}`
          stage.append(list, total, createValueGrid([
            ['処理前', `${formatNumber(result.startingPoints + result.lodgerPointsChange)}ポイント`],
            ['変動', formatChange(result.troubleTotal)],
            ['処理後', `${formatNumber(result.startingPoints + result.lodgerPointsChange + result.troubleTotal)}ポイント`],
          ]))
        }
        return stage
      },
      () => {
        const stage = createStage('契約精算', 'NISA運用結果')
        if (result.nisaResults.length === 0) {
          const message = document.createElement('p')
          message.textContent = 'NISAは始めませんでした'
          const pointsBeforeNisa = result.startingPoints + result.lodgerPointsChange + result.troubleTotal
          stage.append(message, createValueGrid([
            ['処理前', `${formatNumber(pointsBeforeNisa)}ポイント`],
            ['変動', '変化なし'],
            ['処理後', `${formatNumber(pointsBeforeNisa)}ポイント`],
          ]))
        } else {
          const pointsBeforeNisa = result.startingPoints + result.lodgerPointsChange + result.troubleTotal
          const chart = document.createElement('div')
          chart.className = 'settlement-nisa-chart settlement-nisa-chart--moving'
          chart.innerHTML = `
            <div class="settlement-nisa-chart-grid" aria-hidden="true"></div>
            <svg viewBox="0 0 600 150" role="img" aria-label="上下に動くNISA運用チャート">
              <polyline points="0,100 55,68 110,91 165,46 220,75 275,32 330,63 385,43 440,82 495,51 550,70 600,35" />
            </svg>
          `
          const slotLabel = document.createElement('p')
          slotLabel.className = 'settlement-nisa-slot'
          const resultList = document.createElement('div')
          resultList.className = 'settlement-nisa-slot-results'
          const stopButton = document.createElement('button')
          stopButton.className = 'settlement-nisa-stop'
          stopButton.type = 'button'
          let currentSlot = 0
          let isRevealed = false

          const prepareSlot = () => {
            isRevealed = false
            chart.classList.add('settlement-nisa-chart--moving')
            chart.classList.remove('settlement-nisa-chart--gain', 'settlement-nisa-chart--loss')
            slotLabel.textContent = `${currentSlot + 1}枠目のチャート` 
            stopButton.textContent = 'ストップ'
          }

          stopButton.addEventListener('click', () => {
            if (!isRevealed) {
              isRevealed = true
              const value = result.nisaResults[currentSlot]!
              chart.classList.remove('settlement-nisa-chart--moving')
              chart.classList.add(value >= 0 ? 'settlement-nisa-chart--gain' : 'settlement-nisa-chart--loss')
              const line = document.createElement('p')
              line.className = value >= 0 ? 'settlement-nisa-slot-result is-positive' : 'settlement-nisa-slot-result is-negative'
              line.textContent = `${currentSlot + 1}枠目：${formatChange(value)}`
              resultList.appendChild(line)
              if (currentSlot < result.nisaResults.length - 1) {
                stopButton.textContent = `${currentSlot + 2}枠目へ`
              } else {
                stopButton.hidden = true
                total.hidden = false
                nisaDetails.hidden = false
                nextButton.disabled = false
              }
              return
            }
            currentSlot += 1
            prepareSlot()
          })

          const total = document.createElement('p')
          total.className = 'settlement-nisa-total'
          total.textContent = `合計結果：${formatChange(result.nisaResult ?? 0)}`
          total.hidden = true
          const nisaDetails = createValueGrid([
            ['処理前', `${formatNumber(pointsBeforeNisa)}ポイント`],
            ['運用結果合計', formatChange(result.nisaResult ?? 0)],
            ['処理後', `${formatNumber(pointsBeforeNisa + (result.nisaResult ?? 0))}ポイント`],
          ])
          nisaDetails.hidden = true
          stage.append(slotLabel, chart, resultList, stopButton, total, nisaDetails)
          nextButton.disabled = true
          prepareSlot()
        }
        return stage
      },
      () => {
        const stage = createStage('健康の確定', '最終健康')
        const health = document.createElement('p')
        health.className = 'settlement-health'
        health.textContent = String(result.finalHealth)
        const note = document.createElement('p')
        note.className = 'settlement-description'
        note.textContent = '通常イベント・人生選択・居候カードを反映した健康です。'
        stage.append(health, note)
        return stage
      },
      () => {
        const stage = createStage('契約精算', '医療保険')
        if (!overview.hasMedicalInsurance) {
          const message = document.createElement('p')
          message.textContent = '医療保険へ加入していませんでした'
          stage.append(message, createValueGrid([
            ['処理前', `${formatNumber(result.pointsBeforeHealthMultiplier)}ポイント`],
            ['変動', '変化なし'],
            ['処理後', `${formatNumber(result.pointsBeforeHealthMultiplier)}ポイント`],
          ]))
        } else if (result.medicalInsuranceBenefit === 0) {
          const message = document.createElement('p')
          message.className = 'settlement-fixed-copy'
          message.textContent = '給付金はありませんでした。\nでも、健康で終われたことが一番です。'
          stage.append(message, createValueGrid([
            ['処理前', `${formatNumber(result.pointsBeforeHealthMultiplier)}ポイント`],
            ['給付金', '変化なし'],
            ['処理後', `${formatNumber(result.pointsBeforeHealthMultiplier)}ポイント`],
          ]))
        } else {
          stage.appendChild(createValueGrid([
            ['最終健康', String(result.finalHealth)],
            ['処理前', `${formatNumber(result.pointsBeforeHealthMultiplier - result.medicalInsuranceBenefit)}ポイント`],
            ['給付金', formatChange(result.medicalInsuranceBenefit)],
            ['処理後', `${formatNumber(result.pointsBeforeHealthMultiplier)}ポイント`],
          ]))
        }
        return stage
      },
      () => {
        const stage = createStage('健康精算', '健康倍率')
        stage.appendChild(createValueGrid([
          ['倍率適用前', `${formatNumber(result.pointsBeforeHealthMultiplier)}ポイント`],
          ['最終健康', String(result.finalHealth)],
          ['適用倍率', formatMultiplier(result.healthMultiplier)],
          ['倍率適用後', `${formatNumber(result.pointsAfterHealthMultiplier)}ポイント`],
        ]))
        const note = document.createElement('p')
        note.className = 'settlement-description'
        note.textContent = '小数点以下は切り捨てます。0ポイント未満の場合は最後に0へ補正します。'
        stage.appendChild(note)
        return stage
      },
      () => {
        const stage = createStage('精算完了', '最終結果')
        stage.classList.add('settlement-stage--result')
        const cashLabel = document.createElement('p')
        cashLabel.className = 'settlement-final-label'
        cashLabel.textContent = '最終現金額'
        const cash = document.createElement('p')
        cash.className = 'settlement-final-cash'
        cash.textContent = `${formatNumber(result.finalCash)}円`
        stage.append(cashLabel, cash, createValueGrid([
          ['最終健康', String(result.finalHealth)],
          ['最終愛情', String(result.finalLove)],
          ['職業', overview.job],
          ['恋愛スタイル', overview.romance],
          ['NISA結果', result.nisaResult === null
            ? '未加入'
            : result.nisaResults.map((value, index) => `${index + 1}枠目 ${formatChange(value)}`).join('／')],
          ['医療保険給付', formatChange(result.medicalInsuranceBenefit)],
          ['健康倍率', formatMultiplier(result.healthMultiplier)],
        ]))

        const prizeTitle = document.createElement('h3')
        prizeTitle.textContent = '獲得した景品'
        stage.appendChild(prizeTitle)
        if (result.prizeCards.length === 0) {
          const empty = document.createElement('p')
          empty.textContent = '獲得した景品はありません'
          stage.appendChild(empty)
        } else {
          const prizes = document.createElement('div')
          prizes.className = 'settlement-prize-list'
          result.prizeCards.forEach((card) => {
            const item = document.createElement('span')
            item.textContent = `🎁 ${card.name} ×${card.count}`
            prizes.appendChild(item)
          })
          stage.appendChild(prizes)
        }

        const troubleTitle = document.createElement('h3')
        troubleTitle.textContent = '精算したトラブルカード'
        const troubleSummary = document.createElement('p')
        troubleSummary.textContent = result.troubleCards.length === 0
          ? 'トラブルカードなし'
          : result.troubleCards
            .map((card) => `${card.name} ×${card.count}（${formatChange(card.amount)}）`)
            .join('／')
        stage.append(troubleTitle, troubleSummary)
        return stage
      },
    ]

    const render = () => {
      nextButton.disabled = false
      content.replaceChildren(stages[stageIndex]!())
      progress.textContent = `${stageIndex + 1} / ${stages.length}`
      nextButton.textContent = stageIndex === 0 ? '精算をはじめる' : '次へ'

      if (stageIndex === stages.length - 1) {
        nextButton.hidden = true
        if (!completed) {
          completed = true
          onComplete()
          resolve()
        }
      } else {
        nextButton.hidden = false
      }
    }

    activeHandler = () => {
      if (nextButton.disabled || stageIndex >= stages.length - 1) return
      stageIndex += 1
      panel.classList.remove('settlement-panel--changing')
      void panel.offsetWidth
      panel.classList.add('settlement-panel--changing')
      render()
    }
    nextButton.addEventListener('click', activeHandler)
    element.hidden = false
    render()
    nextButton.focus()
  })

  return {
    element,
    show,
    dispose: () => {
      if (activeHandler) nextButton.removeEventListener('click', activeHandler)
      timers.forEach((timer) => window.clearTimeout(timer))
      element.remove()
    },
  }
}
