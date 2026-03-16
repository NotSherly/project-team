using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using TXAI.Game.Data;
using TXAI.Game.Network;

namespace TXAI.Game.Game
{
    public class ChatManager : MonoBehaviour
    {
        private static ChatManager instance;
        public static ChatManager Instance
        {
            get {
                if (instance == null) {
                    instance = FindObjectOfType<ChatManager>();
                    if (instance == null) {
                        GameObject obj = new GameObject("ChatManager");
                        instance = obj.AddComponent<ChatManager>();
                        DontDestroyOnLoad(obj);
                    }
                }
                return instance;
            }
        }
        
        private Dictionary<string, ConversationData> conversations = new Dictionary<string, ConversationData>();
        private List<AgentData> agents = new List<AgentData>();
        
        private void Awake() {
            if (instance == null) {
                instance = this;
                DontDestroyOnLoad(gameObject);
                LoadAgents();
            } else {
                Destroy(gameObject);
            }
        }
        
        private void LoadAgents() {
            // 这里可以从后端加载Agent列表
            // 暂时使用硬编码的Agent数据
            agents.Add(new AgentData("libu", "吏部尚书", "AgentAvatars/libu", "吏部"));
            agents.Add(new AgentData("hubu", "户部尚书", "AgentAvatars/hubu", "户部"));
            agents.Add(new AgentData("libubu", "礼部尚书", "AgentAvatars/libubu", "礼部"));
            agents.Add(new AgentData("bingbu", "兵部尚书", "AgentAvatars/bingbu", "兵部"));
            agents.Add(new AgentData("xingbu", "刑部尚书", "AgentAvatars/xingbu", "刑部"));
            agents.Add(new AgentData("gongbu", "工部尚书", "AgentAvatars/gongbu", "工部"));
        }
        
        public List<AgentData> GetAgents() {
            return agents;
        }
        
        public ConversationData GetConversation(string agentId) {
            if (!conversations.ContainsKey(agentId)) {
                conversations[agentId] = new ConversationData(System.Guid.NewGuid().ToString(), agentId);
            }
            return conversations[agentId];
        }
        
        public IEnumerator SendMessage(string agentId, string content, System.Action<string> onSuccess, System.Action<string> onError) {
            // 添加本地消息
            string messageId = System.Guid.NewGuid().ToString();
            long timestamp = System.DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            ChatMessage playerMessage = new ChatMessage(messageId, "player", content, timestamp, true);
            GetConversation(agentId).AddMessage(playerMessage);
            
            // 发送到后端
            yield return NetworkManager.Instance.SendPrivateMessage(agentId, content, 
                (response) => {
                    // 解析响应，添加AI回复
                    try {
                        var responseData = JsonUtility.FromJson<MessageResponse>(response);
                        string aiMessageId = System.Guid.NewGuid().ToString();
                        long aiTimestamp = System.DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                        ChatMessage aiMessage = new ChatMessage(aiMessageId, agentId, responseData.message, aiTimestamp, false);
                        GetConversation(agentId).AddMessage(aiMessage);
                        onSuccess?.Invoke(responseData.message);
                    } catch (System.Exception e) {
                        onError?.Invoke("Failed to parse response: " + e.Message);
                    }
                },
                (error) => {
                    onError?.Invoke(error);
                }
            );
        }
        
        public IEnumerator LoadChatHistory(string agentId, System.Action<bool> onComplete) {
            yield return NetworkManager.Instance.GetChatHistory(agentId, 
                (response) => {
                    try {
                        var historyData = JsonUtility.FromJson<HistoryResponse>(response);
                        var conversation = GetConversation(agentId);
                        conversation.ClearMessages();
                        
                        foreach (var msg in historyData.messages) {
                            bool isFromPlayer = msg.senderId == "player";
                            ChatMessage message = new ChatMessage(
                                msg.id,
                                msg.senderId,
                                msg.content,
                                msg.timestamp,
                                isFromPlayer
                            );
                            conversation.AddMessage(message);
                        }
                        onComplete?.Invoke(true);
                    } catch (System.Exception e) {
                        Debug.LogError("Failed to load chat history: " + e.Message);
                        onComplete?.Invoke(false);
                    }
                },
                (error) => {
                    Debug.LogError("Failed to load chat history: " + error);
                    onComplete?.Invoke(false);
                }
            );
        }
    }
    
    [System.Serializable]
    public class MessageResponse
    {
        public string message;
    }
    
    [System.Serializable]
    public class HistoryResponse
    {
        public List<HistoryMessage> messages;
    }
    
    [System.Serializable]
    public class HistoryMessage
    {
        public string id;
        public string senderId;
        public string content;
        public long timestamp;
    }
}
