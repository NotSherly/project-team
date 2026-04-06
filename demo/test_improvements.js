const world = require('./world');
const gameState = require('./game_state');
const ParallelScheduler = require('./scheduler');

async function testImprovements() {
    console.log('=== 测试改进后的系统功能 ===\n');
    
    // 测试1: 信息共享机制
    console.log('1. 测试信息共享机制');
    try {
        // 添加Agent决策
        world.addAgentDecision('户部', '建议增加税收以充实国库');
        world.addAgentDecision('工部', '请求拨款兴修水利工程');
        
        // 获取Agent决策
        const allDecisions = world.getAgentDecisions();
        console.log(`   已添加 ${allDecisions.length} 个Agent决策`);
        
        const hubuDecisions = world.getDepartmentDecisions('户部');
        console.log(`   户部决策数量: ${hubuDecisions.length}`);
        
        const recentDecisions = world.getRecentAgentDecisions(2);
        console.log(`   最近2个决策:`, recentDecisions.map(d => `${d.department}: ${d.decision}`));
        
        console.log('   ✅ 信息共享机制测试通过\n');
    } catch (error) {
        console.log(`   ❌ 信息共享机制测试失败: ${error.message}\n`);
    }
    
    // 测试2: 冲突解决机制
    console.log('2. 测试冲突解决机制');
    try {
        // 提交预算请求
        world.submitBudgetRequest('户部', 100, '增加税收管理费用');
        world.submitBudgetRequest('工部', 200, '兴修水利工程');
        world.submitBudgetRequest('兵部', 150, '购买军械');
        
        // 获取预算请求
        const requests = world.getBudgetRequests();
        console.log(`   已提交 ${requests.length} 个预算请求`);
        
        // 处理预算协商
        const negotiationResult = world.processBudgetNegotiation();
        console.log(`   预算协商结果:`, negotiationResult.message);
        console.log(`   分配情况:`, negotiationResult.allocations);
        
        console.log('   ✅ 冲突解决机制测试通过\n');
    } catch (error) {
        console.log(`   ❌ 冲突解决机制测试失败: ${error.message}\n`);
    }
    
    // 测试3: 上下文同步
    console.log('3. 测试上下文同步');
    try {
        // 生成上下文摘要
        const contextSummary = world.getContextSummary('high');
        console.log(`   上下文摘要长度: ${contextSummary.length} 字符`);
        console.log(`   上下文摘要包含其他部门决策: ${contextSummary.includes('其他部门决策')}`);
        console.log(`   上下文摘要包含待处理预算请求: ${contextSummary.includes('待处理预算请求')}`);
        
        console.log('   ✅ 上下文同步测试通过\n');
    } catch (error) {
        console.log(`   ❌ 上下文同步测试失败: ${error.message}\n`);
    }
    
    // 测试4: 智能协作
    console.log('4. 测试智能协作');
    try {
        // 获取协作建议
        const hubuSuggestions = world.getCollaborationSuggestions('户部');
        console.log(`   户部协作建议数量: ${hubuSuggestions.length}`);
        console.log(`   户部协作建议:`, hubuSuggestions.map(s => `${s.type}: ${s.reason}`));
        
        // 提交协作请求
        const requestId = world.submitCollaborationRequest('户部', '工部', '共同推进水利工程预算', '提供额外的财政支持');
        console.log(`   已提交协作请求 ID: ${requestId}`);
        
        // 响应协作请求
        const responseResult = world.respondToCollaborationRequest(requestId, 'accepted', '同意合作推进水利工程');
        console.log(`   协作请求响应结果: ${responseResult}`);
        
        console.log('   ✅ 智能协作测试通过\n');
    } catch (error) {
        console.log(`   ❌ 智能协作测试失败: ${error.message}\n`);
    }
    
    // 测试5: 状态管理
    console.log('5. 测试状态管理');
    try {
        // 更新状态
        gameState.updateValue('民心', 70);
        gameState.updateValue('军力', 60);
        
        // 获取状态历史
        const stateHistory = gameState.getStateHistory();
        console.log(`   状态历史记录数量: ${stateHistory.length}`);
        
        const recentHistory = gameState.getRecentStateHistory(3);
        console.log(`   最近3条状态历史:`, recentHistory.map(h => `${h.action} at ${h.timestamp}`));
        
        console.log('   ✅ 状态管理测试通过\n');
    } catch (error) {
        console.log(`   ❌ 状态管理测试失败: ${error.message}\n`);
    }
    
    // 测试6: Agent通信机制
    console.log('6. 测试Agent通信机制');
    try {
        // 发送消息
        const messageId1 = world.sendAgentMessage('户部', '工部', '关于水利工程预算的讨论', 'high');
        const messageId2 = world.sendAgentMessage('工部', '户部', '同意讨论水利工程预算', 'normal');
        console.log(`   已发送 ${2} 条消息`);
        
        // 获取部门消息
        const hubuMessages = world.getDepartmentMessages('户部');
        console.log(`   户部收到 ${hubuMessages.length} 条消息`);
        
        const unreadMessages = world.getUnreadDepartmentMessages('户部');
        console.log(`   户部未读消息数量: ${unreadMessages.length}`);
        
        // 标记消息为已读
        const markResult = world.markMessageAsRead(messageId2);
        console.log(`   标记消息为已读结果: ${markResult}`);
        
        console.log('   ✅ Agent通信机制测试通过\n');
    } catch (error) {
        console.log(`   ❌ Agent通信机制测试失败: ${error.message}\n`);
    }
    
    // 测试7: 调度器
    console.log('7. 测试调度器');
    try {
        const scheduler = new ParallelScheduler();
        
        // 测试发言顺序决策
        const event = {
            type: '财政',
            title: '国库空虚问题',
            description: '国家财政面临困难，需要各部门提出解决方案',
            keywords: ['财政', '预算', '国库']
        };
        
        const gameStateData = world.getWorldState();
        const speakingOrder = scheduler.determineSpeakingOrder(event, gameStateData);
        console.log(`   发言顺序: ${speakingOrder.join(' -> ')}`);
        
        console.log('   ✅ 调度器测试通过\n');
    } catch (error) {
        console.log(`   ❌ 调度器测试失败: ${error.message}\n`);
    }
    
    console.log('=== 所有测试完成 ===');
}

// 运行测试
testImprovements().catch(console.error);
