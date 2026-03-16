using UnityEngine;
using TXAI.Game.Network; 

namespace TXAI.Game.Game
{
    public class GameManager : MonoBehaviour
    {
        private static GameManager instance;
        public static GameManager Instance
        {
            get {
                if (instance == null) {
                    instance = FindObjectOfType<GameManager>();
                    if (instance == null) {
                        GameObject obj = new GameObject("GameManager");
                        instance = obj.AddComponent<GameManager>();
                        DontDestroyOnLoad(obj);
                    }
                }
                return instance;
            }
        }
        
        private void Awake() {
            if (instance == null) {
                instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeSystems();
            } else {
                Destroy(gameObject);
            }
        }
        
        // private void InitializeSystems() {
        //     // 确保NetworkManager存在
        //     var networkManager = NetworkManager.NetworkManager.Instance;
            
        //     // 确保ChatManager存在
        //     var chatManager = ChatManager.Instance;
            
        //     Debug.Log("Game systems initialized");
        // }

        private void InitializeSystems() {
    // 正确访问单例实例
    var networkManager = NetworkManager.Instance;

    var chatManager = ChatManager.Instance;
    Debug.Log("Game systems initialized");
}
        
        public void OpenPrivateChat(string agentId) {
            // 这里可以打开私聊窗口
            Debug.Log("Opening private chat with agent: " + agentId);
        }
        
        private void Update() {
            // 游戏主循环逻辑
        }
    }
}
