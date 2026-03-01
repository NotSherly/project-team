using System;
using System.Collections.Generic;
using MonarchSim.Domain.Outcomes;

namespace MonarchSim.AI.Models
{
    /// <summary>
    /// 会和总结请求体，提供给负责总结的AI
    /// </summary>
    [Serializable]
    public sealed class TurnSummaryRequest
    {
        public WorldStateSnapshot Snapshot; // 当前世界快照
        public List<Outcome> Outcomes = new List<Outcome>(); // 本回合的所有产出的输出
        public List<PublicMemoItem> RecentPublicMemos = new List<PublicMemoItem>(); // 最近公共纪要
    }
}
