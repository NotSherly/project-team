using System;
using System.Collections.Generic;

namespace MonarchSim.AI.Models
{
    /// <summary>
    /// 会和总结回复体，显示在回合结束面板
    /// </summary>
    [Serializable]
    public sealed class TurnSummaryResponse
    {
        public string Title; // 标题
        public string SummaryText; // 总结文本
        public List<string> Risks = new List<string>(); // 风险提示
        public List<string> NextFocusSuggestions = new List<string>(); // 下回合建议
    }
}
