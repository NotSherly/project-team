using System;

namespace MonarchSim.AI.Models
{
    /// <summary>
    /// 世界状态快照
    /// </summary>
    [Serializable]
    public sealed class WorldStateSnapshot
    {
        public int WorldVersion;
        public int Year;
        public int Month;
        public int Turn;
        public int Gold;
        public int Grain;
        public float PublicSupport;

        public float TaxRate;
        public int MilitaryBudget;
    }
}