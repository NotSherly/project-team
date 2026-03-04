/**
 * 测试Prompt功能
 * 测试世界观生成、背景差异化和历史连贯性校验
 */

const AIService = require('./ai_service');

console.log('=== 测试Prompt功能 ===\n');

const aiService = new AIService();

// 测试1：世界观生成System Prompt
console.log('1. 测试世界观生成System Prompt:');
const worldviewPrompt = aiService.generateWorldviewPrompt('大明', '洪武');
console.log('生成的世界观Prompt (前300字):');
console.log(worldviewPrompt.substring(0, 300) + '...');
console.log('');

// 测试2：背景差异化Prompt
console.log('2. 测试背景差异化Prompt:');
const gameState = {
    '朝代': '大明',
    '年号': '洪武',
    '时间': '第1年 1月',
    '季节': '春季',
    '边患': 20,
    '民心': 60,
    '稳定度': 70
};

const capitalPrompt = aiService.generateContextPrompt('京城', gameState);
console.log('京城背景Prompt:');
console.log(capitalPrompt);
console.log('');

const localPrompt = aiService.generateContextPrompt('地方', gameState);
console.log('地方背景Prompt:');
console.log(localPrompt);
console.log('');

const borderPrompt = aiService.generateContextPrompt('边关', gameState);
console.log('边关背景Prompt:');
console.log(borderPrompt);
console.log('');

// 测试3：历史连贯性校验
console.log('3. 测试历史连贯性校验:');
const testContent = '洪武年间，皇帝朱元璋在紫禁城召开朝会，与内阁大臣商议国家大事。此时西方传教士带来了先进的火器技术，大大增强了明朝的军事实力。';

const historicalContext = {
    'dynasty': '大明',
    'era': '洪武',
    'time': '第1年'
};

async function testHistoricalValidation() {
    try {
        const result = await aiService.validateHistoricalConsistency(testContent, historicalContext);
        console.log('历史连贯性校验结果:');
        console.log(result);
    } catch (error) {
        console.error('测试历史连贯性校验失败:', error);
    }
}

testHistoricalValidation().then(() => {
    console.log('\n=== 测试完成 ===');
});
