using UnityEngine;
using UnityEngine.UI;

namespace MonarchSim.UI.PrivateChat
{
    /// <summary>
    /// 私聊面板外层开关。
    /// 负责显示/隐藏整个私聊界面，不直接处理会话逻辑。
    /// </summary>
    public sealed class PrivateChatPanel : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private GameObject privateChatButton;
        [SerializeField] private GameObject privateChatWindowRoot;
        [SerializeField] private PrivateChatWindow chatWindow;

        private void Start()
        {
            if (privateChatWindowRoot != null)
            {
                privateChatWindowRoot.SetActive(false);
            }

            if (privateChatButton != null)
            {
                var button = privateChatButton.GetComponent<Button>();
                if (button != null)
                {
                    button.onClick.AddListener(OpenPrivateChatPanel);
                }
            }
        }

        public void OpenPrivateChatPanel()
        {
            if (privateChatWindowRoot != null)
            {
                privateChatWindowRoot.SetActive(true);
            }
        }

        public void ClosePrivateChatPanel()
        {
            if (privateChatWindowRoot != null)
            {
                privateChatWindowRoot.SetActive(false);
            }

            if (chatWindow != null)
            {
                chatWindow.CloseChat();
            }
        }
    }
}
