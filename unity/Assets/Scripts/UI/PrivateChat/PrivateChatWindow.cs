using UnityEngine;
using UnityEngine.UI;
using System.Collections;
using System.Collections.Generic;
using TXAI.Game.Data;
using TXAI.Game.Game;

namespace TXAI.Game.UI.PrivateChat
{
    public class PrivateChatWindow : MonoBehaviour
    {
        public GameObject chatWindow;
        public Text agentNameText;
        public Transform messageList;
        public InputField messageInput;
        public Button sendButton;
        public GameObject messageItemPrefab;
        
        private string currentAgentId;
        private AgentData currentAgent;
        
        private void Start() {
            sendButton.onClick.AddListener(SendMessage);
            messageInput.onSubmit.AddListener((value) => SendMessage());
            chatWindow.SetActive(false);
        }
        
        public void OpenChat(string agentId) {
            currentAgentId = agentId;
            currentAgent = ChatManager.Instance.GetAgents().Find(a => a.id == agentId);
            
            if (currentAgent != null) {
                agentNameText.text = currentAgent.name;
                chatWindow.SetActive(true);
                LoadChatHistory();
            }
        }
        
        public void CloseChat() {
            chatWindow.SetActive(false);
        }
        
        private void LoadChatHistory() {
            ClearMessageList();
            StartCoroutine(ChatManager.Instance.LoadChatHistory(currentAgentId, (success) => {
                if (success) {
                    DisplayMessages();
                } else {
                    Debug.LogError("Failed to load chat history");
                }
            }));
        }
        
        private void DisplayMessages() {
            var conversation = ChatManager.Instance.GetConversation(currentAgentId);
            foreach (var message in conversation.messages) {
                AddMessageItem(message);
            }
        }
        
        private void SendMessage() {
            string message = messageInput.text.Trim();
            if (!string.IsNullOrEmpty(message)) {
                messageInput.text = "";
                StartCoroutine(ChatManager.Instance.SendMessage(currentAgentId, message, 
                    (response) => {
                        // 消息已在ChatManager中添加
                        DisplayMessages();
                    },
                    (error) => {
                        Debug.LogError("Failed to send message: " + error);
                    }
                ));
            }
        }
        
        private void AddMessageItem(ChatMessage message) {
            GameObject item = Instantiate(messageItemPrefab, messageList);
            ChatMessageItem messageItem = item.GetComponent<ChatMessageItem>();
            if (messageItem != null) {
                messageItem.SetMessage(message, currentAgent);
            }
        }
        
        private void ClearMessageList() {
            foreach (Transform child in messageList) {
                Destroy(child.gameObject);
            }
        }
    }
}
