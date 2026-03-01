using System;

namespace MonarchSim.Domain.State
{
    /// <summary>
    /// 政策状态
    /// </summary>
    [Serializable]
    public sealed class PolicyState
    {
        public float TaxRate = 0.12f;
        public int MilitaryBudget = 100;
    }
}
