using System.Collections.Generic;
using System.Threading.Tasks;
using MonarchSim.AI.Models;
using MonarchSim.Application.UseCases;
using MonarchSim.Domain.Enums;
using MonarchSim.Domain.Outcomes;
using MonarchSim.Domain.State;

namespace MonarchSim.Application.Facades
{
    /// <summary>
    /// 对外统一入口
    /// </summary>
    public sealed class GameFacade
    {
        private readonly GameState _state;
        private readonly SummonDepartmentUseCase _summonDepartmentUseCase;
        private readonly SendDepartmentMessageUseCase _sendDepartmentMessageUseCase;
        private readonly AdoptProposalUseCase _adoptProposalUseCase;
        private readonly EndTurnUseCase _endTurnUseCase;

        public GameFacade(
            GameState state,
            SummonDepartmentUseCase summonDepartmentUseCase,
            SendDepartmentMessageUseCase sendDepartmentMessageUseCase,
            AdoptProposalUseCase adoptProposalUseCase,
            EndTurnUseCase endTurnUseCase)
        {
            _state = state;
            _summonDepartmentUseCase = summonDepartmentUseCase;
            _sendDepartmentMessageUseCase = sendDepartmentMessageUseCase;
            _adoptProposalUseCase = adoptProposalUseCase;
            _endTurnUseCase = endTurnUseCase;
        }

        public GameState State => _state;

        /// <summary>
        /// 召见
        /// </summary>
        /// <param name="departmentId"></param>
        /// <returns></returns>
        public string SummonDepartment(DepartmentId departmentId)
        {
            return _summonDepartmentUseCase.Execute(departmentId);
        }

        /// <summary>
        /// 提问
        /// </summary>
        /// <param name="departmentId"></param>
        /// <param name="playerMessage"></param>
        /// <returns></returns>
        public Task<DepartmentDialogueResponse> SendMessageToDepartmentAsync(DepartmentId departmentId, string playerMessage)
        {
            return _sendDepartmentMessageUseCase.ExecuteAsync(departmentId, playerMessage);
        }

        /// <summary>
        /// 执行提案
        /// </summary>
        /// <param name="sourceDepartment"></param>
        /// <param name="proposal"></param>
        /// <returns></returns>
        public Outcome AdoptProposal(DepartmentId sourceDepartment, DepartmentProposal proposal)
        {
            return _adoptProposalUseCase.Execute(sourceDepartment, proposal);
        }

        /// <summary>
        /// 结束回合
        /// </summary>
        /// <returns></returns>
        public Task<(List<Outcome> outcomes, TurnSummaryResponse summary)> EndTurnAsync()
        {
            return _endTurnUseCase.ExecuteAsync();
        }
    }
}
