using UnityEngine;
using UnityEngine.UI;

namespace TXAI.Game.UI.PrivateChat
{
    /// <summary>
    /// 私聊面板管理器 - 控制整个私聊界面的显示和隐藏
    /// </summary>
    public class PrivateChatPanel : MonoBehaviour
    {
        [Header("UI References")]
        public GameObject privateChatButton;
        public GameObject privateChatWindow;
        public AgentListManager agentListManager;
        public PrivateChatWindow chatWindow;

        private void Start()
        {
            // 初始化时隐藏私聊窗口
            if (privateChatWindow != null)
            {
                privateChatWindow.SetActive(false);
            }

            // 绑定私聊按钮点击事件
            if (privateChatButton != null)
            {
                Button button = privateChatButton.GetComponent<Button>();
                if (button != null)
                {
                    button.onClick.AddListener(OpenPrivateChatPanel);
                }
            }
        }

        /// <summary>
        /// 打开私聊面板
        /// </summary>
        public void OpenPrivateChatPanel()
        {
            if (privateChatWindow != null)
            {
                privateChatWindow.SetActive(true);
            }
        }

        /// <summary>
        /// 关闭私聊面板
        /// </summary>
        public void ClosePrivateChatPanel()
        {
            if (privateChatWindow != null)
            {
                privateChatWindow.SetActive(false);
            }

            // 同时关闭聊天窗口
            if (chatWindow != null)
            {
                chatWindow.CloseChat();
            }
        }
    }
}
