using System;
using System.Collections.Generic;

namespace MonarchSim.Domain.State
{
    /// <summary>
    /// 世界公开状态，全局真相来源
    /// 六部进行同步的根基，根据版本和公共纪要进行
    /// </summary>
    [Serializable]
    public sealed class WorldState
    {
        public int WorldVersion = 0;
        public TimeState Time = new TimeState();
        public ResourceState Resources = new ResourceState(); // 资源
        public PolicyState Policy = new PolicyState(); // 政策
        public List<string> ImperialDecrees = new List<string>(); // 已颁布诏令
        public List<string> ResolvedEvents = new List<string>(); // 已解决事件
        /// <summary>
        /// 推进世界版本
        /// </summary>
        /// <returns>世界版本号</returns>
        public int AdvanceVersion()
        {
            WorldVersion++;
            return WorldVersion;
        }
    }
}
