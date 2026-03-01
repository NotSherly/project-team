using System;

namespace MonarchSim.Domain.Outcomes
{
    /// <summary>
    /// 记录某个事实的前后变化
    /// </summary>
    [Serializable]
    public sealed class FactChange
    {
        public string Key; // 字段名
        public string Before; // 变化前状态
        public string After; // 变化后状态
    }
}
