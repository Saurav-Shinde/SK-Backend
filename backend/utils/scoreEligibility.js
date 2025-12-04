// Backend version of scoreEligibility utility

const extractNumber = (text) => {
  if (text == null) return null
  if (typeof text === 'number') return text
  const match = String(text).match(/[\d.]+/)
  return match ? Number(match[0]) : null
}

const averageNumbersInText = (text) => {
  if (!text) return null
  const matches = String(text).match(/[\d.]+/g)
  if (!matches || matches.length === 0) return null
  const nums = matches.map(Number)
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

export const scoreEligibility = (submission) => {
  // ---------- MAPPING SECTION ----------
  const outlets = extractNumber(submission.brandStrength)
  let brandStrengthScore = 2
  if (outlets != null) {
    if (outlets < 5) brandStrengthScore = 1
    else if (outlets < 15) brandStrengthScore = 2
    else if (outlets < 60) brandStrengthScore = 3
    else brandStrengthScore = 4
  }

  const socialText = submission.socialMediaEngagement || ''
  let socialScore = 2
  let followers = null

  const kMatch = socialText.match(/([\d.]+)\s*k/i)
  if (kMatch) {
    followers = Number(kMatch[1]) * 1000
  } else {
    followers = extractNumber(socialText)
  }

  if (followers != null) {
    if (followers < 5000) socialScore = 1
    else if (followers < 20000) socialScore = 2
    else if (followers < 100000) socialScore = 3
    else socialScore = 4
  }

  const avgRating = averageNumbersInText(submission.dspRatings)
  let dspScore = 2
  if (avgRating != null) {
    if (avgRating < 4.0) dspScore = 1
    else if (avgRating < 4.3) dspScore = 2
    else if (avgRating < 4.6) dspScore = 3
    else dspScore = 4
  }

  const mappingRaw = brandStrengthScore + socialScore + dspScore
  const mappingMax = 3 * 4
  const mappingNorm = mappingRaw / mappingMax

  // ---------- OPERATING SECTION ----------
  const sales = submission.bmDeliverySales
  let salesScore = 2
  if (sales != null) {
    if (sales < 10000) salesScore = 1
    else if (sales < 15000) salesScore = 2
    else if (sales < 25000) salesScore = 3
    else salesScore = 4
  }

  const aov = submission.deliveryAOV
  let aovScore = 2
  if (aov != null) {
    if (aov < 250) aovScore = 1
    else if (aov < 300) aovScore = 2
    else if (aov < 400) aovScore = 3
    else aovScore = 4
  }

  const cogsPercent = extractNumber(submission.cogsAnalysis)
  let cogsScore = 2
  if (cogsPercent != null) {
    if (cogsPercent > 32) cogsScore = 1
    else if (cogsPercent >= 29) cogsScore = 2
    else if (cogsPercent >= 26) cogsScore = 3
    else cogsScore = 4
  }

  const wastage = (submission.wastageRisk || '').toLowerCase()
  let wastageScore = 3
  if (wastage === 'high') wastageScore = 1
  else if (wastage === 'medium') wastageScore = 2
  else if (wastage === 'low') wastageScore = 4

  const menuCount = submission.numberOfMenuItems
  let menuScore = 2
  if (menuCount != null) {
    if (menuCount > 45) menuScore = 1
    else if (menuCount > 30) menuScore = 2
    else if (menuCount >= 15) menuScore = 3
    else menuScore = 4
  }

  const packaging = (submission.packagingType || '').toLowerCase()
  let packagingScore = 3
  if (packaging === 'branded') packagingScore = 2
  else if (packaging === 'mixed') packagingScore = 3
  else if (packaging === 'generic') packagingScore = 4

  const operatingRaw =
    salesScore + aovScore + cogsScore + wastageScore + menuScore + packagingScore
  const operatingMax = 6 * 4
  const operatingNorm = operatingRaw / operatingMax

  // ---------- EXPANSION SECTION ----------
  const expansionRaw = 3 + 2 + 3
  const expansionMax = 3 * 4
  const expansionNorm = expansionRaw / expansionMax

  // ---------- SPECIAL CONDITIONS ----------
  const isYes = (v) => typeof v === 'string' && v.toLowerCase().includes('yes')

  const retro = isYes(submission.retrofittingNeeded) ? 0 : 1
  const multiDel = isYes(submission.multipleDeliveries) ? 0 : 1
  const extraSpace = isYes(submission.additionalSpaceRequired) ? 0 : 1
  const newSuppliers = isYes(submission.procurementSuppliers) ? 0 : 1
  const extraTraining = isYes(submission.additionalTrainingTravel) ? 0 : 1
  const travelCosts = isYes(submission.launchTravelCosts) ? 0 : 1
  const specialReporting = isYes(submission.specialReportingIntegrations) ? 0 : 1
  // For all special condition questions, Yes = 0 (risk), No = 1 (no risk)
  const equip = isYes(submission.equipmentAvailability) ? 0 : 1

  const specialRaw =
    retro + multiDel + extraSpace + newSuppliers + extraTraining + travelCosts + specialReporting + equip
  const specialMax = 8 * 1
  const specialNorm = specialRaw / specialMax

  // ---------- WEIGHTS + FINAL SCORE ----------
  // Mapping: 10%, Operating: 50%, Expansion: 20%, Special Conditions: 20%
  const mappingWeight = 0.1
  const operatingWeight = 0.5
  const expansionWeight = 0.2
  const specialWeight = 0.2

  const totalPercent =
    (mappingNorm * mappingWeight +
      operatingNorm * operatingWeight +
      expansionNorm * expansionWeight +
      specialNorm * specialWeight) *
    100

  const totalScore0to10 = totalPercent / 10
  const meetsThreshold = totalScore0to10 >= 8.5
  const decision = meetsThreshold ? 'MOVE_FORWARD' : 'RE_EVALUATE'

  return {
    brand_name: submission.brandName,
    section_scores: {
      mapping: { raw: mappingRaw, normalized: mappingNorm },
      operating: { raw: operatingRaw, normalized: operatingNorm },
      expansion: { raw: expansionRaw, normalized: expansionNorm },
      special_conditions: { raw: specialRaw, normalized: specialNorm },
    },
    total_score_0_to_10: Number(totalScore0to10.toFixed(2)),
    meets_threshold: meetsThreshold,
    decision,
  }
}

