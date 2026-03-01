using UnityEngine;
using MonarchSim.Core;
using MonarchSim.Data.Json;
using MonarchSim.Domain.Events;
using MonarchSim.Domain.Outcomes;
using MonarchSim.Domain.State;

namespace MonarchSim.Domain.Systems
{
    /// <summary>
    /// 回合结算系统
    /// </summary>
    public sealed class TurnResolutionSystem
    {
        private readonly GameState _state;
        private readonly EventBus _eventBus;
        private readonly BalanceConfig _balance;

        public TurnResolutionSystem(GameState state, EventBus eventBus, BalanceConfig balance)
        {
            _state = state;
            _eventBus = eventBus;
            _balance = balance;
        }

        /// <summary>
        /// 回合结算
        /// </summary>
        /// <returns></returns>
        public Outcome ResolveEndTurn()
        {
            var world = _state.World;
            var resources = world.Resources;
            var policy = world.Policy;

            var beforeGold = resources.Gold;
            var beforeGrain = resources.Grain;
            var beforeSupport = resources.PublicSupport;

            var taxIncome = Mathf.RoundToInt(_balance.Monthly.BaseTaxIncome + policy.TaxRate * _balance.Monthly.TaxIncomeMultiplier);
            var grainConsumption = _balance.Monthly.GrainConsumption;
            var supportDrift = policy.TaxRate > _balance.Monthly.HighTaxThreshold ? _balance.Monthly.HighTaxSupportDrift : _balance.Monthly.LowTaxSupportDrift;

            resources.Gold += taxIncome;
            resources.Grain = Mathf.Max(0, resources.Grain - grainConsumption);
            resources.PublicSupport = Mathf.Clamp(resources.PublicSupport + supportDrift, 0f, 100f);

            world.Time.AdvanceOneMonth();
            var version = world.AdvanceVersion();

            var outcome = new Outcome
            {
                WorldVersion = version,
                Source = "TurnResolutionSystem",
                Title = "月度结算",
                Summary = $"税收入库{taxIncome}，常规耗粮{grainConsumption}。"
            };
            outcome.Facts.Add(new FactChange { Key = "Gold", Before = beforeGold.ToString(), After = resources.Gold.ToString() });
            outcome.Facts.Add(new FactChange { Key = "Grain", Before = beforeGrain.ToString(), After = resources.Grain.ToString() });
            outcome.Facts.Add(new FactChange { Key = "PublicSupport", Before = beforeSupport.ToString("F1"), After = resources.PublicSupport.ToString("F1") });
            outcome.Causes.Add(new CauseRecord { Description = $"税率为{policy.TaxRate:P0}，决定了本月入库水平。" });
            outcome.Effects.Add(new EffectRecord { Description = "时间推进一个月，可能触发新的朝政事件。" });

            _eventBus.Publish(new TurnEndedEvent
            {
                WorldVersion = version,
                Year = world.Time.Year,
                Month = world.Time.Month,
                Turn = world.Time.Turn
            });

            return outcome;
        }
    }
}