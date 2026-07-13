import type { DiceValue } from '../three/createPrototypeDice'

export type PrototypeTurnPhase = 'ready' | 'rolling' | 'moving' | 'event'

type PrototypeGameFlowOptions = {
  rollDice: () => Promise<DiceValue>
  movePlayerTo: (squareNumber: number) => Promise<void>
  showEvent: () => Promise<void>
  setPhase: (phase: PrototypeTurnPhase) => void
  setResult: (value: DiceValue) => void
  setCurrentSquare: (squareNumber: number) => void
}

export type PrototypeGameFlow = {
  playTurn: () => Promise<void>
  dispose: () => void
}

const LAST_SQUARE = 10

export const createPrototypeGameFlow = (
  options: PrototypeGameFlowOptions,
): PrototypeGameFlow => {
  let currentSquare = 1
  let isBusy = false
  let disposed = false

  options.setCurrentSquare(currentSquare)
  options.setPhase('ready')

  const playTurn = async () => {
    if (isBusy || disposed) return

    isBusy = true

    try {
      options.setPhase('rolling')
      const diceValue = await options.rollDice()
      if (disposed) return

      options.setResult(diceValue)
      options.setPhase('moving')

      const destination = Math.min(currentSquare + diceValue, LAST_SQUARE)

      for (
        let nextSquare = currentSquare + 1;
        nextSquare <= destination;
        nextSquare += 1
      ) {
        await options.movePlayerTo(nextSquare)
        if (disposed) return

        currentSquare = nextSquare
        options.setCurrentSquare(currentSquare)
      }

      options.setPhase('event')
      await options.showEvent()
    } finally {
      isBusy = false
      if (!disposed) options.setPhase('ready')
    }
  }

  return {
    playTurn,
    dispose: () => {
      disposed = true
    },
  }
}
