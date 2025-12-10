import dotenv from 'dotenv'

dotenv.config()

const {
  SENDGRID_API_KEY,
  EMAIL_FROM,
  SENDGRID_FROM_NAME,
  INTERNAL_ELIGIBILITY_EMAIL,
} = process.env

// Fallback internal email if env not set
const DEFAULT_INTERNAL_EMAIL = 'Shindesaurav03@gmail.com'

if (!SENDGRID_API_KEY) {
  console.warn(
    'WARNING: SENDGRID_API_KEY is not set. Emails will NOT be sent from this environment.'
  )
}

// Helper: send a single email via SendGrid API
const sendViaSendGrid = async ({ to, subject, text }) => {
  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid API key missing, skipping email send.')
    return
  }
  if (!to) return

  const fromEmail = EMAIL_FROM || 'no-reply@skopekitchens.com'
  const fromName = SENDGRID_FROM_NAME || 'Skope Kitchens'

  const body = {
    personalizations: [
      {
        to: [{ email: to }],
        subject,
      },
    ],
    from: {
      email: fromEmail,
      name: fromName,
    },
    content: [
      {
        type: 'text/plain',
        value: text,
      },
    ],
  }

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  // SendGrid returns 202 for success
  if (res.status !== 202) {
    const errText = await res.text().catch(() => '')
    console.error('SendGrid email failed:', res.status, errText)
  } else {
    console.log(`SendGrid email sent to ${to}`)
  }
}

export const sendEligibilityEmails = async ({
  submission,
  scoreResult,
  aiAnalysisSummary,
}) => {
  const userEmail = submission.submittedByEmail
  const internalEmail = INTERNAL_ELIGIBILITY_EMAIL || DEFAULT_INTERNAL_EMAIL

  if (!userEmail && !internalEmail) {
    console.warn('No recipient email configured for eligibility submission.')
    return
  }

  const { total_score_0_to_10, decision, section_scores: sectionScores } =
    scoreResult
  const brandName = submission.brandName
  const decisionLabel =
    decision === 'MOVE_FORWARD' ? 'Approved (>= 8.5)' : 'Needs Review'

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
    ['Swiggy Rating', submission.swiggyRating],
    ['Zomato Rating', submission.zomatoRating],
    ['DSP Rate Type', submission.dspRateType],
    ['DSP Rate Percent', submission.dspRatePercent],
    ['B&M Delivery Sales per Day', submission.bmDeliverySales],
    ['Delivery AOV', submission.deliveryAOV],
    ['COGS Analysis', submission.cogsAnalysis],
    ['Wastage Risk', submission.wastageRisk],
    ['Number of Menu Items', submission.numberOfMenuItems],
    ['Packaging Type', submission.packagingType],
    ['Menu Supply Chain Complexity', submission.menuSupplyChainComplexity],
    ['Launch Capex', submission.launchCapex],
    ['Launch Capex Pieces', submission.launchCapexPieces],
    ['Smallwares Cost', submission.smallwaresCost],
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
    ['How did you hear about us', submission.howDidYouHear],
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

  // Send to client
  if (userEmail) {
    await sendViaSendGrid({
      to: userEmail,
      subject: subjectBase,
      text: textBody,
    })
  }

  // Send to internal team
  if (internalEmail) {
    await sendViaSendGrid({
      to: internalEmail,
      subject: `[INTERNAL] ${subjectBase}`,
      text: textBody,
    })
  }
}
