using System.Collections.Generic;
using MonarchSim.Core;
using MonarchSim.Data;
using MonarchSim.Data.Json;
using UnityEngine;

namespace MonarchSim.UI.PrivateChat
{
    /// <summary>
    /// 六部列表管理器。
    /// 这版不再从 AdditionalScripts 的 ChatManager 取 AgentData，
    /// 而是直接读取 GameBootstrap 暴露的 DepartmentRoleConfig 列表。
    /// </summary>
    public sealed class AgentListManager : MonoBehaviour
    {
        [SerializeField] private GameBootstrap bootstrap;
        [SerializeField] private GameObject agentButtonPrefab;
        [SerializeField] private Transform agentListContent;
        [SerializeField] private PrivateChatWindow chatWindow;

        private void Start()
        {
            LoadAgentButtons();
        }

        [ContextMenu("Reload Agent Buttons")]
        public void LoadAgentButtons()
        {
            ClearExistingButtons();

            var roles = GetRoleConfigs();
            foreach (var role in roles)
            {
                var buttonObj = Instantiate(agentButtonPrefab, agentListContent);
                var button = buttonObj.GetComponent<AgentButton>();
                if (button != null)
                {
                    button.Initialize(role, chatWindow);
                }
            }
        }

        private IReadOnlyList<DepartmentRoleConfig> GetRoleConfigs()
        {
            if (bootstrap != null)
            {
                if (bootstrap.Facade == null)
                {
                    bootstrap.Build();
                }

                if (bootstrap.RoleConfigs != null)
                {
                    return bootstrap.RoleConfigs;
                }
            }

            return DefaultConfigFactory.CreateDepartmentRoles();
        }

        private void ClearExistingButtons()
        {
            if (agentListContent == null) return;
            for (int i = agentListContent.childCount - 1; i >= 0; i--)
            {
                Destroy(agentListContent.GetChild(i).gameObject);
            }
        }
    }
}
