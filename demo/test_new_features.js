/**
 * 测试新功能
 * 测试世界状态结构、事件系统、上下文管理和版本控制
 */

const {
    world,
    runWorldTurn,
    checkEvents,
    getWorldState,
    getContextSummary,
    compressContext,
    getWorldStateHistory,
    rewindToState,
    getStateDifference
} = require('./world');

console.log('=== 测试新功能 ===\n');

// 测试1：世界状态结构
console.log('1. 测试世界状态结构:');
console.log('当前世界状态:', getWorldState());
console.log('朝代:', world.朝代);
console.log('年号:', world.年号);
console.log('季节:', world.季节);
console.log('边患:', world.边患);
console.log('灾害:', world.灾害);
console.log('国库:', world.国库);
console.log('');

// 测试2：运行回合并检查状态变化
console.log('2. 测试运行回合:');
console.log('运行前时间:', world.时间);
console.log('运行前季节:', world.季节);

const newState = runWorldTurn();
console.log('运行后时间:', newState.时间);
console.log('运行后季节:', newState.季节);
console.log('');

// 测试3：检查事件
console.log('3. 测试事件系统:');
const events = checkEvents();
console.log('当前事件:', events);
console.log('');

// 测试4：上下文管理
console.log('4. 测试上下文管理:');
const highContext = getContextSummary('high');
console.log('高重要性上下文 (长度:', highContext.length, '):');
console.log(highContext.substring(0, 200) + '...');
console.log('');

const mediumContext = getContextSummary('medium');
console.log('中等重要性上下文 (长度:', mediumContext.length, '):');
console.log(mediumContext.substring(0, 200) + '...');
console.log('');

const compressedContext = compressContext(500);
console.log('压缩上下文 (长度:', compressedContext.length, '):');
console.log(compressedContext.substring(0, 200) + '...');
console.log('');

// 测试5：版本管理
console.log('5. 测试版本管理:');
const history = getWorldStateHistory();
console.log('历史状态数量:', history.length);
console.log('');

if (history.length > 1) {
    console.log('测试状态比较:');
    const difference = getStateDifference(0, history.length - 1);
    console.log('状态变化:', difference);
    console.log('');
    
    console.log('测试时间回溯:');
    console.log('回溯前时间:', world.时间);
    const success = rewindToState(0);
    console.log('回溯成功:', success);
    console.log('回溯后时间:', world.时间);
}

console.log('\n=== 测试完成 ===');
