using System;

namespace MonarchSim.Domain.State
{
    /// <summary>
    /// 资源状态
    /// </summary>
    [Serializable]
    public sealed class ResourceState
    {
        public int Gold = 500; // 国库
        public int Grain = 400; // 粮食
        public float PublicSupport = 60f; // 民心
    }
}
