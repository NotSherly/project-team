using System;
using MonarchSim.Domain.Enums;

namespace MonarchSim.Data.Json
{
    /// <summary>
    /// 六部角色配置结构
    /// 给AI Prompt、会话初始化、角色展示使用
    /// </summary>
    [Serializable]
    public class DepartmentRoleConfig
    {
        public DepartmentId DepartmentId; // 部门ID
        public string DisplayName; // 显示名称
        public string DutySummary; // 指责摘要
        public string SpeakingStyle; // 语言风格
        public float Conservatism = 0.5f; // 保守度
        public float RiskTolerance = 0.5f; // 风险偏好
        public float InitialTrust = 0.6f; // 初始信任
    }
}
