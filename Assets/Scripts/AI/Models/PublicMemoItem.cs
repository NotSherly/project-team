using System;

namespace MonarchSim.AI.Models
{
    /// <summary>
    /// 一条公共纪要，公开时间线的基本单位
    /// </summary>
    [Serializable]
    public sealed class PublicMemoItem
    {
        public int WorldVersion; // 世界版本
        public string Title; // 标题
        public string Summary; // 摘要
        public string Category; // 分类
        public string CreatedAt; // 时间
    }
}
