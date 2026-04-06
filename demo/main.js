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
    getStateDifference,
    saveGame,
    loadGame,
    listSaves,
    deleteSave
} = require('./world');

const LibuAgent = require('./agents/libu_agent');
const HubuAgent = require('./agents/hubu_agent');
const LibubuAgent = require('./agents/libubu_agent');
const BingbuAgent = require('./agents/bingbu_agent');
const XingbuAgent = require('./agents/xingbu_agent');
const GongbuAgent = require('./agents/gongbu_agent');
const NarrativeAgent = require('./agents/narrative_agent');
const MasterAgent = require('./agents/master_agent');
const AIService = require('./ai_service');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let gameRunning = true;
let pendingDecisions = [];
let masterAgent = null;

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
    masterAgent = new MasterAgent();
}

async function generateNarrative(worldState) {
    const events = checkEvents();
    
    // 使用主Agent生成世界线叙事
    const narrative = await masterAgent.generateWorldLine(worldState, events, pendingDecisions);
    
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
        const memorial = await agentData.agent.act(true); // 启用流式输出
        
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
    console.log(`${departments.length + 2}. 存档管理`);
    console.log(`${departments.length + 3}. 结束游戏`);
    
    return departments.length + 3;
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
    
    const decisionsSummary = pendingDecisions.map((d, i) => `${i + 1}. [${d.department}] ${d.action}`).join('\n');
    
    console.log('\n【本回合决策汇总】');
    console.log(decisionsSummary);
    
    console.log('\n正在让主Agent分析决策影响...\n');
    
    try {
        // 使用主Agent分析决策影响
        const worldState = getWorldState();
        const changes = await masterAgent.analyzeDecisionImpact(pendingDecisions, worldState);
        
        console.log('\n【主Agent决策分析】');
        console.log(JSON.stringify(changes, null, 2));
        
        console.log('\n【数值变化】');
        for (const key in changes) {
            if (updateWorldValue(key, changes[key])) {
                console.log(`  ${key}: ${changes[key] > 0 ? '+' : ''}${changes[key]}`);
            }
        }
        
        // 执行主Agent的数值调控
        const regulationChanges = masterAgent.regulateWorldValues(getWorldState());
        if (Object.keys(regulationChanges).length > 0) {
            console.log('\n【主Agent数值调控】');
            for (const key in regulationChanges) {
                if (updateWorldValue(key, regulationChanges[key])) {
                    console.log(`  ${key}: ${regulationChanges[key] > 0 ? '+' : ''}${regulationChanges[key]}`);
                }
            }
        }
    } catch (error) {
        console.error('主Agent分析失败:', error);
        console.log('  (分析失败，使用默认逻辑)');
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

// 获取用户输入
function getInput() {
    return new Promise((resolve) => {
        rl.question('> ', (answer) => {
            resolve(answer);
        });
    });
}

// 存档管理菜单
async function handleSaveLoad() {
    console.log('\n=====================================');
    console.log('存档管理');
    console.log('=====================================');
    console.log('1. 保存游戏');
    console.log('2. 加载游戏');
    console.log('3. 列出所有存档');
    console.log('4. 删除存档');
    console.log('5. 返回');
    
    const choice = await getPlayerChoice(5);
    
    switch (choice) {
        case 1:
            await handleSave();
            break;
        case 2:
            await handleLoad();
            break;
        case 3:
            handleListSaves();
            break;
        case 4:
            await handleDeleteSave();
            break;
        case 5:
            return;
    }
    
    // 递归调用，直到用户选择返回
    await handleSaveLoad();
}

// 保存游戏
async function handleSave() {
    console.log('\n请输入存档槽编号 (1-5):');
    const slot = parseInt(await getInput());
    
    if (isNaN(slot) || slot < 1 || slot > 5) {
        console.log('无效的存档槽编号');
        return;
    }
    
    console.log('请输入存档描述 (可选):');
    const description = await getInput();
    
    saveGame(slot, description);
}

// 加载游戏
async function handleLoad() {
    console.log('\n请输入存档槽编号 (1-5):');
    const slot = parseInt(await getInput());
    
    if (isNaN(slot) || slot < 1 || slot > 5) {
        console.log('无效的存档槽编号');
        return;
    }
    
    const success = loadGame(slot);
    if (success) {
        console.log('存档加载成功，返回主菜单');
        return;
    }
}

// 列出所有存档
function handleListSaves() {
    console.log('\n=====================================');
    console.log('存档列表');
    console.log('=====================================');
    
    const saves = listSaves();
    
    if (saves.length === 0) {
        console.log('没有存档');
        return;
    }
    
    saves.forEach(save => {
        console.log(`存档槽 ${save.slot}:`);
        console.log(`  描述: ${save.description}`);
        console.log(`  时间: ${new Date(save.timestamp).toLocaleString()}`);
        console.log(`  状态: 银两${save.worldState.银两}，粮食${save.worldState.粮食}，民心${save.worldState.民心}`);
        console.log('-------------------------------------');
    });
}

// 删除存档
async function handleDeleteSave() {
    console.log('\n请输入要删除的存档槽编号 (1-5):');
    const slot = parseInt(await getInput());
    
    if (isNaN(slot) || slot < 1 || slot > 5) {
        console.log('无效的存档槽编号');
        return;
    }
    
    deleteSave(slot);
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
                await handleSaveLoad();
            } else if (choice === departments.length + 3) {
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
