using UnityEngine;
using UnityEngine.UI;
using TXAI.Game.Data;

namespace TXAI.Game.UI.PrivateChat
{
    public class ChatMessageItem : MonoBehaviour
    {
        public Text messageText;
        public Text senderText;
        public Image avatarImage;
        public GameObject playerMessageContainer;
        public GameObject agentMessageContainer;
        
        public void SetMessage(ChatMessage message, AgentData agent) {
            messageText.text = message.content;
            
            if (message.isFromPlayer) {
                playerMessageContainer.SetActive(true);
                agentMessageContainer.SetActive(false);
                senderText.text = "我";
            } else {
                playerMessageContainer.SetActive(false);
                agentMessageContainer.SetActive(true);
                senderText.text = agent.name;
                
                // 加载Agent头像
                Sprite avatar = Resources.Load<Sprite>(agent.avatarPath);
                if (avatar != null) {
                    avatarImage.sprite = avatar;
                }
            }
        }
    }
}
