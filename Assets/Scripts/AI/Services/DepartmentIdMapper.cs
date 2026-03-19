using MonarchSim.Domain.Enums;

namespace MonarchSim.AI.Services
{
    /// <summary>
    /// Unity 侧 DepartmentId 与 demo 后端 agentId 的映射。
    /// </summary>
    public static class DepartmentIdMapper
    {
        public static string ToDemoAgentId(DepartmentId departmentId)
        {
            switch (departmentId)
            {
                case DepartmentId.Libu:
                    return "libu";
                case DepartmentId.Hubu:
                    return "hubu";
                case DepartmentId.LibuRites:
                    return "libubu"; // demo 中礼部使用 libubu
                case DepartmentId.Bingbu:
                    return "bingbu";
                case DepartmentId.Xingbu:
                    return "xingbu";
                case DepartmentId.Gongbu:
                    return "gongbu";
                default:
                    return "hubu";
            }
        }
    }
}
