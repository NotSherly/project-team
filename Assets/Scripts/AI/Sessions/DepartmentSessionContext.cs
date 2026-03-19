using System.Linq;
using MonarchSim.Data.Json;
using MonarchSim.Domain.State;

namespace MonarchSim.AI.Sessions
{
    /// <summary>
    /// 单个部门的会话上下文包装器，六部独立线程的具体承载对象
    /// </summary>
    public sealed class DepartmentSessionContext
    {
        public DepartmentRoleConfig RoleConfig { get; }
        public DepartmentSessionState State { get; }

        public DepartmentSessionContext(DepartmentRoleConfig roleConfig, DepartmentSessionState state)
        {
            RoleConfig = roleConfig;
            State = state;
        }

        /// <summary>
        /// 新增最近会话
        /// </summary>
        /// <param name="speaker">说话人</param>
        /// <param name="content">内容</param>
        /// <param name="keepLatest">保持的最近会话数量</param>
        public void AppendDialogue(string speaker, string content, int keepLatest = 8)
        {
            State.RecentDialogues.Add(new DialogueMessage(speaker, content));
            if (State.RecentDialogues.Count > keepLatest)
            {
                State.RecentDialogues = State.RecentDialogues.TakeLast(keepLatest).ToList();
            }
        }

        /// <summary>
        /// 新增私有记忆
        /// </summary>
        /// <param name="memory">私有记忆内容</param>
        /// <param name="keepLatest">保持的私有记忆数量</param>
        public void AppendPrivateMemory(string memory, int keepLatest = 10)
        {
            if (string.IsNullOrWhiteSpace(memory))
            {
                return;
            }

            State.PrivateMemories.Add(memory);
            if (State.PrivateMemories.Count > keepLatest)
            {
                State.PrivateMemories = State.PrivateMemories.TakeLast(keepLatest).ToList();
            }
        }
    }
}
