using MonarchSim.Data.Json;
using UnityEngine;
using UnityEngine.UI;

namespace MonarchSim.UI.PrivateChat
{
    /// <summary>
    /// 六部列表按钮项。
    /// 仅负责展示某个部门，并在点击时通知 PrivateChatWindow 打开对应会话。
    /// </summary>
    public sealed class AgentButton : MonoBehaviour
    {
        [SerializeField] private Text agentNameText;
        [SerializeField] private Text dutySummaryText;
        [SerializeField] private Image avatarImage;
        [SerializeField] private Button button;
        [SerializeField] private Sprite fallbackAvatar;

        private DepartmentRoleConfig _roleConfig;
        private PrivateChatWindow _chatWindow;

        public void Initialize(DepartmentRoleConfig roleConfig, PrivateChatWindow window)
        {
            _roleConfig = roleConfig;
            _chatWindow = window;

            if (agentNameText != null)
            {
                agentNameText.text = roleConfig.DisplayName;
            }

            if (dutySummaryText != null)
            {
                dutySummaryText.text = roleConfig.DutySummary;
            }

            if (avatarImage != null)
            {
                var path = DepartmentAvatarUtility.GetLegacyAvatarPath(roleConfig.DepartmentId);
                var avatar = string.IsNullOrEmpty(path) ? null : Resources.Load<Sprite>(path);
                avatarImage.sprite = avatar != null ? avatar : fallbackAvatar;
            }

            if (button != null)
            {
                button.onClick.RemoveAllListeners();
                button.onClick.AddListener(OnButtonClick);
            }
        }

        private void OnButtonClick()
        {
            _chatWindow?.OpenChat(_roleConfig.DepartmentId, _roleConfig);
        }
    }
}
