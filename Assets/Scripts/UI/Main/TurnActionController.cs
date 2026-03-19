using System;
using MonarchSim.Application.Facades;
using MonarchSim.Core;
using UnityEngine;
using UnityEngine.UI;

namespace MonarchSim.UI.Main
{
    /// <summary>
    /// 结束回合按钮控制器。
    /// 负责把按钮点击接到 GameFacade.EndTurnAsync，并把结果交给总结面板展示。
    /// </summary>
    public sealed class TurnActionController : MonoBehaviour
    {
        [Header("Dependencies")]
        [SerializeField] private GameBootstrap bootstrap;
        [SerializeField] private TurnSummaryPanelController turnSummaryPanel;

        [Header("UI")]
        [SerializeField] private Button endTurnButton;
        [SerializeField] private Text statusText;

        private GameFacade Facade => bootstrap != null ? bootstrap.Facade : null;

        private void Start()
        {
            if (bootstrap != null && bootstrap.Facade == null)
            {
                bootstrap.Build();
            }

            if (endTurnButton != null)
            {
                endTurnButton.onClick.AddListener(OnClickEndTurn);
            }

            SetStatus("待命");
        }

        private async void OnClickEndTurn()
        {
            if (Facade == null)
            {
                SetStatus("GameFacade 未初始化");
                return;
            }

            if (endTurnButton != null) endTurnButton.interactable = false;
            SetStatus("正在结算本回合...");

            try
            {
                var (outcomes, summary) = await Facade.EndTurnAsync();
                turnSummaryPanel?.Show(outcomes, summary);
                SetStatus($"结算完成：本次产生 {outcomes.Count} 条结果");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[TurnActionController] EndTurn failed: {ex.Message}");
                SetStatus("结算失败，请查看 Console");
            }
            finally
            {
                if (endTurnButton != null) endTurnButton.interactable = true;
            }
        }

        private void SetStatus(string text)
        {
            if (statusText != null)
            {
                statusText.text = text;
            }
        }
    }
}
