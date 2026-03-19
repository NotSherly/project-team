using UnityEngine;
using MonarchSim.Core;
using MonarchSim.Data.Json;
using MonarchSim.Domain.Enums;
using MonarchSim.Domain.Events;
using MonarchSim.Domain.Outcomes;
using MonarchSim.Domain.State;

namespace MonarchSim.Domain.Systems
{
    public sealed class PolicySystem
    {
        private readonly GameState _state;
        private readonly EventBus _eventBus;
        private readonly BalanceConfig _balance;

        public PolicySystem(GameState state, EventBus eventBus, BalanceConfig balance)
        {
            _state = state;
            _eventBus = eventBus;
            _balance = balance;
        }

        /// <summary>
        /// 修改税率
        /// </summary>
        /// <param name="newTaxRate"></param>
        /// <param name="sourceDepartment"></param>
        /// <returns></returns>
        public Outcome ApplyTaxRate(float newTaxRate, DepartmentId sourceDepartment)
        {
            var policy = _state.World.Policy;
            var resources = _state.World.Resources;

            var oldRate = policy.TaxRate;
            var oldSupport = resources.PublicSupport;

            newTaxRate = Mathf.Clamp(newTaxRate, _balance.TaxPolicy.MinTaxRate, _balance.TaxPolicy.MaxTaxRate);
            policy.TaxRate = newTaxRate;

            var taxDiff = newTaxRate - oldRate;
            resources.PublicSupport = Mathf.Clamp(resources.PublicSupport - taxDiff * _balance.TaxPolicy.PublicSupportImpactScale, 0f, 100f);

            var version = _state.World.AdvanceVersion();
            var outcome = new Outcome
            {
                WorldVersion = version,
                Source = "PolicySystem",
                Title = "税制调整",
                Summary = $"税率从{oldRate:P0}调整为{newTaxRate:P0}。"
            };

            outcome.Facts.Add(new FactChange { Key = "TaxRate", Before = oldRate.ToString("P0"), After = newTaxRate.ToString("P0") });
            outcome.Facts.Add(new FactChange { Key = "PublicSupport", Before = oldSupport.ToString("F1"), After = resources.PublicSupport.ToString("F1") });
            outcome.Deltas.Add(new DeltaRecord { Key = "PublicSupport", Delta = resources.PublicSupport - oldSupport, Reason = "税率调整的即时反馈" });
            outcome.Causes.Add(new CauseRecord { Description = $"采纳{sourceDepartment}的财政建议。" });
            outcome.Effects.Add(new EffectRecord { Description = "后续回合的财政收入与民心趋势将随税率变化。" });

            _eventBus.Publish(new PolicyChangedEvent
            {
                WorldVersion = version,
                PolicyKey = "TaxRate",
                OldValue = oldRate,
                NewValue = newTaxRate,
                SourceDepartment = sourceDepartment.ToString(),
                Summary = outcome.Summary
            });

            return outcome;
        }

        /// <summary>
        /// 调整军费
        /// </summary>
        /// <param name="newBudget"></param>
        /// <param name="sourceDepartment"></param>
        /// <returns></returns>
        public Outcome ApplyMilitaryBudget(int newBudget, DepartmentId sourceDepartment)
        {
            var policy = _state.World.Policy;
            var old = policy.MilitaryBudget;

            policy.MilitaryBudget = newBudget;

            var version = _state.World.AdvanceVersion();
            var outcome = new Outcome
            {
                WorldVersion = version,
                Source = "PolicySystem",
                Title = "军费调整",
                Summary = $"军费预算从{old}调整为{newBudget}。"
            };

            outcome.Facts.Add(new FactChange { Key = "MilitaryBudget", Before = old.ToString(), After = newBudget.ToString() });
            outcome.Causes.Add(new CauseRecord { Description = $"采纳{sourceDepartment}的军政建议。" });
            outcome.Effects.Add(new EffectRecord { Description = "后续可扩展为边防稳定、军心变化等联动。" });

            _eventBus.Publish(new PolicyChangedEvent
            {
                WorldVersion = version,
                PolicyKey = "MilitaryBudget",
                OldValue = old,
                NewValue = newBudget,
                SourceDepartment = sourceDepartment.ToString(),
                Summary = outcome.Summary
            });

            return outcome;
        }
    }
}