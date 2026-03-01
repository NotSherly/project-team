using System;
using System.IO;
using UnityEngine;
using MonarchSim.Data.Json;

namespace MonarchSim.Data
{
    /// <summary>
    /// 读取balance.json
    /// </summary>
    public static class BalanceConfigProvider
    {
        [Serializable]
        private sealed class BalanceWrapper
        {
            public BalanceConfig Balance = new BalanceConfig();
        }

        public static BalanceConfig LoadOrDefault()
        {
            try
            {
                var path = Path.Combine(UnityEngine.Application.streamingAssetsPath, "Config", "balance.json");
                if (File.Exists(path))
                {
                    var json = File.ReadAllText(path);
                    var wrapper = JsonUtility.FromJson<BalanceWrapper>(json);
                    if (wrapper != null && wrapper.Balance != null)
                    {
                        Debug.Log($"[BalanceConfigProvider] Loaded: {path}");
                        return wrapper.Balance;
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[BalanceConfigProvider] Load failed: {ex.Message}");
            }

            Debug.Log("[BalanceConfigProvider] Use default balance config.");
            return DefaultConfigFactory.CreateDefaultBalance();
        }
    }
}