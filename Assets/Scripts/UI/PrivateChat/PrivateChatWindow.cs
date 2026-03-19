using System.Collections.Generic;
using System.Linq;
using MonarchSim.AI.Models;
using MonarchSim.Application.Facades;
using MonarchSim.Core;
using MonarchSim.Data.Json;
using MonarchSim.Domain.Enums;
using MonarchSim.Domain.Outcomes;
using MonarchSim.Domain.State;
using MonarchSim.UI.Common;
using UnityEngine;
using UnityEngine.UI;

namespace MonarchSim.UI.PrivateChat
{
    /// <summary>
    /// 私聊窗口（升级版）。
    /// 在上一版“接入主逻辑链”的基础上，继续补齐：
    /// 1) 提案列表展示
    /// 2) 点击采纳提案
    /// 3) 展示最近一次提案执行 Outcome
    /// </summary>
    public sealed class PrivateChatWindow : MonoBehaviour
    {
        [Header("Dependencies")]
        [SerializeField] private GameBootstrap bootstrap;

        [Header("UI References")]
        [SerializeField] private GameObject chatWindowRoot;
        [SerializeField] private Text agentNameText;
        [SerializeField] private Text agentDutyText;
        [SerializeField] private Transform messageList;
        [SerializeField] private InputField messageInput;
        [SerializeField] private Button sendButton;
        [SerializeField] private GameObject messageItemPrefab;
        [SerializeField] private AutoScrollToBottom autoScrollToBottom;

        [Header("Proposal UI")]
        [SerializeField] private Transform proposalListRoot;
        [SerializeField] private GameObject proposalItemPrefab;
        [SerializeField] private Text latestRiskText;
        [SerializeField] private Text latestOutcomeText;

        private DepartmentId _currentDepartmentId;
        private DepartmentRoleConfig _currentRole;
        private readonly List<DepartmentProposal> _latestProposals = new List<DepartmentProposal>();

        private GameFacade Facade => bootstrap != null ? bootstrap.Facade : null;
        public IReadOnlyList<DepartmentProposal> LatestProposals => _latestProposals;
        public DepartmentId CurrentDepartmentId => _currentDepartmentId;

        private void Start()
        {
            if (bootstrap != null && bootstrap.Facade == null)
            {
                bootstrap.Build();
            }

            if (sendButton != null)
            {
                sendButton.onClick.AddListener(SendMessage);
            }

            if (messageInput != null)
            {
                messageInput.onSubmit.AddListener(_ => SendMessage());
            }

            if (chatWindowRoot != null)
            {
                chatWindowRoot.SetActive(false);
            }
        }

        public void OpenChat(DepartmentId departmentId, DepartmentRoleConfig roleConfig)
        {
            if (Facade == null)
            {
                Debug.LogError("[PrivateChatWindow] GameFacade 未初始化，请确认 GameBootstrap 已挂载并 Build。");
                return;
            }

            _currentDepartmentId = departmentId;
            _currentRole = roleConfig;
            _latestProposals.Clear();
            RefreshProposalArea(null);
            RefreshOutcomeArea(null);

            if (agentNameText != null)
            {
                agentNameText.text = roleConfig.DisplayName;
            }

            if (agentDutyText != null)
            {
                agentDutyText.text = roleConfig.DutySummary;
            }

            if (chatWindowRoot != null)
            {
                chatWindowRoot.SetActive(true);
            }

            var openingLine = Facade.SummonDepartment(departmentId);
            ReloadMessages(openingLine);
        }

        public void CloseChat()
        {
            if (chatWindowRoot != null)
            {
                chatWindowRoot.SetActive(false);
            }

            _latestProposals.Clear();
            RefreshProposalArea(null);
            RefreshOutcomeArea(null);
        }

        private async void SendMessage()
        {
            if (Facade == null || _currentRole == null || messageInput == null)
            {
                return;
            }

            var message = messageInput.text.Trim();
            if (string.IsNullOrEmpty(message))
            {
                return;
            }

            messageInput.text = string.Empty;
            if (sendButton != null) sendButton.interactable = false;

            try
            {
                DepartmentDialogueResponse response = await Facade.SendMessageToDepartmentAsync(_currentDepartmentId, message);
                _latestProposals.Clear();
                if (response != null && response.Proposals != null)
                {
                    _latestProposals.AddRange(response.Proposals);
                }

                ReloadMessages(null);
                RefreshProposalArea(response);
                RefreshOutcomeArea(null);
            }
            catch (System.Exception ex)
            {
                Debug.LogError($"[PrivateChatWindow] SendMessage failed: {ex.Message}");
            }
            finally
            {
                if (sendButton != null) sendButton.interactable = true;
                messageInput.ActivateInputField();
            }
        }

        private void ReloadMessages(string openingLine)
        {
            ClearMessageList();

            var state = Facade.State.DepartmentSessions[_currentDepartmentId];
            foreach (var message in state.RecentDialogues)
            {
                AddMessageItem(message);
            }

            if (!string.IsNullOrWhiteSpace(openingLine))
            {
                AddMessageItem(new DialogueMessage(_currentRole.DisplayName, openingLine));
            }

            autoScrollToBottom?.ScrollToBottom();
        }

        private void RefreshProposalArea(DepartmentDialogueResponse response)
        {
            ClearProposalList();

            if (proposalListRoot == null || proposalItemPrefab == null)
            {
                return;
            }

            foreach (var proposal in _latestProposals)
            {
                var obj = Instantiate(proposalItemPrefab, proposalListRoot);
                var item = obj.GetComponent<ProposalItemView>();
                if (item != null)
                {
                    item.Bind(proposal, AdoptProposal);
                }
            }

            if (latestRiskText != null)
            {
                if (response == null || response.Risks == null || response.Risks.Count == 0)
                {
                    latestRiskText.text = string.Empty;
                }
                else
                {
                    latestRiskText.text = "风险提示：\n- " + string.Join("\n- ", response.Risks);
                }
            }
        }

        private void AdoptProposal(DepartmentProposal proposal)
        {
            if (Facade == null)
            {
                return;
            }

            Outcome outcome = Facade.AdoptProposal(_currentDepartmentId, proposal);
            _latestProposals.Clear();

            RefreshProposalArea(null);
            RefreshOutcomeArea(outcome);

            // 执行提案并不会自动往对话历史里写一条“系统消息”，
            // 所以这里不重载消息列表，只显示 Outcome 区域。
        }

        private void RefreshOutcomeArea(Outcome outcome)
        {
            if (latestOutcomeText == null)
            {
                return;
            }

            if (outcome == null)
            {
                latestOutcomeText.text = string.Empty;
                return;
            }

            latestOutcomeText.text = BuildOutcomeText(outcome);
        }

        private static string BuildOutcomeText(Outcome outcome)
        {
            var facts = outcome.Facts != null && outcome.Facts.Count > 0
                ? "\n" + string.Join("\n", outcome.Facts.Select(x => $"- {x.Key}: {x.Before} -> {x.After}"))
                : string.Empty;

            return $"【{outcome.Title}】\n{outcome.Summary}{facts}";
        }

        private void AddMessageItem(DialogueMessage message)
        {
            var item = Instantiate(messageItemPrefab, messageList);
            var itemView = item.GetComponent<ChatMessageItem>();
            if (itemView != null)
            {
                itemView.SetMessage(message, _currentRole);
            }
        }

        private void ClearMessageList()
        {
            if (messageList == null) return;
            for (int i = messageList.childCount - 1; i >= 0; i--)
            {
                Destroy(messageList.GetChild(i).gameObject);
            }
        }

        private void ClearProposalList()
        {
            if (proposalListRoot == null) return;
            for (int i = proposalListRoot.childCount - 1; i >= 0; i--)
            {
                Destroy(proposalListRoot.GetChild(i).gameObject);
            }
        }
    }
}
