using System;
using MonarchSim.Domain.Enums;

namespace MonarchSim.AI.Models
{
    /// <summary>
    /// 部门提案
    /// AI回复中捎带的可采纳行动
    /// </summary>
    [Serializable]
    public sealed class DepartmentProposal
    {
        public ProposalType ProposalType; // 提案类型
        public string Title; // 标题
        public string Description; // 描述
        public float SuggestedFloatValue; // 建议float参数值
        public int SuggestedIntValue; // 建议int参数值
    }
}
