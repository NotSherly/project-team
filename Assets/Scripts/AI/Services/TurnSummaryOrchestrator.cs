using System.Collections.Generic;
using System.Threading.Tasks;
using MonarchSim.AI.Interfaces;
using MonarchSim.AI.Models;
using MonarchSim.AI.Sessions;
using MonarchSim.Domain.Outcomes;

namespace MonarchSim.AI.Services
{
    /// <summary>
    /// 回合总结编排器
    /// </summary>
    public sealed class TurnSummaryOrchestrator
    {
        private readonly ISummaryAIService _summaryAIService;
        private readonly WorldStateSyncService _syncService;
        private readonly CourtPublicMemoBoard _memoBoard;

        public TurnSummaryOrchestrator(
            ISummaryAIService summaryAIService,
            WorldStateSyncService syncService,
            CourtPublicMemoBoard memoBoard)
        {
            _summaryAIService = summaryAIService;
            _syncService = syncService;
            _memoBoard = memoBoard;
        }

        /// <summary>
        /// 生成总结
        /// 取当前世界快照，收集本回合Outcome，取最近公共纪要，交给总结AI生成回合总结
        /// </summary>
        /// <param name="outcomes"></param>
        /// <returns></returns>
        public Task<TurnSummaryResponse> GenerateAsync(List<Outcome> outcomes)
        {
            var request = new TurnSummaryRequest
            {
                Snapshot = _syncService.BuildSnapshot(),
                Outcomes = outcomes,
                RecentPublicMemos = _memoBoard.GetRecent(6)
            };

            return _summaryAIService.GenerateTurnSummaryAsync(request);
        }
    }
}
