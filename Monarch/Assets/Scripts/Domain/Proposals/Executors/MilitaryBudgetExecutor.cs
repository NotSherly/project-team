using MonarchSim.AI.Models;
using MonarchSim.Data.Json;
using MonarchSim.Domain.Enums;
using MonarchSim.Domain.Outcomes;
using MonarchSim.Domain.Proposals;
using MonarchSim.Domain.Systems;

namespace MonarchSim.Domain.Proposals.Executors
{
    /// <summary>
    /// 执行军费调整
    /// </summary>
    public sealed class MilitaryBudgetExecutor : IProposalExecutor
    {
        private readonly PolicySystem _policySystem;
        private readonly BalanceConfig _balance;

        public ProposalType Type => ProposalType.IncreaseMilitaryBudget;

        public MilitaryBudgetExecutor(PolicySystem policySystem, BalanceConfig balance)
        {
            _policySystem = policySystem;
            _balance = balance;
        }

        public Outcome Execute(DepartmentId sourceDepartment, DepartmentProposal proposal)
        {
            var v = proposal.SuggestedIntValue;
            if (v < _balance.Proposals.MilitaryBudgetMin) v = _balance.Proposals.MilitaryBudgetMin;
            if (v > _balance.Proposals.MilitaryBudgetMax) v = _balance.Proposals.MilitaryBudgetMax;

            return _policySystem.ApplyMilitaryBudget(v, sourceDepartment);
        }
    }
}