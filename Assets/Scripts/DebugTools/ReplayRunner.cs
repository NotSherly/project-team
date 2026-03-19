using System.Threading.Tasks;
using UnityEngine;
using MonarchSim.Application.Facades;
using MonarchSim.Domain.Enums;

namespace MonarchSim.DebugTools
{
    public sealed class ReplayRunner : MonoBehaviour
    {
        [SerializeField] private MonarchSim.Core.GameBootstrap bootstrap;

        private GameFacade Facade => bootstrap != null ? bootstrap.Facade : null;

        [ContextMenu("Replay/Demo Replay (Hubu Tax -> EndTurn x1)")]
        public void RunDemoReplay()
        {
            _ = RunDemoReplayAsync();
        }

        private async Task RunDemoReplayAsync()
        {
            if (Facade == null)
            {
                Debug.LogError("ReplayRunner: GameFacade 未初始化。请确认 GameBootstrap 已 Build。");
                return;
            }

            Debug.Log("[Replay] Start");

            Debug.Log(Facade.SummonDepartment(DepartmentId.Hubu));

            var resp = await Facade.SendMessageToDepartmentAsync(DepartmentId.Hubu, "今年税制是否应改？");
            Debug.Log($"[Replay] Reply: {resp.ReplyText}");

            if (resp.Proposals != null && resp.Proposals.Count > 0)
            {
                var out1 = Facade.AdoptProposal(resp.DepartmentId, resp.Proposals[0]);
                Debug.Log($"[Replay] Adopt Outcome: {out1.Title} - {out1.Summary}");
            }
            else
            {
                Debug.LogWarning("[Replay] No proposal returned.");
            }

            var (outcomes, summary) = await Facade.EndTurnAsync();
            Debug.Log($"[Replay] EndTurn outcomes={outcomes.Count}, summary={summary.Title}");

            // Golden check
            var ws = Facade.State.World;
            Debug.Log($"[Replay] Final: Gold={ws.Resources.Gold}, Grain={ws.Resources.Grain}, PublicSupport={ws.Resources.PublicSupport:F1}, TaxRate={ws.Policy.TaxRate:P0}, WorldVersion={ws.WorldVersion}");

            Debug.Log("[Replay] Done");
        }
    }
}