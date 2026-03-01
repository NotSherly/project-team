using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MonarchSim.AI.Models;
using MonarchSim.AI.Services;
using MonarchSim.Core;
using MonarchSim.Data.Json;
using MonarchSim.Domain.Enums;
using MonarchSim.Domain.Events;
using MonarchSim.Domain.State;

namespace MonarchSim.AI.Sessions
{
    /// <summary>
    /// 六部会话总控器，关键部分
    /// </summary>
    public sealed class DepartmentSessionManager
    {
        private readonly Dictionary<DepartmentId, DepartmentSessionContext> _contexts;
        private readonly WorldStateSyncService _syncService;
        private readonly DepartmentAIOrchestrator _orchestrator;
        private readonly DialogueSummaryService _dialogueSummaryService;
        private readonly CourtPublicMemoBoard _memoBoard;
        private readonly GameState _state;
        private readonly EventBus _eventBus;

        public DepartmentSessionManager(
            IEnumerable<DepartmentRoleConfig> roleConfigs,
            GameState state,
            WorldStateSyncService syncService,
            DepartmentAIOrchestrator orchestrator,
            DialogueSummaryService dialogueSummaryService,
            CourtPublicMemoBoard memoBoard,
            EventBus eventBus)
        {
            _state = state;
            _syncService = syncService;
            _orchestrator = orchestrator;
            _dialogueSummaryService = dialogueSummaryService;
            _memoBoard = memoBoard;
            _eventBus = eventBus;

            _contexts = roleConfigs.ToDictionary(
                x => x.DepartmentId,
                x => new DepartmentSessionContext(x, state.DepartmentSessions[x.DepartmentId]));
        }

        /// <summary>
        /// 召见入口
        /// 取该部上下文、给该部补同步、记录这次召见、返回开场白
        /// </summary>
        /// <param name="departmentId">部门ID</param>
        /// <returns>开场白</returns>
        public string OpenAudience(DepartmentId departmentId)
        {
            var context = _contexts[departmentId];
            var syncPacket = _syncService.BuildSyncPacket(context);
            _syncService.MarkSynced(context);

            context.State.LastAudienceTurn = _state.World.Time.Turn;

            _eventBus.Publish(new DepartmentAudienceStartedEvent
            {
                WorldVersion = _state.World.WorldVersion,
                DepartmentName = context.RoleConfig.DisplayName
            });

            if (syncPacket.RecentPublicMemos.Count > 0)
            {
                var lastMemo = syncPacket.RecentPublicMemos.Last();
                return $"【{context.RoleConfig.DisplayName}】臣已候命。近日朝廷新讯：{lastMemo.Summary}";
            }

            return $"【{context.RoleConfig.DisplayName}】臣已候命。当前暂无新增公闻，请陛下示下。";
        }

        /// <summary>
        /// 向某部提问
        /// </summary>
        /// <param name="departmentId">部门ID</param>
        /// <param name="playerMessage">玩家信息</param>
        /// <returns>回应</returns>
        public async Task<DepartmentDialogueResponse> SendMessageAsync(DepartmentId departmentId, string playerMessage)
        {
            var context = _contexts[departmentId];
            var response = await _orchestrator.GenerateReplyAsync(context, playerMessage);

            var privateMemory = _dialogueSummaryService.BuildPrivateMemory(departmentId, playerMessage, response);
            context.AppendPrivateMemory(privateMemory);

            return response;
        }

        /// <summary>
        /// 将某次召见设置为公开朝廷纪要
        /// </summary>
        /// <param name="departmentId">部门ID</param>
        /// <param name="topic">主题</param>
        /// <param name="summary">摘要</param>
        public void AppendAudiencePublicMemo(DepartmentId departmentId, string topic, string summary)
        {
            var memo = _dialogueSummaryService.BuildPublicMemo(_state.World.WorldVersion, departmentId, topic, summary);
            _memoBoard.AppendMemo(memo);
        }

        /// <summary>
        /// 返回某部门的状态
        /// </summary>
        /// <param name="departmentId">部门ID</param>
        /// <returns>部门状态</returns>
        public DepartmentSessionState GetSessionState(DepartmentId departmentId)
        {
            return _contexts[departmentId].State;
        }
    }
}
