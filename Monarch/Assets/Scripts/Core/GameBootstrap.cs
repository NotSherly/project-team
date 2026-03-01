using UnityEngine;
using MonarchSim.AI.Sessions;
using MonarchSim.AI.Services;
using MonarchSim.Application.Facades;
using MonarchSim.Application.UseCases;
using MonarchSim.Data;
using MonarchSim.Domain.Proposals;
using MonarchSim.Domain.Proposals.Executors;
using MonarchSim.Domain.State;
using MonarchSim.Domain.Systems;

namespace MonarchSim.Core
{
    /// <summary>
    /// 逻辑骨架装配入口
    /// </summary>
    public sealed class GameBootstrap : MonoBehaviour
    {
        public GameFacade Facade { get; private set; }

        [Header("Bootstrap")]
        [SerializeField] private bool bootstrapOnAwake = true;

        private void Awake()
        {
            if (bootstrapOnAwake)
            {
                Build();
            }
        }

        [ContextMenu("Build Game Logic")]
        public void Build()
        {
            var eventBus = new EventBus();

            var roleConfigs = DefaultConfigFactory.CreateDepartmentRoles();
            var gameState = GameStateFactory.CreateNewGameState(roleConfigs);

            var balance = BalanceConfigProvider.LoadOrDefault();
            var proposalCatalog = ProposalCatalogProvider.LoadOrDefault();

            var memoBoard = new CourtPublicMemoBoard(gameState);
            var syncService = new WorldStateSyncService(gameState, memoBoard);
            var promptBuilder = new PromptContextBuilder();

            // Systems（注入 balance）
            var resourceSystem = new ResourceSystem(gameState, eventBus);
            var policySystem = new PolicySystem(gameState, eventBus, balance);
            var eventSystem = new EventSystem(gameState, balance);
            var turnResolutionSystem = new TurnResolutionSystem(gameState, eventBus, balance);

            // AI（仍用 Mock）
            var mockAI = new MockAIService();
            var departmentOrchestrator = new DepartmentAIOrchestrator(mockAI, promptBuilder, syncService);
            var dialogueSummaryService = new DialogueSummaryService();
            var turnSummaryOrchestrator = new TurnSummaryOrchestrator(mockAI, syncService, memoBoard);

            var sessionManager = new DepartmentSessionManager(
                roleConfigs,
                gameState,
                syncService,
                departmentOrchestrator,
                dialogueSummaryService,
                memoBoard,
                eventBus);

            // 提案执行器注册表
            var registry = new ProposalExecutorRegistry(proposalCatalog);
            registry.Register(new AdjustTaxRateExecutor(policySystem));
            registry.Register(new GrainReliefExecutor(resourceSystem, balance));
            registry.Register(new InspectionExecutor(resourceSystem, balance));
            registry.Register(new MilitaryBudgetExecutor(policySystem, balance));
            registry.Register(new IrrigationExecutor(resourceSystem, balance));

            // UseCases
            var summonUseCase = new SummonDepartmentUseCase(sessionManager);
            var sendUseCase = new SendDepartmentMessageUseCase(sessionManager);
            var adoptUseCase = new AdoptProposalUseCase(registry, memoBoard, sessionManager);
            var endTurnUseCase = new EndTurnUseCase(turnResolutionSystem, eventSystem, turnSummaryOrchestrator, memoBoard);

            Facade = new GameFacade(gameState, summonUseCase, sendUseCase, adoptUseCase, endTurnUseCase);

            _ = resourceSystem;
            Debug.Log("[GameBootstrap] 君主模拟逻辑骨架已完成初始化（已启用 balance/proposals 配置）。");
        }
    }
}