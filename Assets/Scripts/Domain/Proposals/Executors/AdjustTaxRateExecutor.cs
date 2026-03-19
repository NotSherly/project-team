using MonarchSim.AI.Models;
using MonarchSim.Domain.Enums;
using MonarchSim.Domain.Outcomes;
using MonarchSim.Domain.Proposals;
using MonarchSim.Domain.Systems;

namespace MonarchSim.Domain.Proposals.Executors
{
    /// <summary>
    /// 执行修改税率
    /// </summary>
    public sealed class AdjustTaxRateExecutor : IProposalExecutor
    {
        private readonly PolicySystem _policySystem;
        public ProposalType Type => ProposalType.AdjustTaxRate;

        public AdjustTaxRateExecutor(PolicySystem policySystem)
        {
            _policySystem = policySystem;
        }

        public Outcome Execute(DepartmentId sourceDepartment, DepartmentProposal proposal)
        {
            return _policySystem.ApplyTaxRate(proposal.SuggestedFloatValue, sourceDepartment);
        }
    }
}