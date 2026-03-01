using System.Linq;
using UnityEngine;
using MonarchSim.Application.Facades;
using MonarchSim.Domain.Enums;
using MonarchSim.AI.Models;

namespace MonarchSim.DebugTools
{
    /// <summary>
    /// 等UI
    /// 无UI测试驱动器
    /// </summary>
    public sealed class LogicSandboxDriver : MonoBehaviour
    {
        [SerializeField] private MonarchSim.Core.GameBootstrap bootstrap;

        private DepartmentDialogueResponse _lastResponse;

        private GameFacade Facade
        {
            get
            {
                if (bootstrap == null)
                {
                    bootstrap = GetComponent<MonarchSim.Core.GameBootstrap>();
                }

                return bootstrap != null ? bootstrap.Facade : null;
            }
        }

        [ContextMenu("01 召见操作测试：召见户部")]
        public void SummonHubu()
        {
            EnsureFacade();
            var text = Facade.SummonDepartment(DepartmentId.Hubu);
            Debug.Log(text);
        }

        [ContextMenu("02 询问操作测试：询问户部税制是否应改")]
        public void AskHubuTax()
        {
            EnsureFacade();
            _lastResponse = Facade.SendMessageToDepartmentAsync(DepartmentId.Hubu, "今年税制是否应改？").GetAwaiter().GetResult();
            Debug.Log(_lastResponse.ReplyText);

            foreach (var risk in _lastResponse.Risks)
            {
                Debug.Log($"[Risk] {risk}");
            }

            foreach (var proposal in _lastResponse.Proposals)
            {
                Debug.Log($"[Proposal] {proposal.Title} | {proposal.Description}");
            }
        }

        [ContextMenu("03 执行提案测试")]
        public void AdoptFirstProposal()
        {
            EnsureFacade();
            if (_lastResponse == null || _lastResponse.Proposals == null || _lastResponse.Proposals.Count == 0)
            {
                Debug.LogWarning("当前没有可采纳的提案。请先执行 AskHubuTax。");
                return;
            }

            var outcome = Facade.AdoptProposal(_lastResponse.DepartmentId, _lastResponse.Proposals.First());
            Debug.Log($"[Outcome] {outcome.Title} - {outcome.Summary}");
            foreach (var fact in outcome.Facts)
            {
                Debug.Log($"  {fact.Key}: {fact.Before} -> {fact.After}");
            }
        }

        [ContextMenu("04 回合结束测试")]
        public void EndTurn()
        {
            EnsureFacade();
            var result = Facade.EndTurnAsync().GetAwaiter().GetResult();

            Debug.Log("=== 回合结算 ===");
            foreach (var outcome in result.outcomes)
            {
                Debug.Log($"[Outcome] {outcome.Title} - {outcome.Summary}");
            }

            Debug.Log("=== 回合总结 ===");
            Debug.Log(result.summary.Title);
            Debug.Log(result.summary.SummaryText);

            foreach (var risk in result.summary.Risks)
            {
                Debug.Log($"[Summary Risk] {risk}");
            }

            foreach (var focus in result.summary.NextFocusSuggestions)
            {
                Debug.Log($"[Next Focus] {focus}");
            }
        }

        private void EnsureFacade()
        {
            if (Facade == null)
            {
                Debug.LogError("GameFacade 未初始化。请确认 GameBootstrap 已挂载并完成 Build。");
            }
        }
    }
}
