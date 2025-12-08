import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  INTERNAL_ELIGIBILITY_EMAIL,
} = process.env

// Internal email fallback if env not set
const DEFAULT_INTERNAL_EMAIL = 'Shindesaurav03@gmail.com'

// Create transporter specifically for SendGrid
const transporter = nodemailer.createTransport({
  host: SMTP_HOST || 'smtp.sendgrid.net',
  port: Number(SMTP_PORT) || 587,
  secure: false, // SendGrid on 587 uses STARTTLS, so this must be false
  auth: {
    user: SMTP_USER || 'apikey', // SendGrid username is always "apikey"
    pass: SMTP_PASS,             // Your SendGrid API key
  },
})

// Optional: verify connection at startup (useful in logs)
transporter.verify((err, success) => {
  if (err) {
    console.error('SMTP connection error:', err)
  } else {
    console.log('SMTP server is ready to send emails')
  }
})

export const sendEligibilityEmails = async ({ submission, scoreResult, aiAnalysisSummary }) => {
  const userEmail = submission.submittedByEmail
  const internalEmail = INTERNAL_ELIGIBILITY_EMAIL || DEFAULT_INTERNAL_EMAIL

  if (!userEmail && !internalEmail) {
    console.warn('No recipient email configured for eligibility submission.')
    return
  }

  const { total_score_0_to_10, decision, section_scores: sectionScores } = scoreResult
  const brandName = submission.brandName
  const decisionLabel = decision === 'MOVE_FORWARD' ? 'Approved (>= 8.5)' : 'Needs Review'

  const subjectBase = `Skope Kitchens Eligibility Result – ${brandName} (${total_score_0_to_10.toFixed(
    2
  )}/10, ${decisionLabel})`

  const formatValue = (val) => {
    if (Array.isArray(val)) return val.join(', ')
    if (val === undefined || val === null || val === '') return 'Not provided'
    return String(val)
  }

  const detailFields = [
    ['Submitted By (email)', submission.submittedByEmail],
    ['Brand Name', submission.brandName],
    ['Location Mapping', submission.locationMapping],
    ['Brand Strength / Outlets', submission.brandStrength],
    ['Social Media Engagement', submission.socialMediaEngagement],
    ['DSP Ratings', submission.dspRatings],
    ['DSP Rate Type', submission.dspRateType],
    ['B&M Delivery Sales per Day', submission.bmDeliverySales],
    ['Delivery AOV', submission.deliveryAOV],
    ['COGS Analysis', submission.cogsAnalysis],
    ['Wastage Risk', submission.wastageRisk],
    ['Number of Menu Items', submission.numberOfMenuItems],
    ['Packaging Type', submission.packagingType],
    ['Menu Supply Chain Complexity', submission.menuSupplyChainComplexity],
    ['Launch Capex', submission.launchCapex],
    ['Smallwares Needed', submission.smallwaresNeeded],
    ['Activation Opportunities', submission.activationOpportunities],
    ['Domestic Opportunities', submission.domesticOpportunities],
    ['DSP Marketing Commitment', submission.dspMarketingCommitment],
    ['Retrofitting Needed', submission.retrofittingNeeded],
    ['Additional Space Required', submission.additionalSpaceRequired],
    ['Procurement Suppliers', submission.procurementSuppliers],
    ['Multiple Deliveries', submission.multipleDeliveries],
    ['Additional Training / Travel', submission.additionalTrainingTravel],
    ['Launch Travel Costs', submission.launchTravelCosts],
    ['Special Reporting Integrations', submission.specialReportingIntegrations],
    ['Equipment Availability', submission.equipmentAvailability],
    ['Skope Partner Relationships', submission.skopePartnerRelationships],
    ['Sublicensing Potential', submission.sublicensingPotential],
  ]

  const summaryLines = [
    `Brand Name: ${brandName}`,
    `Score: ${total_score_0_to_10.toFixed(2)}/10`,
    `Decision: ${decisionLabel}`,
    '',
    'AI Analysis Summary:',
    aiAnalysisSummary,
    '',
    'Section Scores:',
    `- Mapping: ${(sectionScores?.mapping?.normalized * 100 || 0).toFixed(1)}%`,
    `- Operating: ${(sectionScores?.operating?.normalized * 100 || 0).toFixed(1)}%`,
    `- Expansion: ${(sectionScores?.expansion?.normalized * 100 || 0).toFixed(1)}%`,
    `- Special Conditions: ${(sectionScores?.special_conditions?.normalized * 100 || 0).toFixed(1)}%`,
    '',
    'Submitted Details:',
    ...detailFields.map(([label, value]) => `- ${label}: ${formatValue(value)}`),
  ]

  const textBody = summaryLines.join('\n')

  const sendOne = async (to, isInternal = false) => {
    if (!to) return
    await transporter.sendMail({
      from: EMAIL_FROM || SMTP_USER || 'no-reply@yourdomain.com',
      to,
      subject: isInternal ? `[INTERNAL] ${subjectBase}` : subjectBase,
      text: textBody,
    })
  }

  // Send to client
  if (userEmail) {
    await sendOne(userEmail, false)
  }

  // Send to internal team
  if (internalEmail) {
    await sendOne(internalEmail, true)
  }
}
