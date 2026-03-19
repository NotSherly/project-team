using System;

namespace MonarchSim.Domain.Events
{
    /// <summary>
    /// 领域事件基类
    /// </summary>
    [Serializable]
    public abstract class DomainEventBase
    {
        public int WorldVersion; // 世界版本
        public string CreatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"); // 创建时间
    }
}
