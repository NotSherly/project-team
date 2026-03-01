using System;
using System.Collections.Generic;

namespace MonarchSim.Data.Json
{
    /// <summary>
    /// proposals.json 的 C# 映射结构
    /// </summary>
    [Serializable]
    public sealed class ProposalCatalogConfig
    {
        public List<ProposalDefinition> Items = new List<ProposalDefinition>();
    }

    [Serializable]
    public sealed class ProposalDefinition
    {
        public string Key;
        public string DisplayName;
        public string Category;
        public bool Enabled = true;

        public string ParamKind = "None"; // None/Float/Int

        public float MinFloat;
        public float MaxFloat;
        public float DefaultFloat;

        public int MinInt;
        public int MaxInt;
        public int DefaultInt;

        public string Description;
    }
}