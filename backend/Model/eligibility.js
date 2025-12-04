import mongoose from 'mongoose'

const eligibilitySchema = new mongoose.Schema(
  {
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    submittedByEmail: { type: String, default: null },

    brandName: { type: String, required: true },
    locationMapping: { type: String, required: true },
    brandStrength: { type: String, required: true },
    socialMediaEngagement: { type: String, required: true },
    dspRatings: { type: String, required: true },

    bmDeliverySales: { type: Number, required: true },
    deliveryAOV: { type: Number, required: true },
    cogsAnalysis: { type: String, required: true },
    dspRateType: { type: String, required: true },
    wastageRisk: { type: String, required: true },
    numberOfMenuItems: { type: Number, required: true },
    packagingType: { type: String, required: true },
    menuSupplyChainComplexity: { type: String },
    launchCapex: { type: String },
    smallwaresNeeded: { type: String },

    activationOpportunities: { type: String, required: true },
    domesticOpportunities: { type: String, required: true },
    dspMarketingCommitment: { type: String, required: true },

    retrofittingNeeded: { type: String, required: true },
    additionalSpaceRequired: { type: String },
    procurementSuppliers: { type: String },
    multipleDeliveries: { type: String, required: true },
    additionalTrainingTravel: { type: String },
    launchTravelCosts: { type: String },
    specialReportingIntegrations: { type: String },
    equipmentAvailability: { type: String, required: true },

    skopePartnerRelationships: { type: String, required: true },
    sublicensingPotential: { type: String, required: true },

    // Scoring and AI Analysis
    totalScore: { type: Number },
    meetsThreshold: { type: Boolean },
    decision: { type: String },
    sectionScores: {
      mapping: { raw: Number, normalized: Number },
      operating: { raw: Number, normalized: Number },
      expansion: { raw: Number, normalized: Number },
      special_conditions: { raw: Number, normalized: Number },
    },
    aiAnalysisSummary: { type: String },
  },
  { timestamps: true }
)

export default mongoose.model('EligibilitySubmission', eligibilitySchema)

