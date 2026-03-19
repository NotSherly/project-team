using System.Collections.Generic;
using UnityEngine;
using MonarchSim.Data.Json;
using MonarchSim.Domain.Outcomes;
using MonarchSim.Domain.State;

namespace MonarchSim.Domain.Systems
{

    /// <summary>
    /// 事件系统，检查额外事件
    /// </summary>
    public sealed class EventSystem
    {
        private readonly GameState _state;
        private readonly BalanceConfig _balance;

        public EventSystem(GameState state, BalanceConfig balance)
        {
            _state = state;
            _balance = balance;
        }

        /// <summary>
        /// 执行额外事件
        /// </summary>
        /// <returns></returns>
        public List<Outcome> EvaluateEndTurnEvents()
        {
            var outcomes = new List<Outcome>();
            var world = _state.World;
            var resources = world.Resources;

            if (resources.Grain < _balance.Events.LowGrainThreshold)
            {
                var beforeSupport = resources.PublicSupport;
                resources.PublicSupport = Mathf.Clamp(resources.PublicSupport - _balance.Events.LowGrainSupportPenalty, 0f, 100f);

                var version = world.AdvanceVersion();
                world.ResolvedEvents.Add("粮荒预警");

                var outcome = new Outcome
                {
                    WorldVersion = version,
                    Source = "EventSystem",
                    Title = "粮荒预警",
                    Summary = "仓储偏低，坊间对后续赈济能力产生担忧。"
                };
                outcome.Facts.Add(new FactChange { Key = "PublicSupport", Before = beforeSupport.ToString("F1"), After = resources.PublicSupport.ToString("F1") });
                outcome.Causes.Add(new CauseRecord { Description = $"粮食低于{_balance.Events.LowGrainThreshold}，触发粮荒预警。" });
                outcome.Effects.Add(new EffectRecord { Description = "若后续仍不补仓，民心会继续下滑。" });
                outcomes.Add(outcome);
            }

            if (resources.PublicSupport < _balance.Events.LowSupportThreshold)
            {
                var beforeGold = resources.Gold;
                resources.Gold = Mathf.Max(0, resources.Gold - _balance.Events.LowSupportGoldPenalty);

                var version = world.AdvanceVersion();
                world.ResolvedEvents.Add("地方怨言");

                var outcome = new Outcome
                {
                    WorldVersion = version,
                    Source = "EventSystem",
                    Title = "地方怨言",
                    Summary = "民心低迷导致征收效率下降。"
                };
                outcome.Facts.Add(new FactChange { Key = "Gold", Before = beforeGold.ToString(), After = resources.Gold.ToString() });
                outcome.Causes.Add(new CauseRecord { Description = $"民心低于{_balance.Events.LowSupportThreshold:F0}，征收效率受损。" });
                outcome.Effects.Add(new EffectRecord { Description = "本回合额外损失一部分财政收入。" });
                outcomes.Add(outcome);
            }

            return outcomes;
        }
    }
}