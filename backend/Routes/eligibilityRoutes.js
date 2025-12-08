// backend/Routes/eligibilityRoutes.js

import express from 'express'
import EligibilitySubmission from '../Model/eligibility.js'
import { scoreEligibility } from '../utils/scoreEligibility.js'
import { generateAnalysisSummary } from '../utils/geminiService.js'
import { sendEligibilityEmails } from '../utils/emailService.js'

const router = express.Router()

// Fields that should be stored as numbers
const numericFields = ['bmDeliverySales', 'deliveryAOV', 'numberOfMenuItems']

router.post('/', async (req, res) => {
  try {
    const payload = { ...req.body }

    // Required fields (must be present in the request body)
    const requiredFields = [
      'brandName',
      'locationMapping',
      'brandStrength',
      'socialMediaEngagement',
      'dspRatings',
      'bmDeliverySales',
      'deliveryAOV',
      'cogsAnalysis',
      'dspRateType',
      'wastageRisk',
      'numberOfMenuItems',
      'packagingType',
      'activationOpportunities',
      'domesticOpportunities',
      'dspMarketingCommitment',
      'retrofittingNeeded',
      'multipleDeliveries',
      'equipmentAvailability',
      'skopePartnerRelationships',
      'sublicensingPotential',
    ]

    // Basic presence check (empty string / undefined / null)
    const missingField = requiredFields.find(
      (field) =>
        payload[field] === undefined ||
        payload[field] === null ||
        payload[field] === ''
    )

    if (missingField) {
      return res
        .status(400)
        .json({ message: `Field "${missingField}" is required.` })
    }

    // Cast numeric fields
    numericFields.forEach((field) => {
      if (
        payload[field] !== undefined &&
        payload[field] !== null &&
        payload[field] !== ''
      ) {
        const num = Number(payload[field])
        if (!Number.isNaN(num)) {
          payload[field] = num
        }
      }
    })

    // Normalize some fields
    if (typeof payload.brandName === 'string') {
      payload.brandName = payload.brandName.trim()
    }

    if (payload.submittedByEmail && typeof payload.submittedByEmail === 'string') {
      payload.submittedByEmail = payload.submittedByEmail.toLowerCase().trim()
    }

    // ----------------------------------------------------
    // 1) Calculate eligibility score
    // ----------------------------------------------------
    const scoreResult = scoreEligibility(payload)

    // ----------------------------------------------------
    // 2) Generate AI analysis summary with Gemini
    // ----------------------------------------------------
    let aiAnalysisSummary = ''
    try {
      aiAnalysisSummary = await generateAnalysisSummary(payload, scoreResult)
    } catch (error) {
      console.error('Failed to generate AI summary:', error)

      // Last-resort fallback if Gemini helper itself throws
      const { total_score_0_to_10, meets_threshold, brand_name } = scoreResult
      aiAnalysisSummary = meets_threshold
        ? `Your brand "${brand_name}" demonstrates excellent consistency across mapping, operations, and expansion potential. With a score of ${total_score_0_to_10}/10, your current scale and partner portfolio align perfectly with Skope Kitchens standards.`
        : `We've reviewed your brand "${brand_name}" and identified several areas that need attention. With a score of ${total_score_0_to_10}/10, we recommend addressing the highlighted gaps in your profile before resubmission.`
    }

    // ----------------------------------------------------
    // 3) Attach scoring + AI summary to payload for DB
    // ----------------------------------------------------
    payload.totalScore = scoreResult.total_score_0_to_10
    payload.meetsThreshold = scoreResult.meets_threshold
    payload.decision = scoreResult.decision
    payload.sectionScores = scoreResult.section_scores
    payload.aiAnalysisSummary = aiAnalysisSummary

    // ----------------------------------------------------
    // 4) Save submission to MongoDB
    // ----------------------------------------------------
    const submission = await EligibilitySubmission.create(payload)

    // ----------------------------------------------------
    // 5) Fire emails (non-blocking for client)
    // ----------------------------------------------------
    try {
      await sendEligibilityEmails({
        submission: payload,
        scoreResult,
        aiAnalysisSummary,
      })
    } catch (emailError) {
      console.error('Failed to send eligibility emails:', emailError)
    }

    // ----------------------------------------------------
    // 6) Respond to client
    // ----------------------------------------------------
    res.status(201).json({
      message: 'Eligibility form submitted successfully.',
      submissionId: submission._id,
      score: scoreResult.total_score_0_to_10,
      meetsThreshold: scoreResult.meets_threshold,
      decision: scoreResult.decision,
      sectionScores: scoreResult.section_scores,
      aiAnalysisSummary,
    })
  } catch (error) {
    console.error('Eligibility submission error:', error)
    res
      .status(500)
      .json({ message: 'Unable to submit eligibility form. Please try again.' })
  }
})

export default router
