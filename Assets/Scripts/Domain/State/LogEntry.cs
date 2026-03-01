using System;

namespace MonarchSim.Domain.State
{
    /// <summary>
    /// 结构化日志记录
    /// </summary>
    [Serializable]
    public sealed class LogEntry
    {
        public int WorldVersion;
        public int Year;
        public int Month;
        public int Turn;

        public string Category;
        public string Title;
        public string Summary;
        public string CreatedAt;
    }
}