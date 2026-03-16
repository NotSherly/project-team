using UnityEngine;
using UnityEngine.UI;


namespace TXAI.Game.UI.Common
{
    /// <summary>
    /// 自动滚动到底部的辅助组件
    /// 用于聊天消息列表自动滚动到最新消息
    /// </summary>
    [RequireComponent(typeof(ScrollRect))]
    public class AutoScrollToBottom : MonoBehaviour
    {
        private ScrollRect scrollRect;
        private RectTransform content;
        private bool shouldScroll = false;

        private void Awake()
        {
            scrollRect = GetComponent<ScrollRect>();
            if (scrollRect != null && scrollRect.content != null)
            {
                content = scrollRect.content;
            }
        }

        private void LateUpdate()
        {
            if (shouldScroll && scrollRect != null)
            {
                // 滚动到底部
                Canvas.ForceUpdateCanvases();
                scrollRect.verticalNormalizedPosition = 0f;
                shouldScroll = false;
            }
        }

        /// <summary>
        /// 请求滚动到底部
        /// </summary>
        public void ScrollToBottom()
        {
            shouldScroll = true;
        }

        /// <summary>
        /// 立即滚动到底部
        /// </summary>
        public void ScrollToBottomImmediate()
        {
            if (scrollRect != null)
            {
                Canvas.ForceUpdateCanvases();
                scrollRect.verticalNormalizedPosition = 0f;
            }
        }
    }
}
