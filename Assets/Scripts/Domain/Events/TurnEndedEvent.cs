using System;

namespace MonarchSim.Domain.Events
{
    /// <summary>
    /// 回合结束事件
    /// </summary>
    [Serializable]
    public sealed class TurnEndedEvent : DomainEventBase
    {
        public int Year; // 年
        public int Month; // 月
        public int Turn; // 回合
    }
}
