using System;
using System.Collections.Generic;
using MonarchSim.Data.Json;
using MonarchSim.Domain.Enums;
using UnityEngine;

namespace MonarchSim.Data
{
    /// <summary>
    /// 将ProposalCatalogConfig的Items编译成运行时字典
    /// </summary>
    public sealed class ProposalCatalog
    {
        private readonly Dictionary<ProposalType, ProposalDefinition> _defs = new Dictionary<ProposalType, ProposalDefinition>();

        public ProposalCatalog(ProposalCatalogConfig config)
        {
            if (config == null || config.Items == null) return;

            foreach (var def in config.Items)
            {
                if (def == null || string.IsNullOrWhiteSpace(def.Key)) continue;

                if (!Enum.TryParse(def.Key, out ProposalType type))
                {
                    Debug.LogWarning($"[ProposalCatalog] Unknown ProposalType key: {def.Key}");
                    continue;
                }

                _defs[type] = def;
            }
        }

        /// <summary>
        /// 获取定义
        /// </summary>
        /// <param name="type"></param>
        /// <param name="def"></param>
        /// <returns></returns>
        public bool TryGet(ProposalType type, out ProposalDefinition def) => _defs.TryGetValue(type, out def);

        /// <summary>
        /// 获取不到给一个默认定义
        /// </summary>
        /// <param name="type"></param>
        /// <returns></returns>
        public ProposalDefinition GetOrDefault(ProposalType type)
        {
            if (TryGet(type, out var def)) return def;
            return new ProposalDefinition { Key = type.ToString(), DisplayName = type.ToString(), Category = "General", Enabled = true };
        }

        /// <summary>
        /// 是否启用
        /// </summary>
        /// <param name="type"></param>
        /// <returns></returns>
        public bool IsEnabled(ProposalType type)
        {
            return TryGet(type, out var def) ? def.Enabled : true;
        }
    }
}