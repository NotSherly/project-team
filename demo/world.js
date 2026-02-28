/**
 * 世界层 - 数值系统
 */

// 任务1：定义世界初始数值
const world = {
    "时间": "第1年 1月",
    "银两": 100,
    "粮食": 25,
    "民心": 60,
};

// 任务2：世界每回合自动运行逻辑
function runWorldTurn() {
    // 粮食-10，银两+5
    world.粮食 -= 10;
    world.银两 += 5;
    
    // 更新时间
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

// 任务3：事件触发规则
function checkEvents() {
    if (world.粮食 < 30) {
        return "粮荒";
    } else if (world.民心 < 40) {
        return "民变";
    } else {
        return "太平";
    }
}

// 导出模块
module.exports = {
    world,
    runWorldTurn,
    checkEvents
};