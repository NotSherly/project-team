using System.Threading.Tasks;
using MonarchSim.AI.Models;

namespace MonarchSim.AI.Interfaces
{
    /// <summary>
    /// 部门AI接口
    /// </summary>
    public interface IDepartmentAIService
    {
        Task<DepartmentDialogueResponse> GenerateDepartmentReplyAsync(DepartmentDialogueRequest request); // 部门回复需要实现此方法
    }
}
