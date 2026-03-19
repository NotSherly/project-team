using System;
using System.IO;
using MonarchSim.Data.Json;
using UnityEngine;

namespace MonarchSim.Data
{
    public static class RemoteAIConfigProvider
    {
        [Serializable]
        private sealed class Wrapper
        {
            public RemoteAIConfig RemoteAI = new RemoteAIConfig();
        }

        public static RemoteAIConfig LoadOrDefault()
        {
            try
            {
                var path = Path.Combine(UnityEngine.Application.streamingAssetsPath, "Config", "remote_ai.json");
                if (File.Exists(path))
                {
                    var json = File.ReadAllText(path);
                    var wrapper = JsonUtility.FromJson<Wrapper>(json);
                    if (wrapper != null && wrapper.RemoteAI != null)
                    {
                        Debug.Log($"[RemoteAIConfigProvider] Loaded: {path}");
                        return wrapper.RemoteAI;
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[RemoteAIConfigProvider] Load failed: {ex.Message}");
            }

            Debug.Log("[RemoteAIConfigProvider] Use default remote AI config.");
            return new RemoteAIConfig();
        }
    }
}
