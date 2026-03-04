/**
 * 世界层 - 数值系统
 * 支持六部及更多功能的完整数值和事件管理
 */

const world = {
    "时间": "第1年 1月",
    "银两": 500,
    "粮食": 300,
    "民心": 60,
    "军力": 50,
    "稳定度": 70,
    "威望": 50,
    "文化": 40,
    "工程": 30,
    "法律": 45
};

const recentEvents = [];
const playerActions = [];
const departmentMemorials = {};

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
    
    if (events.length === 0) {
        events.push("太平");
    }
    
    return events;
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
        if (key === '民心' || key === '军力' || key === '稳定度' || key === '威望' || key === '文化' || key === '工程' || key === '法律') {
            world[key] = Math.max(0, Math.min(100, world[key]));
        } else {
            world[key] = Math.max(0, world[key]);
        }
        return true;
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

module.exports = {
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
    getDepartmentList
};
