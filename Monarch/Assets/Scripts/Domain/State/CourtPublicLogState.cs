using System;
using System.Collections.Generic;
using MonarchSim.AI.Models;

namespace MonarchSim.Domain.State
{
    /// <summary>
    /// 朝廷公共纪要状态
    /// 各部门共享的事实板，保存公共内容
    /// </summary>
    [Serializable]
    public sealed class CourtPublicLogState
    {
        public List<PublicMemoItem> PublicMemos = new List<PublicMemoItem>();
    }
}
