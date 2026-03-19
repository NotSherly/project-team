using MonarchSim.AI.Models;
using MonarchSim.Data.Json;
using MonarchSim.Domain.Enums;
using MonarchSim.Domain.Outcomes;
using MonarchSim.Domain.Proposals;
using MonarchSim.Domain.Systems;

namespace MonarchSim.Domain.Proposals.Executors
{
    /// <summary>
    /// 执行兴修水利
    /// </summary>
    public sealed class IrrigationExecutor : IProposalExecutor
    {
        private readonly ResourceSystem _resourceSystem;
        private readonly BalanceConfig _balance;

        public ProposalType Type => ProposalType.BuildIrrigation;

        public IrrigationExecutor(ResourceSystem resourceSystem, BalanceConfig balance)
        {
            _resourceSystem = resourceSystem;
            _balance = balance;
        }

        public Outcome Execute(DepartmentId sourceDepartment, DepartmentProposal proposal)
        {
            var goldCost = -_balance.Proposals.IrrigationGoldCost;
            var grainGain = _balance.Proposals.IrrigationGrainGain;

            var outcome = _resourceSystem.AddResources(
                goldDelta: goldCost,
                grainDelta: grainGain,
                publicSupportDelta: 0f,
                reason: "兴修水利，增仓备荒。"
            );

            outcome.Source = "IrrigationExecutor";
            outcome.Title = "兴修水利";
            outcome.Causes.Add(new CauseRecord { Description = $"采纳{sourceDepartment}建议：兴修水利。" });
            outcome.Effects.Add(new EffectRecord { Description = "短期仓储改善，后续可扩展为长期增产加成。" });
            return outcome;
        }
    }
}