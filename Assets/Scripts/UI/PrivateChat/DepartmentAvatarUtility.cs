using MonarchSim.Domain.Enums;

namespace MonarchSim.UI.PrivateChat
{
    /// <summary>
    /// 兼容 AdditionalScripts 里旧的 Resources 头像路径命名。
    /// 你们后面若把头像路径正式写入 DepartmentRoleConfig，可删除此工具类。
    /// </summary>
    internal static class DepartmentAvatarUtility
    {
        public static string GetLegacyAvatarPath(DepartmentId id)
        {
            switch (id)
            {
                case DepartmentId.Libu: return "AgentAvatars/libu";
                case DepartmentId.Hubu: return "AgentAvatars/hubu";
                case DepartmentId.LibuRites: return "AgentAvatars/libubu";
                case DepartmentId.Bingbu: return "AgentAvatars/bingbu";
                case DepartmentId.Xingbu: return "AgentAvatars/xingbu";
                case DepartmentId.Gongbu: return "AgentAvatars/gongbu";
                default: return string.Empty;
            }
        }
    }
}
