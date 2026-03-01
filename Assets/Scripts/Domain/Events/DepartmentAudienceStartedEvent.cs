using System;

namespace MonarchSim.Domain.Events
{
    /// <summary>
    /// 开始召见某部发出的信号事件
    /// </summary>
    [Serializable]
    public sealed class DepartmentAudienceStartedEvent : DomainEventBase
    {
        public string DepartmentName; // 部门名称
    }
}
