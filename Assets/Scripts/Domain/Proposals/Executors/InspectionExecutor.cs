using MonarchSim.AI.Models;
using MonarchSim.Data.Json;
using MonarchSim.Domain.Enums;
using MonarchSim.Domain.Outcomes;
using MonarchSim.Domain.Proposals;
using MonarchSim.Domain.Systems;

namespace MonarchSim.Domain.Proposals.Executors
{
    /// <summary>
    /// 执行巡查
    /// </summary>
    public sealed class InspectionExecutor : IProposalExecutor
    {
        private readonly ResourceSystem _resourceSystem;
        private readonly BalanceConfig _balance;

        public ProposalType Type => ProposalType.LaunchInspection;

        public InspectionExecutor(ResourceSystem resourceSystem, BalanceConfig balance)
        {
            _resourceSystem = resourceSystem;
            _balance = balance;
        }

        public Outcome Execute(DepartmentId sourceDepartment, DepartmentProposal proposal)
        {
            var goldCost = -_balance.Proposals.InspectionGoldCost;
            var supportGain = _balance.Proposals.InspectionPublicSupportGain;

            var outcome = _resourceSystem.AddResources(
                goldDelta: goldCost,
                grainDelta: 0,
                publicSupportDelta: supportGain,
                reason: "派员巡查，整肃吏治。"
            );

            outcome.Source = "InspectionExecutor";
            outcome.Title = "派员巡查";
            outcome.Causes.Add(new CauseRecord { Description = $"采纳{sourceDepartment}建议：派员巡查。" });
            outcome.Effects.Add(new EffectRecord { Description = "短期舆情改善，但需投入经费。" });
            return outcome;
        }
    }
}