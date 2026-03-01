using System;

namespace MonarchSim.Domain.Outcomes
{
    /// <summary>
    /// 记录后续影响说明
    /// </summary>
    [Serializable]
    public sealed class EffectRecord
    {
        public string Description; // 说明
    }
}
