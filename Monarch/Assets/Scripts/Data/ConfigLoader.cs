using System;
using System.Collections.Generic;
using UnityEngine;
using MonarchSim.Data.Json;

namespace MonarchSim.Data
{
    /// <summary>
    /// 配置加载器
    /// </summary>
    public sealed class ConfigLoader
    {
        [Serializable]
        private sealed class DepartmentRoleConfigListWrapper
        {
            public List<DepartmentRoleConfig> Items = new List<DepartmentRoleConfig>();
        }

        /// <summary>
        /// 从Json中读取六部角色配置列表
        /// </summary>
        /// <param name="json">Json文件目录</param>
        /// <returns>六部角色配置列表</returns>
        public List<DepartmentRoleConfig> LoadDepartmentRoleConfigsFromJson(string json)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return new List<DepartmentRoleConfig>();
            }

            var wrapper = JsonUtility.FromJson<DepartmentRoleConfigListWrapper>(json);
            return wrapper?.Items ?? new List<DepartmentRoleConfig>();
        }
    }
}
