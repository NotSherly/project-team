using MonarchSim.AI.Models;
using MonarchSim.Data.Json;
using MonarchSim.Domain.Enums;
using MonarchSim.Domain.Outcomes;
using MonarchSim.Domain.Proposals;
using MonarchSim.Domain.Systems;

namespace MonarchSim.Domain.Proposals.Executors
{
    /// <summary>
    /// 执行赈灾
    /// </summary>
    public sealed class GrainReliefExecutor : IProposalExecutor
    {
        private readonly ResourceSystem _resourceSystem;
        private readonly BalanceConfig _balance;

        public ProposalType Type => ProposalType.RequestGrainRelief;

        public GrainReliefExecutor(ResourceSystem resourceSystem, BalanceConfig balance)
        {
            _resourceSystem = resourceSystem;
            _balance = balance;
        }

        public Outcome Execute(DepartmentId sourceDepartment, DepartmentProposal proposal)
        {
            var cost = -_balance.Proposals.ReliefGrainCost;
            var gain = _balance.Proposals.ReliefPublicSupportGain;

            var outcome = _resourceSystem.AddResources(
                goldDelta: 0,
                grainDelta: cost,
                publicSupportDelta: gain,
                reason: "开仓赈济以安民心。"
            );

            outcome.Source = "GrainReliefExecutor";
            outcome.Title = "赈济拨粮";
            outcome.Causes.Add(new CauseRecord { Description = $"采纳{sourceDepartment}建议：赈济拨粮。" });
            outcome.Effects.Add(new EffectRecord { Description = "短期民心回升，但仓储压力上升。" });
            return outcome;
        }
    }
}