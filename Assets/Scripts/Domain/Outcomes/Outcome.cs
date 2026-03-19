using System;
using System.Collections.Generic;

namespace MonarchSim.Domain.Outcomes
{
    /// <summary>
    /// 一次动作/政策/事件/回合结算的统一输出结构
    /// 描述发生的情况，供公共纪要、回合总结和日志进行读取
    /// </summary>
    [Serializable]
    public sealed class Outcome
    {
        public int WorldVersion; // 世界版本
        public string Source; // 来源
        public string Title; // 标题
        public string Summary; // 摘要
        public List<FactChange> Facts = new List<FactChange>(); // 事实变化
        public List<DeltaRecord> Deltas = new List<DeltaRecord>(); // 数值变化
        public List<CauseRecord> Causes = new List<CauseRecord>(); // 原因
        public List<EffectRecord> Effects = new List<EffectRecord>(); // 影响
    }
}
