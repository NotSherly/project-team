using System;
using System.Collections.Generic;
using MonarchSim.Domain.Enums;

namespace MonarchSim.Domain.State
{
    /// <summary>
    /// 游戏状态容器
    /// </summary>
    [Serializable]
    public sealed class GameState
    {
        public WorldState World = new WorldState(); // 世界状态
        public CourtPublicLogState CourtPublicLog = new CourtPublicLogState(); // 公共纪要
        public Dictionary<DepartmentId, DepartmentSessionState> DepartmentSessions = new Dictionary<DepartmentId, DepartmentSessionState>(); // 部门与自己状态字典

        public List<LogEntry> Logs = new List<LogEntry>();

        public int RandomSeed = 20260227; // 随机种子
        public int SchemaVersion = 1; // 游戏状态数据结构版本号，用于存档兼容与数据迁移
    }
}
