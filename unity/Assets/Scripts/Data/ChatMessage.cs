using System;

namespace TXAI.Game.Data
{
    [Serializable]
    public class ChatMessage
    {
        public string id;
        public string senderId;
        public string content;
        public long timestamp;
        public bool isFromPlayer;
        
        public ChatMessage(string id, string senderId, string content, long timestamp, bool isFromPlayer)
        {
            this.id = id;
            this.senderId = senderId;
            this.content = content;
            this.timestamp = timestamp;
            this.isFromPlayer = isFromPlayer;
        }
    }
}
