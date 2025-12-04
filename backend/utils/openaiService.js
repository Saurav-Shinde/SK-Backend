import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const generateAnalysisSummary = async (formData, scoreResult) => {
  const { total_score_0_to_10, meets_threshold, section_scores, brand_name } = scoreResult
  const isApproved = meets_threshold && total_score_0_to_10 >= 8.5
  
  try {

    // Build context from form data
    const context = `
Brand Name: ${brand_name}
Number of Outlets: ${formData.brandStrength || 'Not specified'}
Social Media Engagement: ${formData.socialMediaEngagement || 'Not specified'}
DSP Ratings: ${formData.dspRatings || 'Not specified'}
B&M Delivery Sales per Day: ${formData.bmDeliverySales || 'Not specified'}
Delivery AOV: ${formData.deliveryAOV || 'Not specified'}
COGS Analysis: ${formData.cogsAnalysis || 'Not specified'}
Wastage Risk: ${formData.wastageRisk || 'Not specified'}
Number of Menu Items: ${formData.numberOfMenuItems || 'Not specified'}
Packaging Type: ${formData.packagingType || 'Not specified'}
Activation Opportunities: ${formData.activationOpportunities || 'Not specified'}
Domestic Opportunities: ${formData.domesticOpportunities || 'Not specified'}
Retrofitting Needed: ${formData.retrofittingNeeded || 'Not specified'}
Multiple Deliveries: ${formData.multipleDeliveries || 'Not specified'}
Equipment Availability: ${formData.equipmentAvailability || 'Not specified'}
`

    const sectionBreakdown = `
Section Scores:
- Mapping: ${(section_scores.mapping.normalized * 100).toFixed(1)}%
- Operating: ${(section_scores.operating.normalized * 100).toFixed(1)}%
- Expansion: ${(section_scores.expansion.normalized * 100).toFixed(1)}%
- Special Conditions: ${(section_scores.special_conditions.normalized * 100).toFixed(1)}%
`

    const prompt = isApproved
      ? `You are an expert business analyst for Skope Kitchens, a cloud kitchen platform. A brand has been evaluated and scored ${total_score_0_to_10.toFixed(2)}/10, which meets the approval threshold (≥8.5).

${context}

${sectionBreakdown}

Generate a personalized, professional analysis summary (2-3 paragraphs, 150-200 words) that:
1. Congratulates the brand on their strong performance
2. Highlights their key strengths based on the provided data
3. Mentions specific positive aspects from their submission (outlets, sales, ratings, etc.)
4. Emphasizes alignment with Skope Kitchens standards
5. Is warm, professional, and encouraging

Write in second person ("Your brand...", "You have..."). Be specific about their strengths. Do not include suggestions for improvement since they are approved.`
      : `You are an expert business analyst for Skope Kitchens, a cloud kitchen platform. A brand has been evaluated and scored ${total_score_0_to_10.toFixed(2)}/10, which is below the approval threshold (8.5).

${context}

${sectionBreakdown}

Generate a personalized, professional analysis summary (2-3 paragraphs, 150-200 words) that:
1. Acknowledges their submission professionally
2. Identifies specific areas that need improvement based on the provided data
3. Points out weaknesses in mapping, operations, or special conditions
4. Provides constructive feedback without being discouraging
5. Encourages them to address gaps and resubmit

Write in second person ("Your brand...", "We noticed..."). Be specific about areas needing improvement. Focus on actionable feedback.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional business analyst specializing in food service and cloud kitchen partnerships. Provide clear, actionable, and professional analysis.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 400,
    })

    const summary = completion.choices[0]?.message?.content?.trim()

    if (!summary) {
      throw new Error('OpenAI did not return a summary')
    }

    return summary
  } catch (error) {
    console.error('OpenAI API error:', error)
    // Fallback summary if OpenAI fails
    const isApproved = meets_threshold && total_score_0_to_10 >= 8.5
    if (isApproved) {
      return `Your brand "${brand_name}" demonstrates excellent consistency across mapping, operations, and expansion potential. With a score of ${total_score_0_to_10.toFixed(2)}/10, your current scale and partner portfolio align perfectly with Skope Kitchens standards.`
    } else {
      return `We've reviewed your brand "${brand_name}" and identified several areas that need attention. With a score of ${total_score_0_to_10.toFixed(2)}/10, we recommend addressing the highlighted gaps in your profile before resubmission.`
    }
  }
}

