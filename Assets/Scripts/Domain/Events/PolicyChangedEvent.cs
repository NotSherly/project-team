using System;

namespace MonarchSim.Domain.Events
{
    /// <summary>
    /// 政策变更事件
    /// </summary>
    [Serializable]
    public sealed class PolicyChangedEvent : DomainEventBase
    {
        public string PolicyKey;       // 例如 TaxRate / MilitaryBudget
        public float OldValue;
        public float NewValue;
        public string SourceDepartment;
        public string Summary;
    }
}