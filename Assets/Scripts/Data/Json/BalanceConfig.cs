using System;

namespace MonarchSim.Data.Json
{
    /// <summary>
    /// balance.json 的 C# 映射结构，下面包含若干分组
    /// </summary>
    [Serializable]
    public sealed class BalanceConfig
    {
        public TaxPolicyBalance TaxPolicy = new TaxPolicyBalance();
        public MonthlyResolutionBalance Monthly = new MonthlyResolutionBalance();
        public EventBalance Events = new EventBalance();
        public ProposalBalance Proposals = new ProposalBalance();
    }

    [Serializable]
    public sealed class TaxPolicyBalance
    {
        public float MinTaxRate = 0.05f;
        public float MaxTaxRate = 0.30f;
        public float PublicSupportImpactScale = 40f;
    }

    [Serializable]
    public sealed class MonthlyResolutionBalance
    {
        public int BaseTaxIncome = 80;
        public float TaxIncomeMultiplier = 300f;
        public int GrainConsumption = 30;

        public float HighTaxThreshold = 0.16f;
        public float HighTaxSupportDrift = -2.5f;
        public float LowTaxSupportDrift = 0.8f;
    }

    [Serializable]
    public sealed class EventBalance
    {
        public int LowGrainThreshold = 120;
        public float LowGrainSupportPenalty = 4f;

        public float LowSupportThreshold = 35f;
        public int LowSupportGoldPenalty = 25;
    }

    [Serializable]
    public sealed class ProposalBalance
    {
        public int ReliefGrainCost = 60;
        public float ReliefPublicSupportGain = 10f;

        public int InspectionGoldCost = 15;
        public float InspectionPublicSupportGain = 4f;

        public int MilitaryBudgetMin = 0;
        public int MilitaryBudgetMax = 500;
        public int MilitaryBudgetStepGoldCost = 10;

        public int IrrigationGoldCost = 50;
        public int IrrigationGrainGain = 40;
    }
}