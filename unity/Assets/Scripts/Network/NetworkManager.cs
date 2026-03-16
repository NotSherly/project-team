using UnityEngine;
using System.Collections;

namespace TXAI.Game.Network
{
    public class NetworkManager : MonoBehaviour
    {
        private static NetworkManager instance;
        public static NetworkManager Instance
        {
            get {
                if (instance == null) {
                    instance = FindObjectOfType<NetworkManager>();
                    if (instance == null) {
                        GameObject obj = new GameObject("NetworkManager");
                        instance = obj.AddComponent<NetworkManager>();
                        DontDestroyOnLoad(obj);
                    }
                }
                return instance;
            }
        }
        
        private ApiClient apiClient;
        
        private void Awake() {
            if (instance == null) {
                instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeApiClient();
            } else {
                Destroy(gameObject);
            }
        }
        
        private void InitializeApiClient() {
            TextAsset configFile = Resources.Load<TextAsset>("Configs/ApiConfig");
            if (configFile != null) {
                try {
                    var config = JsonUtility.FromJson<ApiConfig>(configFile.text);
                    apiClient = new ApiClient(config.baseUrl, config.timeout);
                    Debug.Log("API Client initialized successfully");
                } catch (System.Exception e) {
                    Debug.LogError("Failed to parse API config: " + e.Message);
                    // Use default values
                    apiClient = new ApiClient("http://localhost:3000/api");
                }
            } else {
                Debug.LogError("ApiConfig.json not found");
                apiClient = new ApiClient("http://localhost:3000/api");
            }
        }
        
        public IEnumerator SendPrivateMessage(string agentId, string message, System.Action<string> onSuccess, System.Action<string> onError) {
            if (apiClient != null) {
                yield return apiClient.SendPrivateMessage(agentId, message, onSuccess, onError);
            } else {
                onError?.Invoke("API Client not initialized");
            }
        }
        
        public IEnumerator GetChatHistory(string agentId, System.Action<string> onSuccess, System.Action<string> onError) {
            if (apiClient != null) {
                yield return apiClient.GetChatHistory(agentId, onSuccess, onError);
            } else {
                onError?.Invoke("API Client not initialized");
            }
        }
        
        public IEnumerator GetAgents(System.Action<string> onSuccess, System.Action<string> onError) {
            if (apiClient != null) {
                yield return apiClient.GetAgents(onSuccess, onError);
            } else {
                onError?.Invoke("API Client not initialized");
            }
        }
    }
    
    [System.Serializable]
    public class ApiConfig
    {
        public string baseUrl;
        public Endpoints endpoints;
        public int timeout;
    }
    
    [System.Serializable]
    public class Endpoints
    {
        public string sendMessage;
        public string getHistory;
        public string getAgents;
    }
}
