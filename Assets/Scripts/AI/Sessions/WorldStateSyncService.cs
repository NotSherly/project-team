using System.Collections.Generic;
using MonarchSim.AI.Models;
using MonarchSim.Domain.State;

namespace MonarchSim.AI.Sessions
{
    /// <summary>
    /// 世界状态同步服务
    /// </summary>
    public sealed class WorldStateSyncService
    {
        private readonly GameState _state;
        private readonly CourtPublicMemoBoard _memoBoard;

        public WorldStateSyncService(GameState state, CourtPublicMemoBoard memoBoard)
        {
            _state = state;
            _memoBoard = memoBoard;
        }

        /// <summary>
        /// 构建部门同步包
        /// </summary>
        /// <param name="context">当前要同步的部门</param>
        /// <returns>差量同步包</returns>
        public DepartmentSyncPacket BuildSyncPacket(DepartmentSessionContext context)
        {
            var fromVersion = context.State.LastSeenWorldVersion;
            var toVersion = _state.World.WorldVersion;
            var memos = _memoBoard.GetMemosSince(fromVersion);

            return new DepartmentSyncPacket
            {
                DepartmentId = context.State.DepartmentId,
                FromWorldVersion = fromVersion,
                ToWorldVersion = toVersion,
                RecentPublicMemos = FilterByDepartment(context, memos),
                Snapshot = BuildSnapshot()
            };
        }

        /// <summary>
        /// 完成同步后修改同步版本
        /// </summary>
        /// <param name="context"></param>
        public void MarkSynced(DepartmentSessionContext context)
        {
            context.State.LastSeenWorldVersion = _state.World.WorldVersion;
        }

        /// <summary>
        /// 构建世界快照
        /// </summary>
        /// <returns></returns>
        public WorldStateSnapshot BuildSnapshot()
        {
            return new WorldStateSnapshot
            {
                WorldVersion = _state.World.WorldVersion,
                Year = _state.World.Time.Year,
                Month = _state.World.Time.Month,
                Turn = _state.World.Time.Turn,
                Gold = _state.World.Resources.Gold,
                Grain = _state.World.Resources.Grain,
                PublicSupport = _state.World.Resources.PublicSupport,
                TaxRate = _state.World.Policy.TaxRate,
                MilitaryBudget = _state.World.Policy.MilitaryBudget
            };
        }

        /// <summary>
        /// 为部门返回公共纪要，目前对所有部门都返回全量纪要，后续根据实际修改
        /// </summary>
        /// <param name="context">部门</param>
        /// <param name="memos">公共纪要列表</param>
        /// <returns>该部门可以收到的公共纪要列表</returns>
        private static List<PublicMemoItem> FilterByDepartment(DepartmentSessionContext context, List<PublicMemoItem> memos)
        {
            return memos;
        }
    }
}
