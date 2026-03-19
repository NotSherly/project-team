using MonarchSim.AI.Models;
using MonarchSim.Domain.Enums;

namespace MonarchSim.AI.Services
{
    /// <summary>
    /// 对话摘要服务
    /// </summary>
    public sealed class DialogueSummaryService
    {
        /// <summary>
        /// 构建私有记忆
        /// </summary>
        /// <param name="departmentId"></param>
        /// <param name="playerMessage"></param>
        /// <param name="response"></param>
        /// <returns></returns>
        public string BuildPrivateMemory(DepartmentId departmentId, string playerMessage, DepartmentDialogueResponse response)
        {
            return $"[{departmentId}] 陛下问：{playerMessage}；本部答：{response.ReplyText}";
        }

        /// <summary>
        /// 构建公开纪要
        /// </summary>
        /// <param name="worldVersion"></param>
        /// <param name="departmentId"></param>
        /// <param name="topic"></param>
        /// <param name="summary"></param>
        /// <returns></returns>
        public PublicMemoItem BuildPublicMemo(int worldVersion, DepartmentId departmentId, string topic, string summary)
        {
            return new PublicMemoItem
            {
                WorldVersion = worldVersion,
                Title = $"召见{departmentId}纪要",
                Summary = $"议题：{topic}。{summary}",
                Category = "Audience",
                CreatedAt = System.DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            };
        }
    }
}
