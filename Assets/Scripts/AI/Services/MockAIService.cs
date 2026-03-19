using System.Threading.Tasks;
using MonarchSim.AI.Interfaces;
using MonarchSim.AI.Models;
using MonarchSim.Domain.Enums;

namespace MonarchSim.AI.Services
{
    /// <summary>
    /// Fake AI，目前只用于测试逻辑是否能跑通
    /// </summary>
    public sealed class MockAIService : IDepartmentAIService, ISummaryAIService
    {
        /// <summary>
        /// 通用回复
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        public Task<DepartmentDialogueResponse> GenerateDepartmentReplyAsync(DepartmentDialogueRequest request)
        {
            var response = new DepartmentDialogueResponse
            {
                DepartmentId = request.DepartmentId,
                Stance = "Neutral"
            };

            switch (request.DepartmentId)
            {
                case DepartmentId.Hubu:
                    BuildHubuReply(request, response);
                    break;
                case DepartmentId.Bingbu:
                    BuildBingbuReply(request, response);
                    break;
                case DepartmentId.Gongbu:
                    BuildGongbuReply(request, response);
                    break;
                default:
                    response.ReplyText = $"【{request.RoleConfig.DisplayName}】臣已知悉。就当前局势看，宜先观其势，再定夺。";
                    response.Risks.Add("暂无明确风险，但建议继续收集更多信息。");
                    break;
            }

            return Task.FromResult(response);
        }

        /// <summary>
        /// 回合总结
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        public Task<TurnSummaryResponse> GenerateTurnSummaryAsync(TurnSummaryRequest request)
        {
            var response = new TurnSummaryResponse
            {
                Title = $"第{request.Snapshot.Turn}回合纪要",
                SummaryText =
                    $"本月国库存{request.Snapshot.Gold}，仓粮{request.Snapshot.Grain}，民心{request.Snapshot.PublicSupport:F1}。"
            };

            if (request.Snapshot.PublicSupport < 40f)
            {
                response.Risks.Add("民心偏低，需优先处理赈济或减轻征敛。");
            }

            if (request.Snapshot.Grain < 120)
            {
                response.Risks.Add("仓粮偏低，后续可能触发粮荒预警。");
            }

            response.NextFocusSuggestions.Add("可优先召见户部，重新评估财政与仓储。");
            response.NextFocusSuggestions.Add("若边患加剧，可再召见兵部评估军费。");

            return Task.FromResult(response);
        }

        /// <summary>
        /// 户部回复
        /// </summary>
        /// <param name="request"></param>
        /// <param name="response"></param>
        private static void BuildHubuReply(DepartmentDialogueRequest request, DepartmentDialogueResponse response)
        {
            var taxRate = request.SyncPacket.Snapshot.TaxRate;
            response.Stance = "Cautious";
            response.ReplyText = $"【户部】当前税率为{taxRate:P0}，国库与民心尚可维持。若陛下欲增收，可小幅上调并观察一季。";
            response.Proposals.Add(new DepartmentProposal
            {
                ProposalType = ProposalType.AdjustTaxRate,
                Title = "试行小幅加税",
                Description = "先将税率上调到16%，观察一季后再决断。",
                SuggestedFloatValue = 0.16f
            });
            response.Risks.Add("税率上调会立刻压低部分民心。");
        }

        /// <summary>
        /// 兵部回复
        /// </summary>
        /// <param name="request"></param>
        /// <param name="response"></param>
        private static void BuildBingbuReply(DepartmentDialogueRequest request, DepartmentDialogueResponse response)
        {
            response.Stance = "Assertive";
            response.ReplyText = "【兵部】边防之事不可缓。若财政容许，宜维持军费，不宜频繁削减。";
            response.Proposals.Add(new DepartmentProposal
            {
                ProposalType = ProposalType.IncreaseMilitaryBudget,
                Title = "维持军备拨款",
                Description = "短期内不宜削军费，至少保持现有军备投入。",
                SuggestedIntValue = 120
            });
            response.Risks.Add("若军费长期不足，边防威慑会下降。");
        }

        /// <summary>
        /// 工部回复
        /// </summary>
        /// <param name="request"></param>
        /// <param name="response"></param>
        private static void BuildGongbuReply(DepartmentDialogueRequest request, DepartmentDialogueResponse response)
        {
            response.Stance = "Pragmatic";
            response.ReplyText = "【工部】若欲兼顾民心与长治久安，宜趁春时修缮水利。";
            response.Proposals.Add(new DepartmentProposal
            {
                ProposalType = ProposalType.BuildIrrigation,
                Title = "修缮水利",
                Description = "投入部分财力修缮水渠，可稳定后续粮食产出。",
                SuggestedIntValue = 60
            });
            response.Risks.Add("工程占款会压缩短期财政腾挪空间。");
        }
    }
}
