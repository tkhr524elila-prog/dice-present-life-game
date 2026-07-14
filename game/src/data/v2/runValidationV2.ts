import { validateBoardDataV2 } from './validateBoardDataV2'
import { verifyContinuousLoveDrawRates } from '../presentDrawTables'
import { verifySettlementData } from '../settlementData'
import { verifyLifeChoiceDataV2 } from './lifeChoiceDataV2'
import { verifyRouteRulesV2 } from '../../game/v2/resolveRouteV2'
import { verifyRouteEventMultiplierV2 } from '../../game/v2/applyEventV2'
import { verifySettlementCalculationRules } from '../../game/calculateSettlement'
import { verifyPhase7Rules } from '../../game/v2/verifyPhase7Rules'
import { verifySettlementHistoryRules } from '../../game/recordSettlementHistory'

const result = validateBoardDataV2()
verifyContinuousLoveDrawRates()
verifySettlementData()
verifyLifeChoiceDataV2()
verifyRouteRulesV2()
verifyRouteEventMultiplierV2()
verifySettlementCalculationRules()
verifyPhase7Rules()
verifySettlementHistoryRules()

console.log('P7-03～P7-09 自動検証成功', result)
