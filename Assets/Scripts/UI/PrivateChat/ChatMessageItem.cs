using MonarchSim.Data.Json;
using MonarchSim.Domain.State;
using UnityEngine;
using UnityEngine.UI;

namespace MonarchSim.UI.PrivateChat
{
    /// <summary>
    /// 单条聊天消息 UI 项。
    /// 这版直接吃 OriginalScripts 的 DialogueMessage，而不再维护 Additional 的 ChatMessage。
    /// </summary>
    public sealed class ChatMessageItem : MonoBehaviour
    {
        [SerializeField] private Text messageText;
        [SerializeField] private Text senderText;
        [SerializeField] private Text timestampText;
        [SerializeField] private Image avatarImage;
        [SerializeField] private GameObject playerMessageContainer;
        [SerializeField] private GameObject agentMessageContainer;
        [SerializeField] private Sprite fallbackAvatar;

        public void SetMessage(DialogueMessage message, DepartmentRoleConfig roleConfig)
        {
            if (messageText != null)
            {
                messageText.text = message.Content;
            }

            if (timestampText != null)
            {
                timestampText.text = message.Timestamp;
            }

            var isPlayer = IsPlayerSpeaker(message.Speaker);
            if (playerMessageContainer != null) playerMessageContainer.SetActive(isPlayer);
            if (agentMessageContainer != null) agentMessageContainer.SetActive(!isPlayer);

            if (senderText != null)
            {
                senderText.text = isPlayer ? message.Speaker : roleConfig.DisplayName;
            }

            if (!isPlayer && avatarImage != null)
            {
                var path = DepartmentAvatarUtility.GetLegacyAvatarPath(roleConfig.DepartmentId);
                var avatar = string.IsNullOrEmpty(path) ? null : Resources.Load<Sprite>(path);
                avatarImage.sprite = avatar != null ? avatar : fallbackAvatar;
            }
        }

        private static bool IsPlayerSpeaker(string speaker)
        {
            return speaker == "皇帝" || speaker == "玩家" || speaker == "我";
        }
    }
}
