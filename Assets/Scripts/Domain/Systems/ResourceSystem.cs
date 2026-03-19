using MonarchSim.Core;
using MonarchSim.Domain.Events;
using MonarchSim.Domain.Outcomes;
using MonarchSim.Domain.State;

namespace MonarchSim.Domain.Systems
{
    /// <summary>
    /// 资源变更系统
    /// </summary>
    public sealed class ResourceSystem
    {
        private readonly GameState _state;
        private readonly EventBus _eventBus;

        public ResourceSystem(GameState state, EventBus eventBus)
        {
            _state = state;
            _eventBus = eventBus;
        }
        /// <summary>
        /// 修改资源
        /// </summary>
        /// <param name="goldDelta">国库资金变更</param>
        /// <param name="grainDelta">粮食变更</param>
        /// <param name="publicSupportDelta">民心变更</param>
        /// <param name="reason">原因</param>
        /// <returns>统一变化输出结构</returns>
        public Outcome AddResources(int goldDelta, int grainDelta, float publicSupportDelta, string reason)
        {
            var resources = _state.World.Resources;

            var beforeGold = resources.Gold;
            var beforeGrain = resources.Grain;
            var beforeSupport = resources.PublicSupport;

            resources.Gold += goldDelta;
            resources.Grain += grainDelta;
            resources.PublicSupport += publicSupportDelta;

            var version = _state.World.AdvanceVersion();
            var outcome = new Outcome
            {
                WorldVersion = version,
                Source = "ResourceSystem",
                Title = "资源变更",
                Summary = reason
            };

            outcome.Facts.Add(new FactChange { Key = "Gold", Before = beforeGold.ToString(), After = resources.Gold.ToString() });
            outcome.Facts.Add(new FactChange { Key = "Grain", Before = beforeGrain.ToString(), After = resources.Grain.ToString() });
            outcome.Facts.Add(new FactChange { Key = "PublicSupport", Before = beforeSupport.ToString("F1"), After = resources.PublicSupport.ToString("F1") });

            _eventBus.Publish(new ResourceChangedEvent
            {
                WorldVersion = version,
                GoldDelta = goldDelta,
                GrainDelta = grainDelta,
                PublicSupportDelta = publicSupportDelta,
                Reason = reason
            });

            return outcome;
        }
    }
}
