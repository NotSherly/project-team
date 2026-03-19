using System;
using System.Text;
using System.Threading.Tasks;
using MonarchSim.AI.Interfaces;
using MonarchSim.AI.Models;
using MonarchSim.Domain.Enums;
using UnityEngine;
using UnityEngine.Networking;

namespace MonarchSim.AI.Services
{
    /// <summary>
    /// 适配 demo 后端 /api/chat/private 的部门 AI 服务。
    ///
    /// 说明：demo 私聊接口当前只返回纯文本 message，不返回 stance / proposals / risks。
    /// 因此这里采用“远端回复文本 + 本地回退补全结构字段”的混合策略：
    /// - ReplyText 优先使用 demo 后端返回
    /// - Stance / Proposals / Risks 若后端无提供，则用 fallbackService 生成
    /// </summary>
    public sealed class RemoteDepartmentAIService : IDepartmentAIService
    {
        private readonly string _baseUrl;
        private readonly IDepartmentAIService _fallbackService;
        private readonly float _timeoutSeconds;

        public RemoteDepartmentAIService(string baseUrl, IDepartmentAIService fallbackService, float timeoutSeconds = 15f)
        {
            _baseUrl = (baseUrl ?? string.Empty).TrimEnd('/');
            _fallbackService = fallbackService;
            _timeoutSeconds = timeoutSeconds;
        }

        public async Task<DepartmentDialogueResponse> GenerateDepartmentReplyAsync(DepartmentDialogueRequest request)
        {
            var fallback = _fallbackService != null
                ? await _fallbackService.GenerateDepartmentReplyAsync(request)
                : new DepartmentDialogueResponse { DepartmentId = request.DepartmentId };

            try
            {
                var payload = new DemoPrivateChatRequest
                {
                    agentId = DepartmentIdMapper.ToDemoAgentId(request.DepartmentId),
                    message = request.PlayerMessage,

                    // 下面这些字段 demo 当前不会使用，但保留发送，便于未来后端逐步升级
                    worldVersion = request.SyncPacket?.Snapshot?.WorldVersion ?? 0,
                    contextSummary = BuildContextSummary(request)
                };

                var json = JsonUtility.ToJson(payload);
                using (var req = new UnityWebRequest($"{_baseUrl}/api/chat/private", UnityWebRequest.kHttpVerbPOST))
                {
                    var bodyRaw = Encoding.UTF8.GetBytes(json);
                    req.uploadHandler = new UploadHandlerRaw(bodyRaw);
                    req.downloadHandler = new DownloadHandlerBuffer();
                    req.SetRequestHeader("Content-Type", "application/json");
                    req.timeout = Mathf.CeilToInt(_timeoutSeconds);

                    var op = req.SendWebRequest();
                    while (!op.isDone)
                    {
                        await Task.Yield();
                    }

#if UNITY_2020_1_OR_NEWER
                    if (req.result != UnityWebRequest.Result.Success)
#else
                    if (req.isNetworkError || req.isHttpError)
#endif
                    {
                        Debug.LogWarning($"[RemoteDepartmentAIService] Request failed: {req.error}");
                        return fallback;
                    }

                    var text = req.downloadHandler.text;
                    var wrapper = JsonUtility.FromJson<DemoPrivateChatResponseWrapper>(text);
                    if (wrapper == null || !wrapper.success || wrapper.data == null || string.IsNullOrWhiteSpace(wrapper.data.message))
                    {
                        Debug.LogWarning("[RemoteDepartmentAIService] Invalid response, fallback used.");
                        return fallback;
                    }

                    // 混合策略：回复文本用远端，其余结构字段沿用 fallback，保证主流程不断。
                    fallback.ReplyText = wrapper.data.message;
                    fallback.DepartmentId = request.DepartmentId;
                    return fallback;
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[RemoteDepartmentAIService] Exception: {ex.Message}");
                return fallback;
            }
        }

        private static string BuildContextSummary(DepartmentDialogueRequest request)
        {
            var snap = request.SyncPacket?.Snapshot;
            if (snap == null)
            {
                return request.PlayerMessage ?? string.Empty;
            }

            return $"Dept={request.DepartmentId}; Year={snap.Year}; Month={snap.Month}; Turn={snap.Turn}; Gold={snap.Gold}; Grain={snap.Grain}; Support={snap.PublicSupport:F1}; Tax={snap.TaxRate:P0}; MilitaryBudget={snap.MilitaryBudget}; Player={request.PlayerMessage}";
        }

        [Serializable]
        private sealed class DemoPrivateChatRequest
        {
            public string agentId;
            public string message;

            // 兼容未来后端升级，当前 demo 不读取这些字段
            public int worldVersion;
            public string contextSummary;
        }

        [Serializable]
        private sealed class DemoPrivateChatResponseWrapper
        {
            public bool success;
            public DemoPrivateChatResponseData data;
            public string error;
        }

        [Serializable]
        private sealed class DemoPrivateChatResponseData
        {
            public string message;
        }
    }
}
