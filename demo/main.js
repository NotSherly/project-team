/**
 * 主控游戏循环
 */

// 导入模块
const { world, runWorldTurn, checkEvents } = require('./world');
const NpcAgent = require('./npc_agent');
const NarrativeAgent = require('./narrative_agent');

// 任务6：编写主循环
async function gameLoop() {
    // 初始化Agent
    const npcAgent = new NpcAgent();
    const narrativeAgent = new NarrativeAgent();
    
    // 游戏主循环
    while (true) {
        console.log('\n=====================================');
        console.log('回合开始');
        console.log('=====================================');
        
        // 1. 世界运行一回合
        console.log('\n1. 世界运行一回合');
        const updatedWorld = runWorldTurn();
        console.log('世界状态:', updatedWorld);
        
        // 检查事件
        const event = checkEvents();
        console.log('事件:', event);
        
        // 2. 吏部Agent观察→思考→行动
        console.log('\n2. 吏部Agent观察→思考→行动');
        npcAgent.observeWorld(updatedWorld);
        const npcReport = await npcAgent.act();
        console.log('吏部尚书奏折:', npcReport);
        
        // 3. 叙事Agent生成剧情
        console.log('\n3. 叙事Agent生成剧情');
        const narrative = await narrativeAgent.generateNarrative(updatedWorld, npcReport);
        
        // 4. 打印剧情
        console.log('\n4. 剧情旁白:');
        console.log(narrative);
        
        // 5. 玩家选择（赈灾/加税）
        console.log('\n5. 玩家选择');
        console.log('请选择您的决策:');
        console.log('1. 赈灾（粮食+20，银两-30）');
        console.log('2. 加税（银两+20，民心-10）');
        console.log('3. 什么都不做');
        
        // 这里使用模拟输入，实际游戏中可以使用readline模块获取用户输入
        const choice = 1; // 模拟选择赈灾
        console.log(`您选择了: ${choice}`);
        
        // 6. 修改数值
        console.log('\n6. 修改数值');
        switch (choice) {
            case 1:
                // 赈灾（粮食+20，银两-30）
                updatedWorld.粮食 += 20;
                updatedWorld.银两 -= 30;
                console.log('执行赈灾: 粮食+20，银两-30');
                break;
            case 2:
                // 加税（银两+20，民心-10）
                updatedWorld.银两 += 20;
                updatedWorld.民心 -= 10;
                console.log('执行加税: 银两+20，民心-10');
                break;
            case 3:
                // 什么都不做
                console.log('未执行任何操作');
                break;
        }
        
        console.log('更新后的世界状态:', updatedWorld);
        
        // 7. 循环
        console.log('\n=====================================');
        console.log('回合结束');
        console.log('=====================================');
        
        // 模拟延迟，方便观察
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 这里可以添加游戏结束条件
        if (updatedWorld.银两 < 0 || updatedWorld.粮食 < 0 || updatedWorld.民心 < 0) {
            console.log('\n游戏结束！');
            break;
        }
    }
}

// 运行游戏
if (require.main === module) {
    gameLoop().catch(console.error);
}

// 导出模块
module.exports = gameLoop;