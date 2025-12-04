import express from 'express'
import EligibilitySubmission from '../Model/eligibility.js'
import { scoreEligibility } from '../utils/scoreEligibility.js'
import { generateAnalysisSummary } from '../utils/openaiService.js'
import { sendEligibilityEmails } from '../utils/emailService.js'

const router = express.Router()

const numericFields = ['bmDeliverySales', 'deliveryAOV', 'numberOfMenuItems']

router.post('/', async (req, res) => {
  try {
    const payload = { ...req.body }

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

    const missingField = requiredFields.find((field) => !payload[field])
    if (missingField) {
      return res.status(400).json({ message: `Field "${missingField}" is required.` })
    }

    numericFields.forEach((field) => {
      if (payload[field] !== undefined && payload[field] !== null && payload[field] !== '') {
        payload[field] = Number(payload[field])
      }
    })

    payload.brandName = payload.brandName.trim()
    if (payload.submittedByEmail) {
      payload.submittedByEmail = payload.submittedByEmail.toLowerCase()
    }

    // Calculate eligibility score
    const scoreResult = scoreEligibility(payload)

    // Generate AI analysis summary
    let aiAnalysisSummary = ''
    try {
      aiAnalysisSummary = await generateAnalysisSummary(payload, scoreResult)
    } catch (error) {
      console.error('Failed to generate AI summary:', error)
      // Continue with fallback summary (handled in openaiService)
      aiAnalysisSummary = scoreResult.meets_threshold
        ? `Your brand "${scoreResult.brand_name}" demonstrates excellent consistency across mapping, operations, and expansion potential. With a score of ${scoreResult.total_score_0_to_10}/10, your current scale and partner portfolio align perfectly with Skope Kitchens standards.`
        : `We've reviewed your brand "${scoreResult.brand_name}" and identified several areas that need attention. With a score of ${scoreResult.total_score_0_to_10}/10, we recommend addressing the highlighted gaps in your profile before resubmission.`
    }

    // Add scoring and AI analysis to payload
    payload.totalScore = scoreResult.total_score_0_to_10
    payload.meetsThreshold = scoreResult.meets_threshold
    payload.decision = scoreResult.decision
    payload.sectionScores = scoreResult.section_scores
    payload.aiAnalysisSummary = aiAnalysisSummary

    const submission = await EligibilitySubmission.create(payload)

    // Fire emails to client + internal team (do not block response on failure)
    try {
      await sendEligibilityEmails({
        submission: payload,
        scoreResult,
        aiAnalysisSummary,
      })
    } catch (emailError) {
      console.error('Failed to send eligibility emails:', emailError)
    }

    res.status(201).json({
      message: 'Eligibility form submitted successfully.',
      submissionId: submission._id,
      score: scoreResult.total_score_0_to_10,
      meetsThreshold: scoreResult.meets_threshold,
      decision: scoreResult.decision,
      sectionScores: scoreResult.section_scores,
      aiAnalysisSummary: aiAnalysisSummary,
    })
  } catch (error) {
    console.error('Eligibility submission error:', error)
    res.status(500).json({ message: 'Unable to submit eligibility form. Please try again.' })
  }
})

export default router

