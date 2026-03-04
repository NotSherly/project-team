/**
 * 主控游戏循环
 * 实现完整的六部交互系统
 */

const { 
    world, 
    runWorldTurn, 
    checkEvents, 
    addRecentEvent, 
    addPlayerAction,
    setDepartmentMemorial,
    getDepartmentMemorial,
    getAllDepartmentMemorials,
    clearDepartmentMemorials,
    updateWorldValue,
    getWorldState,
    getRecentEvents,
    getPlayerActions,
    checkGameEnd,
    getDepartmentList,
    getContextSummary,
    compressContext,
    getWorldStateHistory,
    rewindToState,
    getStateDifference
} = require('./world');

const LibuAgent = require('./agents/libu_agent');
const HubuAgent = require('./agents/hubu_agent');
const LibubuAgent = require('./agents/libubu_agent');
const BingbuAgent = require('./agents/bingbu_agent');
const XingbuAgent = require('./agents/xingbu_agent');
const GongbuAgent = require('./agents/gongbu_agent');
const NarrativeAgent = require('./agents/narrative_agent');
const AIService = require('./ai_service');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let gameRunning = true;
let pendingDecisions = [];

const agents = {
    'libu': { agent: null, class: LibuAgent, name: '吏部尚书' },
    'hubu': { agent: null, class: HubuAgent, name: '户部尚书' },
    'libubu': { agent: null, class: LibubuAgent, name: '礼部尚书' },
    'bingbu': { agent: null, class: BingbuAgent, name: '兵部尚书' },
    'xingbu': { agent: null, class: XingbuAgent, name: '刑部尚书' },
    'gongbu': { agent: null, class: GongbuAgent, name: '工部尚书' }
};

function initAgents() {
    for (const key in agents) {
        agents[key].agent = new agents[key].class();
    }
}

async function generateNarrative(worldState) {
    const narrativeAgent = new NarrativeAgent();
    const events = checkEvents();
    
    // 使用上下文摘要
    const contextSummary = getContextSummary('medium');
    
    const narrative = await narrativeAgent.generateNarrative(worldState, {
        report: `当前事件：${events.join('、')}`,
        options: [],
        context: contextSummary
    });
    
    return narrative;
}

async function generateAllMemorials(worldState) {
    console.log('\n=====================================');
    console.log('六部尚书上奏');
    console.log('=====================================');
    
    clearDepartmentMemorials();
    
    for (const key in agents) {
        const agentData = agents[key];
        console.log(`\n[${agentData.name}] 正在上奏...`);
        
        agentData.agent.observeWorld(worldState);
        const memorial = await agentData.agent.act();
        
        setDepartmentMemorial(key, memorial);
        
        console.log(`\n${agentData.name}奏折摘要:`);
        const reportLines = memorial.report.split('\n').slice(0, 5);
        console.log(reportLines.join('\n'));
        if (memorial.report.split('\n').length > 5) {
            console.log('...(奏折内容较长，可与该部详细交流)');
        }
        
        console.log(`\n决策选项预览:`);
        memorial.options.slice(0, 2).forEach((opt, idx) => {
            console.log(`  ${idx + 1}. ${opt.substring(0, 50)}${opt.length > 50 ? '...' : ''}`);
        });
        if (memorial.options.length > 2) {
            console.log(`  ...(共${memorial.options.length}个选项)`);
        }
    }
}

async function displayDepartmentSelection() {
    const departments = getDepartmentList();
    
    console.log('\n=====================================');
    console.log('六部选择');
    console.log('=====================================');
    
    if (pendingDecisions.length > 0) {
        console.log('\n【已选择的决策】');
        pendingDecisions.forEach((decision, index) => {
            console.log(`  ${index + 1}. [${decision.department}] ${decision.action.substring(0, 40)}${decision.action.length > 40 ? '...' : ''}`);
        });
        console.log('');
    }
    
    console.log('请选择要交流的部门：\n');
    
    departments.forEach((dept, index) => {
        console.log(`${index + 1}. ${dept.name} - ${dept.description}`);
    });
    
    console.log(`\n${departments.length + 1}. 进入下一回合（执行所有决策）`);
    console.log(`${departments.length + 2}. 结束游戏`);
    
    return departments.length + 2;
}

async function interactWithDepartment(departmentId) {
    const agentData = agents[departmentId];
    const memorial = getDepartmentMemorial(departmentId);
    
    if (!memorial) {
        console.log('该部门暂无奏折。');
        return;
    }
    
    console.log(`\n=====================================`);
    console.log(`${agentData.name}详细奏折`);
    console.log('=====================================\n');
    
    console.log(memorial.report);
    
    console.log('\n-------------------------------------');
    console.log('决策选项：');
    console.log('-------------------------------------');
    
    memorial.options.forEach((opt, idx) => {
        console.log(`${idx + 1}. ${opt}`);
    });
    
    console.log(`${memorial.options.length + 1}. 输入自定义命令`);
    console.log(`${memorial.options.length + 2}. 返回部门选择（不选择决策）`);
    
    const choice = await getPlayerChoice(memorial.options.length + 2);
    
    if (choice === memorial.options.length + 2) {
        return;
    }
    
    let selectedAction = '';
    
    if (choice === memorial.options.length + 1) {
        const customCommand = await getCustomCommand();
        selectedAction = customCommand;
    } else {
        selectedAction = memorial.options[choice - 1];
    }
    
    pendingDecisions.push({
        department: agentData.name,
        departmentId: departmentId,
        action: selectedAction,
        isCustom: choice === memorial.options.length + 1
    });
    
    console.log(`\n【决策已缓存】[${agentData.name}] ${selectedAction.substring(0, 50)}${selectedAction.length > 50 ? '...' : ''}`);
    console.log('您可以继续选择其他部门，或选择"进入下一回合"执行所有决策。');
}

async function executeAllDecisions() {
    if (pendingDecisions.length === 0) {
        console.log('\n没有待执行的决策，直接进入下一回合。');
        return;
    }
    
    console.log('\n=====================================');
    console.log('执行决策');
    console.log('=====================================');
    
    const aiService = new AIService();
    
    const decisionsSummary = pendingDecisions.map((d, i) => `${i + 1}. [${d.department}] ${d.action}`).join('\n');
    
    console.log('\n【本回合决策汇总】');
    console.log(decisionsSummary);
    
    console.log('\n正在让六部尚书分析决策影响...\n');
    
    // 使用压缩上下文
    const compressedContext = compressContext(800);
    
    const prompt = `陛下本回合做出了以下决策：

${decisionsSummary}

${compressedContext}

请综合分析这些决策对国家的影响，并以JSON格式返回各项数值的变化。考虑决策之间的相互影响和综合效果。

请以JSON格式返回数值变化，例如：
{"银两": -10, "粮食": 20, "民心": 5, "军力": 0, "稳定度": 5, "威望": 3, "文化": 0, "工程": 5, "法律": 0}`;

    try {
        const aiResponse = await aiService.processRequest({
            type: 'agent_dialogue',
            content: prompt,
            systemPrompt: '你是朝廷的决策顾问，负责综合分析皇帝的各项决策对国家的影响。请根据决策内容合理预测数值变化，考虑决策之间的相互影响。',
            constraints: {
                maxTokens: 800,
                temperature: 0.7
            }
        });
        
        console.log('【AI决策分析】');
        console.log(aiResponse);
        
        const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
            try {
                const changes = JSON.parse(jsonMatch[0]);
                
                console.log('\n【数值变化】');
                for (const key in changes) {
                    if (updateWorldValue(key, changes[key])) {
                        console.log(`  ${key}: ${changes[key] > 0 ? '+' : ''}${changes[key]}`);
                    }
                }
            } catch (parseError) {
                console.log('  (数值变化解析失败，使用默认逻辑)');
                applyDefaultDecisions();
            }
        } else {
            applyDefaultDecisions();
        }
        
    } catch (error) {
        console.error('分析决策影响时出错:', error);
        applyDefaultDecisions();
    }
    
    pendingDecisions.forEach(decision => {
        addPlayerAction({ 
            type: decision.isCustom ? '自定义命令' : '执行建议', 
            description: `[${decision.department}] ${decision.action}` 
        });
        addRecentEvent({
            title: `执行${decision.department}决策`,
            description: decision.action,
            department: decision.department
        });
    });
    
    pendingDecisions = [];
    
    console.log('\n【当前国家状态】');
    console.log(getWorldState());
}

function applyDefaultDecisions() {
    console.log('\n【数值变化（默认逻辑）】');
    
    pendingDecisions.forEach(decision => {
        const action = decision.action;
        
        if (action.includes('赈') || action.includes('粮')) {
            updateWorldValue('粮食', 20);
            updateWorldValue('银两', -30);
            console.log(`  [${decision.department}] 粮食: +20, 银两: -30`);
        } else if (action.includes('税') || action.includes('财政')) {
            updateWorldValue('银两', 20);
            updateWorldValue('民心', -10);
            console.log(`  [${decision.department}] 银两: +20, 民心: -10`);
        } else if (action.includes('军') || action.includes('兵')) {
            updateWorldValue('军力', 15);
            updateWorldValue('银两', -20);
            console.log(`  [${decision.department}] 军力: +15, 银两: -20`);
        } else if (action.includes('法') || action.includes('刑')) {
            updateWorldValue('法律', 10);
            updateWorldValue('民心', 5);
            console.log(`  [${decision.department}] 法律: +10, 民心: +5`);
        } else if (action.includes('工') || action.includes('水利')) {
            updateWorldValue('工程', 15);
            updateWorldValue('银两', -25);
            console.log(`  [${decision.department}] 工程: +15, 银两: -25`);
        } else if (action.includes('礼') || action.includes('教育')) {
            updateWorldValue('文化', 10);
            updateWorldValue('民心', 5);
            console.log(`  [${decision.department}] 文化: +10, 民心: +5`);
        } else if (action.includes('官') || action.includes('吏')) {
            updateWorldValue('稳定度', 10);
            updateWorldValue('银两', -15);
            console.log(`  [${decision.department}] 稳定度: +10, 银两: -15`);
        } else {
            updateWorldValue('民心', 3);
            console.log(`  [${decision.department}] 民心: +3`);
        }
    });
}

function getPlayerChoice(maxChoice) {
    return new Promise((resolve) => {
        rl.question(`\n请输入您的选择 (1-${maxChoice}): `, (answer) => {
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

function getCustomCommand() {
    return new Promise((resolve) => {
        rl.question('请输入您的自定义命令: ', (answer) => {
            resolve(answer);
        });
    });
}

async function confirmEndGame() {
    return new Promise((resolve) => {
        rl.question('\n确定要结束游戏吗？(y/n): ', (answer) => {
            resolve(answer.toLowerCase() === 'y');
        });
    });
}

async function gameLoop() {
    initAgents();
    const aiService = new AIService();
    
    console.log('\n=====================================');
    console.log('天命：AI君主模拟器');
    console.log('=====================================');
    console.log('欢迎陛下！您将扮演一位古代君主，与六部尚书互动，治理国家。');
    console.log('提示：您可以在每回合与多个部门交互，选择多个决策后统一执行。');
    
    while (gameRunning) {
        console.log('\n=====================================');
        console.log(`回合开始 - ${world.时间}`);
        console.log('=====================================');
        
        const worldState = runWorldTurn();
        console.log('\n世界状态:');
        console.log(worldState);
        
        const events = checkEvents();
        console.log('\n当前事件:', events.join('、'));
        
        const gameEndCheck = checkGameEnd();
        if (gameEndCheck.ended) {
            console.log(`\n游戏结束！原因：${gameEndCheck.reason}`);
            gameRunning = false;
            break;
        }
        
        console.log('\n-------------------------------------');
        console.log('生成叙事...');
        const narrative = await generateNarrative(worldState);
        console.log('\n【史官叙事】');
        console.log(narrative);
        
        await generateAllMemorials(worldState);
        
        pendingDecisions = [];
        
        let inDepartmentPhase = true;
        while (inDepartmentPhase && gameRunning) {
            const maxChoice = await displayDepartmentSelection();
            const choice = await getPlayerChoice(maxChoice);
            
            const departments = getDepartmentList();
            
            if (choice === departments.length + 1) {
                await executeAllDecisions();
                inDepartmentPhase = false;
            } else if (choice === departments.length + 2) {
                const confirmed = await confirmEndGame();
                if (confirmed) {
                    console.log('\n感谢您的游玩！游戏结束。');
                    gameRunning = false;
                    inDepartmentPhase = false;
                }
            } else if (choice >= 1 && choice <= departments.length) {
                const selectedDept = departments[choice - 1];
                await interactWithDepartment(selectedDept.id);
            }
        }
        
        console.log('\n=====================================');
        console.log('回合结束');
        console.log('=====================================');
    }
    
    rl.close();
}

if (require.main === module) {
    gameLoop().catch(console.error);
}

module.exports = gameLoop;
