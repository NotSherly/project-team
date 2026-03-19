using System;

namespace MonarchSim.Domain.Events
{
    /// <summary>
    /// 资源变更事件
    /// </summary>
    [Serializable]
    public sealed class ResourceChangedEvent : DomainEventBase
    {
        public int GoldDelta; // 国库资金变化量
        public int GrainDelta; // 粮食变化量
        public float PublicSupportDelta; // 民心变化量
        public string Reason; // 原因
    }
}
