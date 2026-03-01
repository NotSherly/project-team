using System.Collections.Generic;
using System.Threading.Tasks;
using MonarchSim.AI.Models;
using MonarchSim.AI.Sessions;
using MonarchSim.AI.Services;
using MonarchSim.Domain.Outcomes;
using MonarchSim.Domain.Systems;

namespace MonarchSim.Application.UseCases
{
    /// <summary>
    /// 结束回合用例
    /// </summary>
    public sealed class EndTurnUseCase
    {
        private readonly TurnResolutionSystem _turnResolutionSystem;
        private readonly EventSystem _eventSystem;
        private readonly TurnSummaryOrchestrator _turnSummaryOrchestrator;
        private readonly CourtPublicMemoBoard _memoBoard;

        public EndTurnUseCase(
            TurnResolutionSystem turnResolutionSystem,
            EventSystem eventSystem,
            TurnSummaryOrchestrator turnSummaryOrchestrator,
            CourtPublicMemoBoard memoBoard)
        {
            _turnResolutionSystem = turnResolutionSystem;
            _eventSystem = eventSystem;
            _turnSummaryOrchestrator = turnSummaryOrchestrator;
            _memoBoard = memoBoard;
        }

        /// <summary>
        /// 结束回合，调用回合结算系统、事件系统，将结果写入公共纪要，调用总结器生成回合总结
        /// </summary>
        /// <returns></returns>
        public async Task<(List<Outcome> outcomes, TurnSummaryResponse summary)> ExecuteAsync()
        {
            var outcomes = new List<Outcome>();

            var turnOutcome = _turnResolutionSystem.ResolveEndTurn();
            outcomes.Add(turnOutcome);
            _memoBoard.AppendOutcomeMemo(turnOutcome, "TurnResolution");

            var eventOutcomes = _eventSystem.EvaluateEndTurnEvents();
            outcomes.AddRange(eventOutcomes);

            foreach (var outcome in eventOutcomes)
            {
                _memoBoard.AppendOutcomeMemo(outcome, "Event");
            }

            var summary = await _turnSummaryOrchestrator.GenerateAsync(outcomes);
            return (outcomes, summary);
        }
    }
}
