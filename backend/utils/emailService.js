import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  INTERNAL_ELIGIBILITY_EMAIL,
} = process.env
// Your internal email

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 587,
  secure: SMTP_SECURE === 'true',
  auth: SMTP_USER
    ? {
        user: SMTP_USER,
        pass: SMTP_PASS,
      }
    : undefined,
})

export const sendEligibilityEmails = async ({ submission, scoreResult, aiAnalysisSummary }) => {
  const userEmail = submission.submittedByEmail
  const internalEmail = INTERNAL_ELIGIBILITY_EMAIL

  if (!userEmail && !internalEmail) {
    console.warn('No recipient email configured for eligibility submission.')
    return
  }

  const { total_score_0_to_10, decision } = scoreResult
  const brandName = submission.brandName

  const subjectBase = `Skope Kitchens Eligibility Result – ${brandName} (${total_score_0_to_10.toFixed(
    2
  )}/10, ${decision === 'MOVE_FORWARD' ? 'Approved' : 'Needs Review'})`

  const summaryLines = [
    `Brand Name: ${brandName}`,
    `Score: ${total_score_0_to_10.toFixed(2)}/10`,
    `Decision: ${decision === 'MOVE_FORWARD' ? 'APPROVED (>= 8.5)' : 'REVIEW (Below 8.5)'}`,
    '',
    'AI Analysis Summary:',
    aiAnalysisSummary,
    '',
    'Key Inputs:',
    `- Brand Strength: ${submission.brandStrength}`,
    `- Social Media Engagement: ${submission.socialMediaEngagement}`,
    `- DSP Ratings: ${submission.dspRatings}`,
    `- B&M Delivery Sales per Day: ${submission.bmDeliverySales}`,
    `- Delivery AOV: ${submission.deliveryAOV}`,
    `- COGS Analysis: ${submission.cogsAnalysis}`,
    `- Wastage Risk: ${submission.wastageRisk}`,
    `- Number of Menu Items: ${submission.numberOfMenuItems}`,
    `- Packaging Type: ${submission.packagingType}`,
    `- Activation Opportunities: ${submission.activationOpportunities}`,
    `- Domestic Opportunities: ${submission.domesticOpportunities}`,
    `- Retrofitting Needed: ${submission.retrofittingNeeded}`,
    `- Multiple Deliveries Needed: ${submission.multipleDeliveries}`,
    `- Equipment Availability: ${submission.equipmentAvailability}`,
  ]

  const textBody = summaryLines.join('\n')

  const sendOne = async (to, isInternal = false) => {
    if (!to) return
    await transporter.sendMail({
      from: EMAIL_FROM || SMTP_USER,
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


