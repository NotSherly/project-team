using System;
using System.IO;
using UnityEngine;
using MonarchSim.Data.Json;

namespace MonarchSim.Data
{
    /// <summary>
    /// 读取proposals.json
    /// </summary>
    public static class ProposalCatalogProvider
    {
        [Serializable]
        private sealed class CatalogWrapper
        {
            public ProposalCatalogConfig Catalog = new ProposalCatalogConfig();
        }

        public static ProposalCatalog LoadOrDefault()
        {
            try
            {
                var path = Path.Combine(UnityEngine.Application.streamingAssetsPath, "Config", "proposals.json");
                if (File.Exists(path))
                {
                    var json = File.ReadAllText(path);
                    var wrapper = JsonUtility.FromJson<CatalogWrapper>(json);
                    if (wrapper != null && wrapper.Catalog != null)
                    {
                        Debug.Log($"[ProposalCatalogProvider] Loaded: {path}");
                        return new ProposalCatalog(wrapper.Catalog);
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[ProposalCatalogProvider] Load failed: {ex.Message}");
            }

            Debug.Log("[ProposalCatalogProvider] Use default proposal catalog.");
            return new ProposalCatalog(DefaultConfigFactory.CreateDefaultProposalCatalog());
        }
    }
}