using System.Collections.Generic;
using MonarchSim.AI.Models;
using MonarchSim.Data;
using MonarchSim.Domain.Enums;
using MonarchSim.Domain.Outcomes;

namespace MonarchSim.Domain.Proposals
{
    /// <summary>
    /// 执行器注册表、统一执行入口
    /// </summary>
    public sealed class ProposalExecutorRegistry
    {
        private readonly Dictionary<ProposalType, IProposalExecutor> _executors = new Dictionary<ProposalType, IProposalExecutor>();
        private readonly ProposalCatalog _catalog;

        public ProposalExecutorRegistry(ProposalCatalog catalog)
        {
            _catalog = catalog;
        }

        /// <summary>
        /// 注册执行器
        /// </summary>
        /// <param name="executor"></param>
        public void Register(IProposalExecutor executor)
        {
            _executors[executor.Type] = executor;
        }

        /// <summary>
        /// 检查json是否启用、有无执行器，没有返回一个提示，有就执行
        /// </summary>
        /// <param name="sourceDepartment"></param>
        /// <param name="proposal"></param>
        /// <returns></returns>
        public Outcome ExecuteOrFallback(DepartmentId sourceDepartment, DepartmentProposal proposal)
        {
            if (!_catalog.IsEnabled(proposal.ProposalType))
            {
                return new Outcome
                {
                    WorldVersion = 0,
                    Source = "ProposalExecutorRegistry",
                    Title = "提案已禁用",
                    Summary = $"该提案类型在 proposals.json 中被禁用：{proposal.ProposalType}"
                };
            }

            if (!_executors.TryGetValue(proposal.ProposalType, out var exec))
            {
                return new Outcome
                {
                    WorldVersion = 0,
                    Source = "ProposalExecutorRegistry",
                    Title = "未实现的提案类型",
                    Summary = $"未找到执行器：{proposal.ProposalType}"
                };
            }

            return exec.Execute(sourceDepartment, proposal);
        }
    }
}