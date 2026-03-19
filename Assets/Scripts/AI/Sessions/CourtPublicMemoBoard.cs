using System.Collections.Generic;
using System.Linq;
using MonarchSim.AI.Models;
using MonarchSim.Domain.Outcomes;
using MonarchSim.Domain.State;

namespace MonarchSim.AI.Sessions
{
    /// <summary>
    /// 公共纪要板，六部从这里获取公开信息
    /// </summary>
    public sealed class CourtPublicMemoBoard
    {
        private readonly GameState _state;

        public CourtPublicMemoBoard(GameState state)
        {
            _state = state;
        }

        /// <summary>
        /// 写入公共纪要
        /// </summary>
        /// <param name="memo">公共纪要数据</param>
        public void AppendMemo(PublicMemoItem memo)
        {
            _state.CourtPublicLog.PublicMemos.Add(memo);

            // 同步写入结构化日志
            _state.Logs.Add(new MonarchSim.Domain.State.LogEntry
            {
                WorldVersion = memo.WorldVersion,
                Year = _state.World.Time.Year,
                Month = _state.World.Time.Month,
                Turn = _state.World.Time.Turn,
                Category = memo.Category,
                Title = memo.Title,
                Summary = memo.Summary,
                CreatedAt = memo.CreatedAt
            });
        }

        /// <summary>
        /// 将Outcome转成纪要并写入
        /// </summary>
        /// <param name="outcome"></param>
        /// <param name="category"></param>
        public void AppendOutcomeMemo(Outcome outcome, string category)
        {
            AppendMemo(new PublicMemoItem
            {
                WorldVersion = outcome.WorldVersion,
                Title = outcome.Title,
                Summary = outcome.Summary,
                Category = category,
                CreatedAt = System.DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            });
        }

        /// <summary>
        /// 获取某版本后的全部公共纪要
        /// </summary>
        /// <param name="fromWorldVersion">从这个版本开始</param>
        /// <returns>目标版本后的公共纪要列表</returns>
        public List<PublicMemoItem> GetMemosSince(int fromWorldVersion)
        {
            return _state.CourtPublicLog.PublicMemos
                .Where(x => x.WorldVersion > fromWorldVersion)
                .OrderBy(x => x.WorldVersion)
                .ToList();
        }

        /// <summary>
        /// 获取最近几条纪要
        /// </summary>
        /// <param name="count">数量</param>
        /// <returns>对应的最近几条摘要列表</returns>
        public List<PublicMemoItem> GetRecent(int count)
        {
            return _state.CourtPublicLog.PublicMemos
                .TakeLast(count)
                .ToList();
        }
    }
}
