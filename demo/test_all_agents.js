/**
 * 测试所有六部智能体
 */

const LibuAgent = require('./agents/libu_agent');
const HubuAgent = require('./agents/hubu_agent');
const LibubuAgent = require('./agents/libubu_agent');
const BingbuAgent = require('./agents/bingbu_agent');
const XingbuAgent = require('./agents/xingbu_agent');
const GongbuAgent = require('./agents/gongbu_agent');

async function testAgent(agentName, AgentClass, testScenario) {
    console.log(`\n=====================================`);
    console.log(`测试 ${agentName}`);
    console.log(`=====================================\n`);

    const agent = new AgentClass();
    agent.observeWorld(testScenario.world);
    
    try {
        const result = await agent.act();
        console.log(`${agentName}奏折:`);
        console.log(result.report);
        console.log('\n决策选项:');
        result.options.forEach((opt, idx) => {
            console.log(`${idx + 1}. ${opt}`);
        });
        console.log(`\n✅ ${agentName} 测试成功！`);
    } catch (error) {
        console.error(`❌ ${agentName} 测试失败:`, error);
    }
}

async function testAllAgents() {
    console.log('=====================================');
    console.log('开始测试所有六部智能体');
    console.log('=====================================\n');

    // 测试场景
    const testScenarios = {
        libu: {
            world: {
                '时间': '第1年 2月',
                '银两': 120,
                '粮食': 70,
                '民心': 85
            }
        },
        hubu: {
            world: {
                '时间': '第1年 3月',
                '银两': 45,
                '粮食': 65,
                '民心': 75
            }
        },
        libubu: {
            world: {
                '时间': '第1年 4月',
                '银两': 100,
                '粮食': 80,
                '民心': 90
            }
        },
        bingbu: {
            world: {
                '时间': '第1年 5月',
                '银两': 80,
                '粮食': 70,
                '民心': 75
            }
        },
        xingbu: {
            world: {
                '时间': '第1年 6月',
                '银两': 90,
                '粮食': 60,
                '民心': 65
            }
        },
        gongbu: {
            world: {
                '时间': '第1年 7月',
                '银两': 110,
                '粮食': 85,
                '民心': 80
            }
        }
    };

    // 测试吏部
    await testAgent('吏部尚书', LibuAgent, testScenarios.libu);
    
    // 测试户部
    await testAgent('户部尚书', HubuAgent, testScenarios.hubu);
    
    // 测试礼部
    await testAgent('礼部尚书', LibubuAgent, testScenarios.libubu);
    
    // 测试兵部
    await testAgent('兵部尚书', BingbuAgent, testScenarios.bingbu);
    
    // 测试刑部
    await testAgent('刑部尚书', XingbuAgent, testScenarios.xingbu);
    
    // 测试工部
    await testAgent('工部尚书', GongbuAgent, testScenarios.gongbu);

    console.log('\n=====================================');
    console.log('所有智能体测试完成！');
    console.log('=====================================');
}

testAllAgents().catch(console.error);
