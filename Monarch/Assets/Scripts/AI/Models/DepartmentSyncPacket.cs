using System;
using System.Collections.Generic;
using MonarchSim.Domain.Enums;

namespace MonarchSim.AI.Models
{
    /// <summary>
    /// 部门同步包
    /// 在某部被召见时告知最近发生了什么
    /// </summary>
    [Serializable]
    public sealed class DepartmentSyncPacket
    {
        public DepartmentId DepartmentId; // 部门ID
        public int FromWorldVersion; // 来源世界版本
        public int ToWorldVersion; // 目标世界版本
        public List<PublicMemoItem> RecentPublicMemos = new List<PublicMemoItem>(); // 最近的公共纪要
        public WorldStateSnapshot Snapshot; // 当前世界快照
    }
}
