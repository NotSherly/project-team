using UnityEngine;
using UnityEngine.UI;

namespace MonarchSim.UI.Common
{
    /// <summary>
    /// 自动滚动到底部的辅助组件。
    /// 用于聊天消息列表自动滚动到最新消息。
    /// </summary>
    [RequireComponent(typeof(ScrollRect))]
    public sealed class AutoScrollToBottom : MonoBehaviour
    {
        private ScrollRect _scrollRect;
        private bool _shouldScroll;

        private void Awake()
        {
            _scrollRect = GetComponent<ScrollRect>();
        }

        private void LateUpdate()
        {
            if (_shouldScroll && _scrollRect != null)
            {
                Canvas.ForceUpdateCanvases();
                _scrollRect.verticalNormalizedPosition = 0f;
                _shouldScroll = false;
            }
        }

        public void ScrollToBottom()
        {
            _shouldScroll = true;
        }

        public void ScrollToBottomImmediate()
        {
            if (_scrollRect == null) return;
            Canvas.ForceUpdateCanvases();
            _scrollRect.verticalNormalizedPosition = 0f;
        }
    }
}
