using System.Collections.Generic;
using UnityEngine;
using MonarchSim.AI.Interfaces;
using MonarchSim.AI.Sessions;
using MonarchSim.AI.Services;
using MonarchSim.Application.Facades;
using MonarchSim.Application.UseCases;
using MonarchSim.Data;
using MonarchSim.Data.Json;
using MonarchSim.Domain.Proposals;
using MonarchSim.Domain.Proposals.Executors;
using MonarchSim.Domain.State;
using MonarchSim.Domain.Systems;

namespace MonarchSim.Core
{
    /// <summary>
    /// 逻辑骨架装配入口
    /// 这版增加了：
    /// 1. RoleConfigs 暴露，供 UI 层（六部列表/私聊窗口）读取角色展示信息；
    /// 2. 可通过 remote_ai.json 在 MockAI 与 RemoteDepartmentAIService 之间切换；
    /// 3. 回合总结暂时仍使用本地 MockAIService（demo 后端当前没有回合总结接口）。
    /// </summary>
    public sealed class GameBootstrap : MonoBehaviour
    {
        public GameFacade Facade { get; private set; }
        public IReadOnlyList<DepartmentRoleConfig> RoleConfigs => _roleConfigs;

        [Header("Bootstrap")]
        [SerializeField] private bool bootstrapOnAwake = true;

        private List<DepartmentRoleConfig> _roleConfigs;

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

            _roleConfigs = DefaultConfigFactory.CreateDepartmentRoles();
            var gameState = GameStateFactory.CreateNewGameState(_roleConfigs);

            var balance = BalanceConfigProvider.LoadOrDefault();
            var proposalCatalog = ProposalCatalogProvider.LoadOrDefault();
            var remoteAiConfig = RemoteAIConfigProvider.LoadOrDefault();

            var memoBoard = new CourtPublicMemoBoard(gameState);
            var syncService = new WorldStateSyncService(gameState, memoBoard);
            var promptBuilder = new PromptContextBuilder();

            // Systems（注入 balance）
            var resourceSystem = new ResourceSystem(gameState, eventBus);
            var policySystem = new PolicySystem(gameState, eventBus, balance);
            var eventSystem = new EventSystem(gameState, balance);
            var turnResolutionSystem = new TurnResolutionSystem(gameState, eventBus, balance);

            // AI：默认 Mock；若 remote_ai.json 打开开关，则部门私聊回复改走 demo 后端。
            var mockAI = new MockAIService();

            IDepartmentAIService departmentAIService = mockAI;
            if (remoteAiConfig.UseRemoteDepartmentAI)
            {
                departmentAIService = new RemoteDepartmentAIService(
                    remoteAiConfig.BaseUrl,
                    mockAI,
                    remoteAiConfig.TimeoutSeconds);

                Debug.Log($"[GameBootstrap] Department AI mode = Remote (BaseUrl={remoteAiConfig.BaseUrl})");
            }
            else
            {
                Debug.Log("[GameBootstrap] Department AI mode = Mock");
            }

            var departmentOrchestrator = new DepartmentAIOrchestrator(departmentAIService, promptBuilder, syncService);
            var dialogueSummaryService = new DialogueSummaryService();

            // demo 当前没有回合总结接口，先继续使用本地 MockSummary。
            var turnSummaryOrchestrator = new TurnSummaryOrchestrator(mockAI, syncService, memoBoard);

            var sessionManager = new DepartmentSessionManager(
                _roleConfigs,
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
            Debug.Log("[GameBootstrap] 君主模拟逻辑骨架已完成初始化（已启用 balance/proposals 配置，部门AI支持 Mock/Remote 切换）。");
        }
    }
}
