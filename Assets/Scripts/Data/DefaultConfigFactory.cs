using System.Collections.Generic;
using MonarchSim.Data.Json;
using MonarchSim.Domain.Enums;

namespace MonarchSim.Data
{
    /// <summary>
    /// 默认配置工厂
    /// 直接创建六部配置，硬编码，逻辑测试用
    /// </summary>
    public static class DefaultConfigFactory
    {
        public static List<DepartmentRoleConfig> CreateDepartmentRoles()
        {
            return new List<DepartmentRoleConfig>
            {
                new DepartmentRoleConfig
                {
                    DepartmentId = DepartmentId.Libu,
                    DisplayName = "吏部",
                    DutySummary = "掌官员选授、考课与铨叙",
                    SpeakingStyle = "审慎、重秩序、偏重人事平衡",
                    Conservatism = 0.75f,
                    RiskTolerance = 0.35f,
                    InitialTrust = 0.60f
                },
                new DepartmentRoleConfig
                {
                    DepartmentId = DepartmentId.Hubu,
                    DisplayName = "户部",
                    DutySummary = "掌财政、税赋、户籍与仓储",
                    SpeakingStyle = "务实、算账清晰、偏重收支平衡",
                    Conservatism = 0.65f,
                    RiskTolerance = 0.30f,
                    InitialTrust = 0.58f
                },
                new DepartmentRoleConfig
                {
                    DepartmentId = DepartmentId.LibuRites,
                    DisplayName = "礼部",
                    DutySummary = "掌礼仪、科举、外交与舆情名分",
                    SpeakingStyle = "讲名分、重观感、擅长措辞",
                    Conservatism = 0.70f,
                    RiskTolerance = 0.40f,
                    InitialTrust = 0.62f
                },
                new DepartmentRoleConfig
                {
                    DepartmentId = DepartmentId.Bingbu,
                    DisplayName = "兵部",
                    DutySummary = "掌军政、军备、边防与征调",
                    SpeakingStyle = "直接、重效率、偏重安全",
                    Conservatism = 0.55f,
                    RiskTolerance = 0.60f,
                    InitialTrust = 0.57f
                },
                new DepartmentRoleConfig
                {
                    DepartmentId = DepartmentId.Xingbu,
                    DisplayName = "刑部",
                    DutySummary = "掌司法、审案与法度执行",
                    SpeakingStyle = "重证据、讲程序、偏重震慑",
                    Conservatism = 0.72f,
                    RiskTolerance = 0.28f,
                    InitialTrust = 0.59f
                },
                new DepartmentRoleConfig
                {
                    DepartmentId = DepartmentId.Gongbu,
                    DisplayName = "工部",
                    DutySummary = "掌工程、营造、水利与器用",
                    SpeakingStyle = "重落地、谈工期、偏重资源协调",
                    Conservatism = 0.50f,
                    RiskTolerance = 0.55f,
                    InitialTrust = 0.61f
                }
            };
        }
        public static BalanceConfig CreateDefaultBalance()
        {
            return new BalanceConfig(); // 直接用 BalanceConfig 里的默认值
        }

        public static ProposalCatalogConfig CreateDefaultProposalCatalog()
        {
            return new ProposalCatalogConfig
            {
                Items =
                {
                    new ProposalDefinition { Key="AdjustTaxRate", DisplayName="调整税率", Category="Finance", Enabled=true, ParamKind="Float", MinFloat=0.05f, MaxFloat=0.30f, DefaultFloat=0.16f, Description="试行小幅加税，观察一季后再议。" },
                    new ProposalDefinition { Key="RequestGrainRelief", DisplayName="开仓赈济", Category="Relief", Enabled=true, ParamKind="None", Description="拨粮赈济以稳民心。" },
                    new ProposalDefinition { Key="IncreaseMilitaryBudget", DisplayName="增加军费", Category="Military", Enabled=true, ParamKind="Int", MinInt=0, MaxInt=500, DefaultInt=120, Description="提高军费以固边防。" },
                    new ProposalDefinition { Key="LaunchInspection", DisplayName="派员巡查", Category="Administration", Enabled=true, ParamKind="None", Description="整肃吏治，稳定舆情。" },
                    new ProposalDefinition { Key="BuildIrrigation", DisplayName="兴修水利", Category="Construction", Enabled=true, ParamKind="None", Description="投入工程以增仓储与产出。" }
                }
            };
        }
    }
}
