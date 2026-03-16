using UnityEngine;
using UnityEngine.UI;
using TXAI.Game.Data;
using TXAI.Game.Game;
using TXAI.Game.UI.PrivateChat;

namespace TXAI.Game.UI
{
    public class AgentButton : MonoBehaviour
    {
        public Text agentNameText;
        public Image avatarImage;
        public Button button;
        
        private AgentData agentData;
        private PrivateChatWindow chatWindow;
        
        public void Initialize(AgentData agent, PrivateChatWindow window) {
            agentData = agent;
            chatWindow = window;
            
            agentNameText.text = agent.name;
            
            // 加载Agent头像
            Sprite avatar = Resources.Load<Sprite>(agent.avatarPath);
            if (avatar != null) {
                avatarImage.sprite = avatar;
            }
            
            button.onClick.AddListener(OnButtonClick);
        }
        
        private void OnButtonClick() {
            chatWindow.OpenChat(agentData.id);
        }
    }
}
