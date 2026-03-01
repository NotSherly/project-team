using System;

namespace MonarchSim.Domain.State
{
    /// <summary>
    /// 对话信息
    /// </summary>
    [Serializable]
    public sealed class DialogueMessage
    {
        public string Speaker; // 说话人
        public string Content; // 内容
        public string Timestamp; // 时间戳

        public DialogueMessage() { }

        public DialogueMessage(string speaker, string content)
        {
            Speaker = speaker;
            Content = content;
            Timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
        }
    }
}
