import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const {
  GMAIL_USER,
  GMAIL_PASS,
  EMAIL_FROM,
  INTERNAL_ELIGIBILITY_EMAIL,
} = process.env

// Internal fallback email
const DEFAULT_INTERNAL_EMAIL = 'Shindesaurav03@gmail.com'

// Gmail transporter (very simple)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS, // App password
  },
})

// Clean & simple function to send emails
export const sendEligibilityEmails = async ({ submission, scoreResult, aiAnalysisSummary }) => {
  const userEmail = submission.submittedByEmail
  const internalEmail = INTERNAL_ELIGIBILITY_EMAIL || DEFAULT_INTERNAL_EMAIL

  if (!userEmail && !internalEmail) {
    console.warn("No recipient email configured.")
    return
  }

  const { total_score_0_to_10, decision, section_scores } = scoreResult
  const brandName = submission.brandName
  const decisionLabel =
    decision === "MOVE_FORWARD" ? "Approved (>= 8.5)" : "Needs Review"

  // email subject
  const subject = `Skope Kitchens Eligibility Result – ${brandName} (${total_score_0_to_10.toFixed(
    2
  )}/10, ${decisionLabel})`

  // summary text
  const textBody = `
Brand Name: ${brandName}
Score: ${total_score_0_to_10.toFixed(2)}/10
Decision: ${decisionLabel}

AI Summary:
${aiAnalysisSummary}

Section Scores:
- Mapping: ${(section_scores.mapping.normalized * 100).toFixed(1)}%
- Operating: ${(section_scores.operating.normalized * 100).toFixed(1)}%
- Expansion: ${(section_scores.expansion.normalized * 100).toFixed(1)}%
- Special Conditions: ${(section_scores.special_conditions.normalized * 100).toFixed(1)}%

Submitted Details:
${Object.entries(submission)
  .map(([key, val]) => `- ${key}: ${Array.isArray(val) ? val.join(", ") : val}`)
  .join("\n")}
`

  const send = async (to) => {
    if (!to) return
    await transporter.sendMail({
      from: EMAIL_FROM || GMAIL_USER,
      to,
      subject,
      text: textBody,
    })
  }

  // Send to the user
  if (userEmail) await send(userEmail)

  // Send to internal team
  if (internalEmail) await send(internalEmail)
}
