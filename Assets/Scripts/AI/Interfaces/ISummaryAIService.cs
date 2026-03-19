using System.Threading.Tasks;
using MonarchSim.AI.Models;

namespace MonarchSim.AI.Interfaces
{
    /// <summary>
    /// 总结AI接口
    /// </summary>
    public interface ISummaryAIService
    {
        Task<TurnSummaryResponse> GenerateTurnSummaryAsync(TurnSummaryRequest request); // 进行总结需要实现此方法
    }
}
