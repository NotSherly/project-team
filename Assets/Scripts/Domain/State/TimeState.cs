using System;

namespace MonarchSim.Domain.State
{
    /// <summary>
    /// 时间状态
    /// </summary>
    [Serializable]
    public sealed class TimeState
    {
        public int Year = 1;
        public int Month = 1;
        public int Turn = 1;

        /// <summary>
        /// 推进一个月，并推进回合
        /// </summary>
        public void AdvanceOneMonth()
        {
            Month++;
            Turn++;
            if (Month > 12)
            {
                Month = 1;
                Year++;
            }
        }
    }
}
