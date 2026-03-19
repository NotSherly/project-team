using System.Linq;
using MonarchSim.AI.Models;

namespace MonarchSim.AI.Sessions
{
    /// <summary>
    /// 上下文拼装器
    /// 将部门配置、私有记忆、最近对话、同步包、玩家提问拼成一个统一请求对象
    /// </summary>
    public sealed class PromptContextBuilder
    {
        public DepartmentDialogueRequest BuildDepartmentRequest(
            DepartmentSessionContext context,
            DepartmentSyncPacket syncPacket,
            string playerMessage)
        {
            return new DepartmentDialogueRequest
            {
                DepartmentId = context.State.DepartmentId,
                RoleConfig = context.RoleConfig,
                PrivateMemories = context.State.PrivateMemories.ToList(),
                RecentDialogueSummaries = context.State.RecentDialogues
                    .Select(x => $"{x.Speaker}：{x.Content}")
                    .ToList(),
                SyncPacket = syncPacket,
                PlayerMessage = playerMessage
            };
        }
    }
}
