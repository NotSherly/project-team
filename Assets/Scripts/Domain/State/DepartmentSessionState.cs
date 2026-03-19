using System;
using System.Collections.Generic;
using MonarchSim.Domain.Enums;

namespace MonarchSim.Domain.State
{
    /// <summary>
    /// 单个部门的会话状态
    /// 保证每个部门保存自己的记忆和状态
    /// </summary>
    [Serializable]
    public sealed class DepartmentSessionState
    {
        public DepartmentId DepartmentId; // 部门ID
        public int LastSeenWorldVersion; // 上次同步的世界版本
        public float TrustToEmperor; // 对皇帝的信任程度
        public float Conservatism; // 保守程度
        public float RiskTolerance; // 风险偏好程度
        public List<string> PrivateMemories = new List<string>(); // 私有记忆
        public List<DialogueMessage> RecentDialogues = new List<DialogueMessage>(); // 最近的对话记录
        public int LastAudienceTurn = -1; // 上次被召见的回合数
    }
}
