const AIService = require('./ai_service');

async function testAPI() {
    console.log('=== 测试豆包API调用 ===\n');
    
    const aiService = new AIService();
    
    try {
        // 测试基本API调用
        console.log('1. 测试基本API调用');
        const response = await aiService.processRequest({
            type: 'agent_dialogue',
            content: '你好，测试一下API调用',
            systemPrompt: '你是一个智能助手，根据用户提供的内容生成相应的回答。'
        });
        
        console.log('   响应成功:');
        console.log('   ' + response.substring(0, 200) + (response.length > 200 ? '...' : ''));
        console.log('   ✅ 基本API调用测试通过\n');
        
    } catch (error) {
        console.log('   ❌ 基本API调用测试失败:', error.message);
        console.log('   可能的原因:');
        console.log('   1. API密钥无效或过期');
        console.log('   2. 网络连接问题');
        console.log('   3. API端点配置错误');
        console.log('');
    }
    
    console.log('=== 测试完成 ===');
}

// 运行测试
testAPI().catch(console.error);
