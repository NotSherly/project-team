using MonarchSim.AI.Models;
using MonarchSim.AI.Sessions;
using MonarchSim.Domain.Enums;
using MonarchSim.Domain.Outcomes;
using MonarchSim.Domain.Proposals;

namespace MonarchSim.Application.UseCases
{
    /// <summary>
    /// 采纳提案用例
    /// </summary>
    public sealed class AdoptProposalUseCase
    {
        private readonly ProposalExecutorRegistry _registry;
        private readonly CourtPublicMemoBoard _memoBoard;
        private readonly DepartmentSessionManager _sessionManager;

        public AdoptProposalUseCase(
            ProposalExecutorRegistry registry,
            CourtPublicMemoBoard memoBoard,
            DepartmentSessionManager sessionManager)
        {
            _registry = registry;
            _memoBoard = memoBoard;
            _sessionManager = sessionManager;
        }

        public Outcome Execute(DepartmentId sourceDepartment, DepartmentProposal proposal)
        {
            var outcome = _registry.ExecuteOrFallback(sourceDepartment, proposal);

            // 统一写入公共纪要（方便 UI/回放/同步）
            _memoBoard.AppendOutcomeMemo(outcome, "Proposal");

            // 召见纪要（按需保留/后续再优化为规则决定是否公开）
            _sessionManager.AppendAudiencePublicMemo(sourceDepartment, proposal.Title, proposal.Description);

            return outcome;
        }
    }
}