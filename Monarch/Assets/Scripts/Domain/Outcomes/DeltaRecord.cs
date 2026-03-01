using System;

namespace MonarchSim.Domain.Outcomes
{
    /// <summary>
    /// 记录数值变化
    /// </summary>
    [Serializable]
    public sealed class DeltaRecord
    {
        public string Key; // 字段名
        public float Delta; // 变化量
        public string Reason; // 原因
    }
}
