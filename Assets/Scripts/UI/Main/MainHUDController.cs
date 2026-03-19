using System.Linq;
using MonarchSim.Application.Facades;
using MonarchSim.Core;
using MonarchSim.Domain.State;
using UnityEngine;
using UnityEngine.UI;

namespace MonarchSim.UI.Main
{
    /// <summary>
    /// 主界面状态栏控制器（HUD）。
    /// 作用：在无复杂UI逻辑的前提下，把当前时间、资源、关键政策、最近纪要展示出来。
    /// 当前实现采用轻量轮询刷新，避免在 EventBus 未暴露给 UI 的情况下引入额外耦合。
    /// </summary>
    public sealed class MainHUDController : MonoBehaviour
    {
        [Header("Dependencies")]
        [SerializeField] private GameBootstrap bootstrap;

        [Header("Texts")]
        [SerializeField] private Text timeText;
        [SerializeField] private Text resourceText;
        [SerializeField] private Text policyText;
        [SerializeField] private Text recentMemoTitleText;
        [SerializeField] private Text recentMemoSummaryText;
        [SerializeField] private Text statsText;

        [Header("Refresh")]
        [SerializeField] private bool autoRefresh = true;
        [SerializeField] private float refreshInterval = 0.25f;

        private float _nextRefreshTime;
        private GameFacade Facade => bootstrap != null ? bootstrap.Facade : null;

        private void Start()
        {
            if (bootstrap != null && bootstrap.Facade == null)
            {
                bootstrap.Build();
            }

            RefreshNow();
        }

        private void Update()
        {
            if (!autoRefresh) return;
            if (Time.unscaledTime < _nextRefreshTime) return;

            _nextRefreshTime = Time.unscaledTime + Mathf.Max(0.05f, refreshInterval);
            RefreshNow();
        }

        [ContextMenu("HUD/Refresh Now")]
        public void RefreshNow()
        {
            if (Facade == null)
            {
                SetIfNotNull(timeText, "未初始化");
                SetIfNotNull(resourceText, "请确认 GameBootstrap 已挂载并完成 Build。");
                return;
            }

            var state = Facade.State;
            var world = state.World;
            var resources = world.Resources;
            var policy = world.Policy;

            SetIfNotNull(timeText, $"第{world.Time.Year}年 {world.Time.Month}月 | 回合 {world.Time.Turn} | 版本 {world.WorldVersion}");
            SetIfNotNull(resourceText,
                $"国库：{resources.Gold}\n粮食：{resources.Grain}\n民心：{resources.PublicSupport:F1}");
            SetIfNotNull(policyText,
                $"税率：{policy.TaxRate:P0}\n军费：{policy.MilitaryBudget}");

            var latestMemo = state.CourtPublicLog.PublicMemos.LastOrDefault();
            if (latestMemo != null)
            {
                SetIfNotNull(recentMemoTitleText, latestMemo.Title);
                SetIfNotNull(recentMemoSummaryText, latestMemo.Summary);
            }
            else
            {
                SetIfNotNull(recentMemoTitleText, "暂无纪要");
                SetIfNotNull(recentMemoSummaryText, "当前尚无公共纪要。可先私聊六部、采纳提案或结束回合后观察变化。");
            }

            var lastAudience = GetLastAudienceInfo(state);
            SetIfNotNull(statsText,
                $"部门会话数：{state.DepartmentSessions.Count}\n公共纪要数：{state.CourtPublicLog.PublicMemos.Count}\n日志条数：{state.Logs.Count}\n最近召见：{lastAudience}");
        }

        private static string GetLastAudienceInfo(GameState state)
        {
            if (state.DepartmentSessions == null || state.DepartmentSessions.Count == 0)
            {
                return "无";
            }

            var ordered = state.DepartmentSessions
                .OrderByDescending(kv => kv.Value.LastAudienceTurn)
                .FirstOrDefault();

            if (ordered.Value == null || ordered.Value.LastAudienceTurn <= 0)
            {
                return "尚未召见";
            }

            return $"{ordered.Key}（回合 {ordered.Value.LastAudienceTurn}）";
        }

        private static void SetIfNotNull(Text target, string value)
        {
            if (target != null) target.text = value;
        }
    }
}
