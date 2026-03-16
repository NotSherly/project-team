using System;
using System.Collections.Generic;

namespace TXAI.Game.Data
{
    [Serializable]
    public class ConversationData
    {
        public string conversationId;
        public string agentId;
        public List<ChatMessage> messages;
        
        public ConversationData(string conversationId, string agentId)
        {
            this.conversationId = conversationId;
            this.agentId = agentId;
            this.messages = new List<ChatMessage>();
        }
        
        public void AddMessage(ChatMessage message)
        {
            messages.Add(message);
        }
        
        public void ClearMessages()
        {
            messages.Clear();
        }
    }
}
