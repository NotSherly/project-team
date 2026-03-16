using UnityEngine;
using System.Collections;

namespace TXAI.Game.Test
{
    /// <summary>
    /// 私聊系统测试脚本
    /// 用于在 Unity Editor 中快速测试私聊功能
    /// </summary>
    public class PrivateChatTester : MonoBehaviour
    {
        [Header("测试配置")]
        [Tooltip("要测试的 Agent ID")]
        public string testAgentId = "hubu";

        [Tooltip("测试消息")]
        public string testMessage = "当前国库状况如何？";

        [Header("快捷键")]
        [Tooltip("按 T 键发送测试消息")]
        public KeyCode sendTestMessageKey = KeyCode.T;

        [Tooltip("按 L 键加载聊天历史")]
        public KeyCode loadHistoryKey = KeyCode.L;

        [Tooltip("按 C 键清空聊天记录")]
        public KeyCode clearChatKey = KeyCode.C;

        [Tooltip("按 A 键测试所有 Agent")]
        public KeyCode testAllAgentsKey = KeyCode.A;

        private void Update()
        {
            // 发送测试消息
            if (Input.GetKeyDown(sendTestMessageKey))
            {
                SendTestMessage();
            }

            // 加载聊天历史
            if (Input.GetKeyDown(loadHistoryKey))
            {
                LoadTestHistory();
            }

            // 清空聊天记录
            if (Input.GetKeyDown(clearChatKey))
            {
                ClearTestChat();
            }

            // 测试所有 Agent
            if (Input.GetKeyDown(testAllAgentsKey))
            {
                TestAllAgents();
            }
        }

        /// <summary>
        /// 发送测试消息
        /// </summary>
        public void SendTestMessage()
        {
            Debug.Log($"[测试] 发送消息到 {testAgentId}: {testMessage}");

            StartCoroutine(Game.ChatManager.Instance.SendMessage(
                testAgentId,
                testMessage,
                (response) => {
                    Debug.Log($"[测试] ✅ 收到回复: {response}");
                },
                (error) => {
                    Debug.LogError($"[测试] ❌ 发送失败: {error}");
                }
            ));
        }

        /// <summary>
        /// 加载聊天历史
        /// </summary>
        public void LoadTestHistory()
        {
            Debug.Log($"[测试] 加载 {testAgentId} 的聊天历史");

            StartCoroutine(Game.ChatManager.Instance.LoadChatHistory(
                testAgentId,
                (success) => {
                    if (success)
                    {
                        var conversation = Game.ChatManager.Instance.GetConversation(testAgentId);
                        Debug.Log($"[测试] ✅ 加载成功，共 {conversation.messages.Count} 条消息");

                        foreach (var msg in conversation.messages)
                        {
                            string sender = msg.isFromPlayer ? "玩家" : "Agent";
                            Debug.Log($"  [{sender}] {msg.content}");
                        }
                    }
                    else
                    {
                        Debug.LogError("[测试] ❌ 加载失败");
                    }
                }
            ));
        }

        /// <summary>
        /// 清空聊天记录
        /// </summary>
        public void ClearTestChat()
        {
            var conversation = Game.ChatManager.Instance.GetConversation(testAgentId);
            conversation.ClearMessages();
            Debug.Log($"[测试] ✅ 已清空 {testAgentId} 的聊天记录");
        }

        /// <summary>
        /// 测试所有 Agent
        /// </summary>
        public void TestAllAgents()
        {
            var agents = Game.ChatManager.Instance.GetAgents();
            Debug.Log($"[测试] 开始测试所有 {agents.Count} 个 Agent");

            foreach (var agent in agents)
            {
                StartCoroutine(TestAgent(agent.id, agent.name));
            }
        }

        private IEnumerator TestAgent(string agentId, string agentName)
        {
            Debug.Log($"[测试] 测试 {agentName} ({agentId})");

            string message = $"你好，{agentName}！";

            yield return Game.ChatManager.Instance.SendMessage(
                agentId,
                message,
                (response) => {
                    Debug.Log($"[测试] ✅ {agentName} 回复: {response}");
                },
                (error) => {
                    Debug.LogError($"[测试] ❌ {agentName} 测试失败: {error}");
                }
            );

            // 等待 1 秒再测试下一个
            yield return new WaitForSeconds(1f);
        }

        private void OnGUI()
        {
            GUILayout.BeginArea(new Rect(10, 10, 350, 250));

            // 标题
            GUILayout.Box("私聊系统测试工具", GUILayout.Height(30));

            GUILayout.Space(10);

            // 配置信息
            GUILayout.Label($"Agent ID: {testAgentId}");
            GUILayout.Label($"测试消息: {testMessage}");

            GUILayout.Space(10);

            // 按钮
            if (GUILayout.Button($"发送测试消息 ({sendTestMessageKey})", GUILayout.Height(30)))
            {
                SendTestMessage();
            }

            if (GUILayout.Button($"加载聊天历史 ({loadHistoryKey})", GUILayout.Height(30)))
            {
                LoadTestHistory();
            }

            if (GUILayout.Button($"清空聊天记录 ({clearChatKey})", GUILayout.Height(30)))
            {
                ClearTestChat();
            }

            if (GUILayout.Button($"测试所有 Agent ({testAllAgentsKey})", GUILayout.Height(30)))
            {
                TestAllAgents();
            }

            GUILayout.EndArea();
        }
    }
}
