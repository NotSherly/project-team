using System;
using MonarchSim.AI.Models;
using UnityEngine;
using UnityEngine.UI;

namespace MonarchSim.UI.PrivateChat
{
    /// <summary>
    /// 单个提案卡片视图。
    /// 只负责展示与按钮点击，不直接修改游戏状态。
    /// </summary>
    public sealed class ProposalItemView : MonoBehaviour
    {
        [SerializeField] private Text titleText;
        [SerializeField] private Text descriptionText;
        [SerializeField] private Text suggestedValueText;
        [SerializeField] private Button adoptButton;

        private DepartmentProposal _proposal;
        private Action<DepartmentProposal> _onAdopt;

        public void Bind(DepartmentProposal proposal, Action<DepartmentProposal> onAdopt)
        {
            _proposal = proposal;
            _onAdopt = onAdopt;

            if (titleText != null)
            {
                titleText.text = proposal.Title;
            }

            if (descriptionText != null)
            {
                descriptionText.text = proposal.Description;
            }

            if (suggestedValueText != null)
            {
                suggestedValueText.text = BuildSuggestedValueText(proposal);
            }

            if (adoptButton != null)
            {
                adoptButton.onClick.RemoveAllListeners();
                adoptButton.onClick.AddListener(OnAdoptClicked);
            }
        }

        private void OnAdoptClicked()
        {
            _onAdopt?.Invoke(_proposal);
        }

        private static string BuildSuggestedValueText(DepartmentProposal proposal)
        {
            if (proposal.SuggestedFloatValue != 0f)
            {
                return $"建议值：{proposal.SuggestedFloatValue:F2}";
            }

            if (proposal.SuggestedIntValue != 0)
            {
                return $"建议值：{proposal.SuggestedIntValue}";
            }

            return string.Empty;
        }
    }
}
