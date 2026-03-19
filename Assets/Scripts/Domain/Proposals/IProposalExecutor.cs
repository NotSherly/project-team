using MonarchSim.AI.Models;
using MonarchSim.Domain.Enums;
using MonarchSim.Domain.Outcomes;

namespace MonarchSim.Domain.Proposals
{
    /// <summary>
    /// 提案执行器接口
    /// </summary>
    public interface IProposalExecutor
    {
        ProposalType Type { get; } // 提案类型
        Outcome Execute(DepartmentId sourceDepartment, DepartmentProposal proposal); // 执行方法，返回Outcome
    }
}