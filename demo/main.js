/**
 * 主控游戏循环
 */

// 导入模块
const { world, runWorldTurn, checkEvents } = require('./world');
const LibuAgent = require('./agents/libu_agent');
const NarrativeAgent = require('./agents/narrative_agent');
const AIService = require('./ai_service');
const readline = require('readline');

// 创建readline接口
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 任务6：编写主循环
async function gameLoop() {
    // 初始化Agent
    const libuAgent = new LibuAgent();
    const narrativeAgent = new NarrativeAgent();
    const aiService = new AIService(); // 创建AIService实例
    
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
        libuAgent.observeWorld(updatedWorld);
        const npcData = await libuAgent.act();
        console.log('吏部尚书奏折:', npcData.report);
        
        // 3. 叙事Agent生成剧情
        console.log('\n3. 叙事Agent生成剧情');
        const narrative = await narrativeAgent.generateNarrative(updatedWorld, npcData);
        
        // 4. 打印剧情
        console.log('\n4. 剧情旁白:');
        console.log(narrative);
        
        // 5. 玩家选择
        console.log('\n5. 玩家选择');
        console.log('请选择您的决策:');
        
        // 显示AI生成的选项
        npcData.options.forEach((option, index) => {
            console.log(`${index + 1}. ${option}`);
        });
        console.log(`${npcData.options.length + 1}. 输入自定义命令`);
        
        // 获取玩家输入
        const choice = await getPlayerChoice(npcData.options.length + 1);
        
        // 6. 处理玩家选择
        console.log('\n6. 处理决策');
        if (choice === npcData.options.length + 1) {
            // 玩家选择输入自定义命令
            const customCommand = await getCustomCommand();
            console.log(`您输入的命令: ${customCommand}`);
            
            // 处理自定义命令（这里可以根据需要扩展）
            console.log('处理自定义命令...');
            // 可以将自定义命令发送给AI系统，获取响应
            const aiResponse = await handleCustomCommand(customCommand, updatedWorld, npcData, aiService);
            console.log('AI响应:', aiResponse);
            
            // 让AI处理世界状态更新
            await updateWorldState(updatedWorld, choice, customCommand, aiService);
        } else {
            // 玩家选择了预设选项
            console.log(`您选择了: ${choice} - ${npcData.options[choice - 1]}`);
            
            // 根据选择更新数值（这里可以根据需要扩展）
            await updateWorldState(updatedWorld, choice, npcData.options[choice - 1], aiService);
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
    
    // 关闭readline接口
    rl.close();
}

// 获取玩家选择
function getPlayerChoice(maxChoice) {
    return new Promise((resolve) => {
        rl.question('请输入您的选择 (1-' + maxChoice + '): ', (answer) => {
            const choice = parseInt(answer);
            if (isNaN(choice) || choice < 1 || choice > maxChoice) {
                console.log('无效的选择，请重新输入');
                resolve(getPlayerChoice(maxChoice));
            } else {
                resolve(choice);
            }
        });
    });
}

// 获取自定义命令
function getCustomCommand() {
    return new Promise((resolve) => {
        rl.question('请输入您的自定义命令: ', (answer) => {
            resolve(answer);
        });
    });
}

// 处理自定义命令
async function handleCustomCommand(command, world, npcData, aiService) {
    // 将自定义命令发送给AI系统，获取响应
    const prompt = `陛下下达了以下命令："${command}"。作为吏部尚书，请你：
1. 分析陛下命令的意图和影响
2. 预测此命令对国家各方面的影响
3. 提供具体的执行方案
4. 预测执行后对银两、粮食、民心等数值的具体变化

当前国家状态：
- 时间：${world.时间}
- 银两：${world.银两}
- 粮食：${world.粮食}
- 民心：${world.民心}

请详细分析并给出具体的数值变化预测。`;
    
    const aiResponse = await aiService.processRequest({
        type: 'agent_dialogue',
        content: prompt,
        systemPrompt: '你是吏部尚书，正在向皇帝上奏。请根据用户提供的内容生成一份正式的奏折，严格依据信息，体现忠心和直谏。',
        constraints: {
            maxTokens: 1000,
            temperature: 0.7
        }
    });
    return aiResponse;
}

// 根据选择更新世界状态
async function updateWorldState(world, choice, option, aiService) {
    // 生成一个详细的prompt，让AI来决定世界状态的变化
    const prompt = `陛下选择了以下决策："${option}"。作为吏部尚书，请你：
1. 分析此决策的影响
2. 预测执行后对国家各方面的具体影响
3. 提供具体的数值变化（银两、粮食、民心）

当前国家状态：
- 时间：${world.时间}
- 银两：${world.银两}
- 粮食：${world.粮食}
- 民心：${world.民心}

请以JSON格式返回数值变化，例如：
{"银两": -10, "粮食": 20, "民心": 5}`;
    
    try {
        const aiResponse = await aiService.processRequest({
            type: 'agent_dialogue',
            content: prompt,
            systemPrompt: '你是吏部尚书，正在向皇帝上奏。请根据用户提供的内容生成一份正式的奏折，严格依据信息，体现忠心和直谏。',
            constraints: {
                maxTokens: 500,
                temperature: 0.7
            }
        });
        console.log('AI分析结果:', aiResponse);
        
        // 尝试解析JSON
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const changes = JSON.parse(jsonMatch[0]);
            
            // 应用变化
            if (changes.银两 !== undefined) {
                world.银两 += changes.银两;
                console.log(`银两变化: ${changes.银两 > 0 ? '+' : ''}${changes.银两}`);
            }
            if (changes.粮食 !== undefined) {
                world.粮食 += changes.粮食;
                console.log(`粮食变化: ${changes.粮食 > 0 ? '+' : ''}${changes.粮食}`);
            }
            if (changes.民心 !== undefined) {
                world.民心 += changes.民心;
                console.log(`民心变化: ${changes.民心 > 0 ? '+' : ''}${changes.民心}`);
            }
        } else {
            console.log('无法解析AI返回的数值变化，使用默认逻辑');
            // 默认逻辑
            if (option.includes('赈')) {
                // 赈灾
                world.粮食 += 20;
                world.银两 -= 30;
                console.log('执行赈灾: 粮食+20，银两-30');
            } else if (option.includes('税')) {
                // 加税
                world.银两 += 20;
                world.民心 -= 10;
                console.log('执行加税: 银两+20，民心-10');
            } else if (option.includes('调查')) {
                // 调查
                world.银两 -= 10;
                console.log('执行调查: 银两-10');
            } else {
                // 默认操作
                console.log('执行操作: 无明显数值变化');
            }
        }
    } catch (error) {
        console.error('处理AI响应时出错:', error);
        // 出错时使用默认逻辑
        if (option.includes('赈')) {
            world.粮食 += 20;
            world.银两 -= 30;
            console.log('执行赈灾: 粮食+20，银两-30');
        } else if (option.includes('税')) {
            world.银两 += 20;
            world.民心 -= 10;
            console.log('执行加税: 银两+20，民心-10');
        } else if (option.includes('调查')) {
            world.银两 -= 10;
            console.log('执行调查: 银两-10');
        } else {
            console.log('执行操作: 无明显数值变化');
        }
    }
}

// 运行游戏
if (require.main === module) {
    gameLoop().catch(console.error);
}

// 导出模块
module.exports = gameLoop;