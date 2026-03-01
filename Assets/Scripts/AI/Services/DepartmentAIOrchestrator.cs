using System.Threading.Tasks;
using MonarchSim.AI.Interfaces;
using MonarchSim.AI.Models;
using MonarchSim.AI.Sessions;

namespace MonarchSim.AI.Services
{
    /// <summary>
    /// 部门AI编排器
    /// </summary>
    public sealed class DepartmentAIOrchestrator
    {
        private readonly IDepartmentAIService _service;
        private readonly PromptContextBuilder _promptBuilder;
        private readonly WorldStateSyncService _syncService;

        public DepartmentAIOrchestrator(
            IDepartmentAIService service,
            PromptContextBuilder promptBuilder,
            WorldStateSyncService syncService)
        {
            _service = service;
            _promptBuilder = promptBuilder;
            _syncService = syncService;
        }

        /// <summary>
        /// 生成回复
        /// 先构造同步包，再构造AI请求，调用AI服务获取回复，将皇帝发言和部门回复计入会话历史，标记已同步
        /// </summary>
        /// <param name="context"></param>
        /// <param name="playerMessage"></param>
        /// <returns></returns>
        public async Task<DepartmentDialogueResponse> GenerateReplyAsync(
            DepartmentSessionContext context,
            string playerMessage)
        {
            var syncPacket = _syncService.BuildSyncPacket(context);
            var request = _promptBuilder.BuildDepartmentRequest(context, syncPacket, playerMessage);
            var response = await _service.GenerateDepartmentReplyAsync(request);

            context.AppendDialogue("皇帝", playerMessage);
            context.AppendDialogue(context.RoleConfig.DisplayName, response.ReplyText);

            _syncService.MarkSynced(context);
            return response;
        }
    }
}
