/**
 * 世界层 - 数值系统
 * 支持六部及更多功能的完整数值和事件管理
 */

const world = {
    "时间": "第1年 1月",
    "朝代": "大明",
    "年号": "洪武",
    "季节": "春季",
    "银两": 500,
    "粮食": 300,
    "民心": 60,
    "军力": 50,
    "稳定度": 70,
    "威望": 50,
    "文化": 40,
    "工程": 30,
    "法律": 45,
    "边患": 20,
    "灾害": 10,
    "国库": {
        "税收": 100,
        "支出": 80,
        "储备": 500
    }
};

const recentEvents = [];
const playerActions = [];
const departmentMemorials = {};
const eventChain = [];
const worldStateHistory = [];

// 事件模板库
const eventTemplates = [
    {
        id: 'drought',
        title: '干旱灾害',
        description: '全国各地遭遇严重干旱，农田缺水，粮食减产。',
        department: '户部',
        trigger: {
            season: ['夏季'],
            minTemperature: 30,
            maxRainfall: 50
        },
        impact: {
            粮食: -30,
            民心: -10,
            灾害: +20
        },
        followUp: 'famine'
    },
    {
        id: 'famine',
        title: '饥荒',
        description: '由于持续干旱，粮食产量大幅减少，多地出现饥荒。',
        department: '户部',
        trigger: {
            粮食: { max: 100 },
            灾害: { min: 30 }
        },
        impact: {
            民心: -20,
            稳定度: -15,
            边患: +10
        }
    },
    {
        id: 'border_incident',
        title: '边境冲突',
        description: '边境地区发生小规模冲突，需要及时处理。',
        department: '兵部',
        trigger: {
            边患: { min: 40 },
            军力: { max: 60 }
        },
        impact: {
            军力: -5,
            边患: +15,
            稳定度: -5
        },
        followUp: 'border_war'
    },
    {
        id: 'border_war',
        title: '边境战争',
        description: '边境冲突升级为战争，需要调兵遣将。',
        department: '兵部',
        trigger: {
            边患: { min: 60 },
            军力: { max: 50 }
        },
        impact: {
            军力: -20,
            银两: -50,
            稳定度: -15,
            民心: -10
        }
    },
    {
        id: 'tax_revolt',
        title: '税收暴动',
        description: '百姓因赋税过重而发生暴动。',
        department: '户部',
        trigger: {
            民心: { max: 30 },
            银两: { min: 300 }
        },
        impact: {
            民心: -15,
            稳定度: -10,
            银两: -30
        }
    }
];

function runWorldTurn() {
    world.粮食 -= 20;
    world.银两 += 15;
    
    if (world.民心 > 80) {
        world.银两 += 10;
    }
    if (world.稳定度 > 70) {
        world.民心 += 1;
    }
    if (world.军力 > 60) {
        world.威望 += 1;
    }
    if (world.文化 > 60) {
        world.民心 += 1;
    }
    if (world.法律 > 60) {
        world.稳定度 += 1;
    }
    if (world.工程 > 50) {
        world.粮食 += 5;
    }
    
    world.民心 = Math.max(0, Math.min(100, world.民心));
    world.军力 = Math.max(0, Math.min(100, world.军力));
    world.稳定度 = Math.max(0, Math.min(100, world.稳定度));
    world.威望 = Math.max(0, Math.min(100, world.威望));
    world.文化 = Math.max(0, Math.min(100, world.文化));
    world.工程 = Math.max(0, Math.min(100, world.工程));
    world.法律 = Math.max(0, Math.min(100, world.法律));
    
    const timeParts = world.时间.split(' ');
    const year = parseInt(timeParts[0].replace('第', '').replace('年', ''));
    const month = parseInt(timeParts[1].replace('月', ''));
    
    let newMonth = month + 1;
    let newYear = year;
    
    if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
    }
    
    world.时间 = `第${newYear}年 ${newMonth}月`;
    
    // 更新季节
    const seasons = ['春季', '夏季', '秋季', '冬季'];
    world.季节 = seasons[Math.floor((newMonth - 1) / 3)];
    
    // 保存世界状态历史
    saveWorldStateHistory();
    
    return world;
}

function checkEvents() {
    const events = [];
    
    if (world.粮食 < 100) {
        events.push("粮荒");
    }
    if (world.民心 < 40) {
        events.push("民变");
    }
    if (world.银两 < 200) {
        events.push("财政危机");
    }
    if (world.军力 < 30) {
        events.push("边关告急");
    }
    if (world.稳定度 < 40) {
        events.push("社会动荡");
    }
    if (world.法律 < 30) {
        events.push("法治混乱");
    }
    if (world.文化 < 30) {
        events.push("文教衰落");
    }
    if (world.工程 < 20) {
        events.push("基础设施破败");
    }
    if (world.边患 > 60) {
        events.push("边患严重");
    }
    if (world.灾害 > 50) {
        events.push("灾害频发");
    }
    
    // 检查事件模板触发条件
    const triggeredEvents = checkEventTemplates();
    events.push(...triggeredEvents.map(event => event.title));
    
    if (events.length === 0) {
        events.push("太平");
    }
    
    return events;
}

function checkEventTemplates() {
    const triggeredEvents = [];
    
    for (const template of eventTemplates) {
        if (checkEventTrigger(template)) {
            triggeredEvents.push(template);
            processEvent(template);
        }
    }
    
    return triggeredEvents;
}

function checkEventTrigger(template) {
    const trigger = template.trigger;
    
    // 检查季节条件
    if (trigger.season && !trigger.season.includes(world.季节)) {
        return false;
    }
    
    // 检查数值条件
    for (const [key, condition] of Object.entries(trigger)) {
        if (typeof condition === 'object' && condition !== null) {
            if (condition.min !== undefined && world[key] < condition.min) {
                return false;
            }
            if (condition.max !== undefined && world[key] > condition.max) {
                return false;
            }
        }
    }
    
    return true;
}

function processEvent(event) {
    // 应用事件影响
    for (const [key, value] of Object.entries(event.impact)) {
        updateWorldValue(key, value);
    }
    
    // 添加到最近事件
    addRecentEvent({
        title: event.title,
        description: event.description,
        department: event.department
    });
    
    // 添加到事件链
    eventChain.push({
        eventId: event.id,
        timestamp: new Date().toISOString(),
        impact: event.impact
    });
    
    // 处理后续事件
    if (event.followUp) {
        const followUpEvent = eventTemplates.find(e => e.id === event.followUp);
        if (followUpEvent) {
            // 在下一回合检查后续事件
            setTimeout(() => {
                if (checkEventTrigger(followUpEvent)) {
                    processEvent(followUpEvent);
                }
            }, 100);
        }
    }
}

function addRecentEvent(event) {
    recentEvents.push({
        title: event.title || event,
        description: event.description || '',
        department: event.department || '未知',
        timestamp: new Date().toISOString()
    });
    
    if (recentEvents.length > 10) {
        recentEvents.shift();
    }
}

function addPlayerAction(action) {
    playerActions.push({
        type: action.type || '决策',
        description: action.description || action,
        timestamp: new Date().toISOString()
    });
    
    if (playerActions.length > 10) {
        playerActions.shift();
    }
}

function setDepartmentMemorial(department, memorial) {
    departmentMemorials[department] = {
        report: memorial.report,
        options: memorial.options,
        timestamp: new Date().toISOString()
    };
}

function getDepartmentMemorial(department) {
    return departmentMemorials[department] || null;
}

function getAllDepartmentMemorials() {
    return departmentMemorials;
}

function clearDepartmentMemorials() {
    for (const key in departmentMemorials) {
        delete departmentMemorials[key];
    }
}

function updateWorldValue(key, value) {
    if (world.hasOwnProperty(key)) {
        world[key] += value;
        if (key === '民心' || key === '军力' || key === '稳定度' || key === '威望' || key === '文化' || key === '工程' || key === '法律' || key === '边患' || key === '灾害') {
            world[key] = Math.max(0, Math.min(100, world[key]));
        } else {
            world[key] = Math.max(0, world[key]);
        }
        return true;
    } else if (key.startsWith('国库.')) {
        const subKey = key.split('.')[1];
        if (world.国库 && world.国库.hasOwnProperty(subKey)) {
            world.国库[subKey] += value;
            world.国库[subKey] = Math.max(0, world.国库[subKey]);
            return true;
        }
    }
    return false;
}

function getWorldState() {
    return { ...world };
}

function getRecentEvents() {
    return [...recentEvents];
}

function getPlayerActions() {
    return [...playerActions];
}

function checkGameEnd() {
    if (world.银两 <= 0 || world.粮食 <= 0 || world.民心 <= 0) {
        return { ended: true, reason: "国家崩溃" };
    }
    if (world.稳定度 <= 0) {
        return { ended: true, reason: "政权覆灭" };
    }
    return { ended: false, reason: null };
}

function getDepartmentList() {
    return [
        { id: 'libu', name: '吏部', description: '选拔任免官员、考核官员政绩、统筹六部协作' },
        { id: 'hubu', name: '户部', description: '统计人口田亩、征收赋税、管理国家财政' },
        { id: 'libubu', name: '礼部', description: '掌管典章制度、祭祀礼仪、学校教育、科举考试' },
        { id: 'bingbu', name: '兵部', description: '选用武官及兵籍管理、管理军械装备、制定军事战略' },
        { id: 'xingbu', name: '刑部', description: '主管全国刑罚政令、审核刑名案件、监督司法审判' },
        { id: 'gongbu', name: '工部', description: '掌管各项工程建设、管理工匠、兴修水利设施' }
    ];
}

function saveWorldStateHistory() {
    const stateSnapshot = {
        timestamp: new Date().toISOString(),
        time: world.时间,
        season: world.季节,
        keyValues: {
            银两: world.银两,
            粮食: world.粮食,
            民心: world.民心,
            军力: world.军力,
            稳定度: world.稳定度,
            威望: world.威望,
            文化: world.文化,
            工程: world.工程,
            法律: world.法律,
            边患: world.边患,
            灾害: world.灾害
        },
        treasury: { ...world.国库 },
        recentEvents: recentEvents.slice(-5), // 只保存最近5个事件
        playerActions: playerActions.slice(-3) // 只保存最近3个玩家行动
    };
    
    worldStateHistory.push(stateSnapshot);
    
    // 限制历史记录数量，保持在50条以内
    if (worldStateHistory.length > 50) {
        worldStateHistory.shift();
    }
}

function compressContext(maxTokens = 1000) {
    // 计算当前上下文大小
    const currentContext = generateContextSummary();
    let currentSize = estimateTokenCount(currentContext);
    
    if (currentSize <= maxTokens) {
        return currentContext;
    }
    
    // 压缩策略：减少历史事件和行动的数量
    let compressedEvents = recentEvents.slice(-3);
    let compressedActions = playerActions.slice(-2);
    
    let compressedContext = generateContextSummary(compressedEvents, compressedActions);
    let compressedSize = estimateTokenCount(compressedContext);
    
    if (compressedSize > maxTokens) {
        // 进一步压缩，只保留最重要的信息
        compressedEvents = recentEvents.slice(-1);
        compressedActions = [];
        compressedContext = generateContextSummary(compressedEvents, compressedActions);
    }
    
    return compressedContext;
}

function generateContextSummary(events = recentEvents, actions = playerActions) {
    let summary = `当前状态：
`;
    summary += `朝代：${world.朝代}，年号：${world.年号}，时间：${world.时间}，季节：${world.季节}
`;
    summary += `银两：${world.银两}，粮食：${world.粮食}，民心：${world.民心}，军力：${world.军力}
`;
    summary += `稳定度：${world.稳定度}，威望：${world.威望}，文化：${world.文化}，工程：${world.工程}
`;
    summary += `法律：${world.法律}，边患：${world.边患}，灾害：${world.灾害}
`;
    summary += `国库：税收${world.国库.税收}，支出${world.国库.支出}，储备${world.国库.储备}
`;
    
    if (events.length > 0) {
        summary += `
最近事件：
`;
        events.forEach((event, index) => {
            summary += `${index + 1}. ${event.title}: ${event.description.substring(0, 50)}${event.description.length > 50 ? '...' : ''}
`;
        });
    }
    
    if (actions.length > 0) {
        summary += `
玩家行动：
`;
        actions.forEach((action, index) => {
            summary += `${index + 1}. ${action.type}: ${action.description.substring(0, 50)}${action.description.length > 50 ? '...' : ''}
`;
        });
    }
    
    return summary;
}

function estimateTokenCount(text) {
    // 简单的Token估算：每个汉字、标点和空格都算一个Token
    return text.length;
}

function getContextSummary(importanceLevel = 'high') {
    switch (importanceLevel) {
        case 'low':
            return generateContextSummary(recentEvents.slice(-1), []);
        case 'medium':
            return generateContextSummary(recentEvents.slice(-3), playerActions.slice(-2));
        case 'high':
        default:
            return generateContextSummary();
    }
}

function getWorldStateHistory() {
    return [...worldStateHistory];
}

function getWorldStateAt(index) {
    if (index >= 0 && index < worldStateHistory.length) {
        return worldStateHistory[index];
    }
    return null;
}

function rewindToState(index) {
    const targetState = getWorldStateAt(index);
    if (!targetState) {
        return false;
    }
    
    // 恢复世界状态
    world.时间 = targetState.time;
    world.季节 = targetState.season;
    
    // 恢复关键数值
    for (const [key, value] of Object.entries(targetState.keyValues)) {
        world[key] = value;
    }
    
    // 恢复国库状态
    world.国库 = { ...targetState.treasury };
    
    // 清空当前的事件和行动记录
    recentEvents.length = 0;
    playerActions.length = 0;
    
    // 恢复最近事件和行动
    if (targetState.recentEvents) {
        targetState.recentEvents.forEach(event => {
            recentEvents.push(event);
        });
    }
    
    if (targetState.playerActions) {
        targetState.playerActions.forEach(action => {
            playerActions.push(action);
        });
    }
    
    // 清空事件链
    eventChain.length = 0;
    
    // 截断历史记录到目标状态
    worldStateHistory.splice(index + 1);
    
    return true;
}

function compareWorldStates(state1, state2) {
    const differences = {};
    
    // 比较关键数值
    for (const key in state1.keyValues) {
        if (state1.keyValues[key] !== state2.keyValues[key]) {
            differences[key] = {
                before: state1.keyValues[key],
                after: state2.keyValues[key],
                change: state2.keyValues[key] - state1.keyValues[key]
            };
        }
    }
    
    // 比较国库状态
    for (const key in state1.treasury) {
        if (state1.treasury[key] !== state2.treasury[key]) {
            differences[`国库.${key}`] = {
                before: state1.treasury[key],
                after: state2.treasury[key],
                change: state2.treasury[key] - state1.treasury[key]
            };
        }
    }
    
    return differences;
}

function getStateDifference(index1, index2) {
    const state1 = getWorldStateAt(index1);
    const state2 = getWorldStateAt(index2);
    
    if (!state1 || !state2) {
        return null;
    }
    
    return compareWorldStates(state1, state2);
}

module.exports = {
    world,
    runWorldTurn,
    checkEvents,
    checkEventTemplates,
    processEvent,
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
    eventChain,
    eventTemplates,
    worldStateHistory,
    saveWorldStateHistory,
    compressContext,
    generateContextSummary,
    getContextSummary,
    getWorldStateHistory,
    getWorldStateAt,
    rewindToState,
    compareWorldStates,
    getStateDifference
};
