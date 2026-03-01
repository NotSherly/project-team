using System;
using System.Collections.Generic;
using MonarchSim.Data.Json;
using MonarchSim.Domain.Enums;

namespace MonarchSim.AI.Models
{
    /// <summary>
    /// 提供给部门AI的请求结构，封装本次部门回复所需的全部上下文
    /// </summary>
    [Serializable]
    public sealed class DepartmentDialogueRequest
    {
        public DepartmentId DepartmentId; // 部门ID
        public DepartmentRoleConfig RoleConfig; // 角色配置
        public List<string> PrivateMemories = new List<string>(); // 私有记忆
        public List<string> RecentDialogueSummaries = new List<string>(); // 最近对话摘要
        public DepartmentSyncPacket SyncPacket; // 同步包
        public string PlayerMessage; // 皇帝本轮的发言
    }
}
