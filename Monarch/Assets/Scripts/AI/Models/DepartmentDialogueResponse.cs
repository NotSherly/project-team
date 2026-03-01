using System;
using System.Collections.Generic;
using MonarchSim.Domain.Enums;

namespace MonarchSim.AI.Models
{
    /// <summary>
    /// 部门AI的回复结构
    /// </summary>
    [Serializable]
    public sealed class DepartmentDialogueResponse
    {
        public DepartmentId DepartmentId; // 部门ID
        public string ReplyText; // 回复的文本
        public string Stance; // 立场
        public List<DepartmentProposal> Proposals = new List<DepartmentProposal>(); // 提案列表
        public List<string> Risks = new List<string>(); // 风险列表
    }
}
