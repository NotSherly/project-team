using System.Collections.Generic;
using MonarchSim.Data.Json;

namespace MonarchSim.Domain.State
{
    /// <summary>
    /// 新建游戏状态工厂
    /// </summary>
    public static class GameStateFactory
    {
        /// <summary>
        /// 开新局时新建游戏状态
        /// </summary>
        /// <param name="roleConfigs">部门数据</param>
        /// <returns>游戏状态</returns>
        public static GameState CreateNewGameState(IEnumerable<DepartmentRoleConfig> roleConfigs)
        {
            var state = new GameState();

            // 根据六部的配置初始化六部的DepartmentSessionState
            foreach (var role in roleConfigs)
            {
                state.DepartmentSessions[role.DepartmentId] = new DepartmentSessionState
                {
                    DepartmentId = role.DepartmentId,
                    LastSeenWorldVersion = 0,
                    TrustToEmperor = role.InitialTrust,
                    Conservatism = role.Conservatism,
                    RiskTolerance = role.RiskTolerance
                };
            }

            return state;
        }
    }
}
