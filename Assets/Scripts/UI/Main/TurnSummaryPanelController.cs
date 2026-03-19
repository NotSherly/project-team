using System.Collections.Generic;
using System.Linq;
using MonarchSim.AI.Models;
using MonarchSim.Domain.Outcomes;
using UnityEngine;
using UnityEngine.UI;

namespace MonarchSim.UI.Main
{
    /// <summary>
    /// 回合总结面板控制器。
    /// 用于展示 EndTurn 后返回的 summary 与 outcomes。
    /// </summary>
    public sealed class TurnSummaryPanelController : MonoBehaviour
    {
        [Header("Root")]
        [SerializeField] private GameObject panelRoot;

        [Header("Texts")]
        [SerializeField] private Text titleText;
        [SerializeField] private Text summaryText;
        [SerializeField] private Text risksText;
        [SerializeField] private Text nextFocusText;
        [SerializeField] private Text outcomesText;

        [Header("Actions")]
        [SerializeField] private Button closeButton;

        private void Start()
        {
            if (closeButton != null)
            {
                closeButton.onClick.AddListener(Hide);
            }

            Hide();
        }

        public void Show(List<Outcome> outcomes, TurnSummaryResponse summary)
        {
            if (panelRoot != null) panelRoot.SetActive(true);

            if (summary != null)
            {
                SetIfNotNull(titleText, string.IsNullOrWhiteSpace(summary.Title) ? "本回合纪要" : summary.Title);
                SetIfNotNull(summaryText, string.IsNullOrWhiteSpace(summary.SummaryText) ? "暂无总结。" : summary.SummaryText);
                SetIfNotNull(risksText, BuildBulletBlock("风险提示", summary.Risks));
                SetIfNotNull(nextFocusText, BuildBulletBlock("下回合建议", summary.NextFocusSuggestions));
            }
            else
            {
                SetIfNotNull(titleText, "本回合纪要");
                SetIfNotNull(summaryText, "暂无总结。\n（当前回合总结仍可能由 Mock 或远端配置决定）");
                SetIfNotNull(risksText, string.Empty);
                SetIfNotNull(nextFocusText, string.Empty);
            }

            SetIfNotNull(outcomesText, BuildOutcomeBlock(outcomes));
        }

        public void Hide()
        {
            if (panelRoot != null) panelRoot.SetActive(false);
        }

        private static string BuildBulletBlock(string title, List<string> lines)
        {
            if (lines == null || lines.Count == 0)
            {
                return $"{title}：无";
            }

            return $"{title}：\n- " + string.Join("\n- ", lines.Where(x => !string.IsNullOrWhiteSpace(x)));
        }

        private static string BuildOutcomeBlock(List<Outcome> outcomes)
        {
            if (outcomes == null || outcomes.Count == 0)
            {
                return "本回合无额外结算结果。";
            }

            var lines = new List<string>();
            for (int i = 0; i < outcomes.Count; i++)
            {
                var o = outcomes[i];
                if (o == null) continue;
                lines.Add($"{i + 1}. {o.Title}：{o.Summary}");
            }

            return lines.Count == 0 ? "本回合无额外结算结果。" : string.Join("\n", lines);
        }

        private static void SetIfNotNull(Text target, string value)
        {
            if (target != null) target.text = value;
        }
    }
}
