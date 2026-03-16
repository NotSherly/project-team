using UnityEngine;
using TXAI.Game.Game;

namespace TXAI.Game.UI.PrivateChat
{
    public class AgentListManager : MonoBehaviour
    {
        public GameObject agentButtonPrefab;
        public Transform agentListContent;
        public PrivateChatWindow chatWindow;

        private void Start() {
            LoadAgentButtons();
        }

        private void LoadAgentButtons() {
            var agents = ChatManager.Instance.GetAgents();
            foreach (var agent in agents) {
                GameObject buttonObj = Instantiate(agentButtonPrefab, agentListContent);
                AgentButton button = buttonObj.GetComponent<AgentButton>();
                if (button != null) {
                    button.Initialize(agent, chatWindow);
                }
            }
        }
    }
}
