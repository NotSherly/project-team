/**
 * AI服务类 - 封装LLM调用、缓存管理等通用功能
 */

class AIService {
    constructor(apiKey) {
        this.apiKey = apiKey || 'e5d3732f-691b-4eae-86c4-2cc7f99a36cf';
        this.cache = new Map();
    }
    
    // 生成缓存键
    generateCacheKey(request) {
        return JSON.stringify(request);
    }
    
    // 计算TTL
    calculateTTL(type) {
        const ttlMap = {
            'agent_dialogue': 3600000, // 1小时
            'creative_narrative': 7200000, // 2小时
            'event_generation': 86400000, // 24小时
            'default': 3600000 // 1小时
        };
        return ttlMap[type] || ttlMap.default;
    }
    
    // 核心处理方法
    async processRequest(request) {
        const cacheKey = this.generateCacheKey(request);
        
        // 检查缓存
        if (this.cache.has(cacheKey)) {
            console.log(`[LLM] 从缓存获取响应...`);
            return this.cache.get(cacheKey);
        }

        // 调用AI引擎
        const response = await this.generate(request);
        
        // 缓存结果
        this.cache.set(cacheKey, response);
        
        return response;
    }
    
    // 调用AI引擎
    async generate(request) {
        try {
            console.log(`[LLM] 生成内容中...`);
            console.log(`[LLM] Prompt: ${request.content}`);
            
            // 豆包API调用
            const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'doubao-1-5-pro-32k-250115',
                    messages: [
                        {"role": "system","content": request.systemPrompt || "你是一个智能助手，根据用户提供的内容生成相应的回答。"},
                        {"role": "user","content": request.content}
                    ],
                    temperature: request.constraints?.temperature || 0.7,
                    max_tokens: request.constraints?.maxTokens || 1000
                })
            });
            
            const data = await response.json();
            
            if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
                return data.choices[0].message.content;
            } else {
                console.error('豆包API 响应格式错误:', data);
                return this.getFallbackResponse(request);
            }
        } catch (error) {
            console.error('豆包API 调用失败:', error);
            return this.getFallbackResponse(request);
        }
    }
    
    // 获取 fallback 响应
    getFallbackResponse(request) {
        switch (request.type) {
            case 'agent_dialogue':
                return '臣明白。';
            case 'creative_narrative':
                return '当前国家局势稳定，皇帝治理有方，国泰民安。';
            case 'event_generation':
                return JSON.stringify([{
                    title: "AI生成事件",
                    description: "系统通过AI生成的事件",
                    department: "未知",
                    options: [
                        {"text": "查看详情", "description": "查看事件的详细信息"},
                        {"text": "忽略", "description": "暂时忽略此事件"}
                    ],
                    impact: {}
                }]);
            default:
                return '已收到您的请求。';
        }
    }
    
    // 生成对话响应
    async generateDialogueResponse(params) {
        const { character, dialogueContext, lastMessage, objectives, constraints } = params;

        const prompt = `
角色扮演：${character.name}（${character.role}）

【人物设定】
姓名：${character.name}
身份：${character.role}，属于${character.faction || '中立'}派系
性格：${character.personality?.traits?.join('、') || '谨慎、忠诚'}
当前情绪：平静
与对话者的关系：一般

【对话背景】
地点：${dialogueContext.location || '皇宫'}
时间：${new Date().toLocaleTimeString()}

【对话历史】
${dialogueContext.history?.map((entry) => `${entry.speakerId === 'player' ? '玩家' : character.name}: ${entry.message}`).join('\n') || ''}

【玩家最新发言】
${lastMessage}

【对话目标】
${objectives.join('；')}

请以${character.name}的身份回复，考虑：
1. 人物性格和立场
2. 与对话者的关系
3. 对话场景
4. 适当的语气和情绪

直接输出回复内容，不要包含任何JSON格式或标记，也不要包含任何解释性文字。
回复内容应该是100-300字的中文，符合${character.name}的身份和性格。
`;

        const response = await this.processRequest({
            type: 'agent_dialogue',
            content: prompt,
            systemPrompt: `你是${character.name}，正在与玩家对话。请根据用户提供的内容生成相应的回答，严格依据人物设定和对话背景。`,
            context: dialogueContext,
            constraints: constraints || {
                maxTokens: 800,
                temperature: 0.6
            }
        });

        return {
            content: response,
            tone: '中立',
            emotions: ['平静'],
            subtext: '',
            relationshipImpact: 0
        };
    }
    
    // 生成叙事
    async generateNarrative(params) {
        const { gameState, recentEvents, playerActions } = params;

        const prompt = `
你是一个历史叙事大师，需要根据游戏状态生成一段符合历史背景的叙事内容。

【当前游戏状态】
朝代：${gameState.dynasty || '未知'}
皇帝：${gameState.emperor || '未知'}
年份：${gameState.year || '未知'}年
国库：${gameState.treasury || gameState.银两}万两
粮食：${gameState.grainStorage || gameState.粮食}万石
军力：${gameState.militaryStrength || '未知'}
威望：${gameState.prestige || '未知'}
稳定度：${gameState.stability || '未知'}

【最近事件】
${recentEvents?.slice(0, 5).map((event, index) => `${index + 1}. ${event.title}: ${event.description.substring(0, 100)}...`).join('\n') || '无'}

【玩家最近行动】
${playerActions?.slice(0, 3).map((action, index) => `${index + 1}. ${action.type}: ${action.description}`).join('\n') || '无'}

【叙事要求】
1. 生成一段300-500字的叙事内容，以第三人称视角描述当前的国家局势
2. 结合最近事件和玩家行动，构建连贯的叙事线索
3. 突出当前游戏状态的关键点和潜在的发展趋势
4. 语言风格应该符合历史背景，庄重而有文采
5. 不要包含游戏机制相关的内容，专注于叙事本身
6. 直接输出叙事内容，不要包含任何解释性文字
`;

        const response = await this.processRequest({
            type: 'creative_narrative',
            content: prompt,
            systemPrompt: '你是一位古代史官，正在记录历史。请根据用户提供的信息生成一段古风剧情旁白，严格依据信息，避免虚构。',
            context: { gameState, recentEvents, playerActions },
            constraints: {
                maxTokens: 1000,
                temperature: 0.7
            }
        });

        return {
            content: response.trim(),
            generatedAt: new Date().toISOString()
        };
    }
    
    // 生成事件
    async generateEvents(params) {
        const { gameState, recentEvents, playerActions } = params;

        const prompt = `
你是一个历史策略游戏的事件生成器，需要根据当前游戏状态生成符合逻辑的随机事件。

【当前游戏状态】
朝代：${gameState.dynasty || '未知'}
皇帝：${gameState.emperor || '未知'}
年份：${gameState.year || '未知'}年${gameState.month || '未知'}月
国库：${gameState.treasury || gameState.银两}万两
粮食：${gameState.grainStorage || gameState.粮食}万石
军力：${gameState.militaryStrength || '未知'}
威望：${gameState.prestige || '未知'}
稳定度：${gameState.stability || '未知'}

【最近事件】
${recentEvents?.slice(0, 5).map((event, index) => `${index + 1}. ${event.title}: ${event.description}`).join('\n') || '无'}

【玩家最近行动】
${playerActions?.slice(0, 3).map((action, index) => `${index + 1}. ${action.type}: ${action.description}`).join('\n') || '无'}

【事件生成要求】
1. 生成3-5个可能的事件，每个事件必须包含：
   - title: 事件标题（简短明了，符合历史背景）
   - description: 事件描述（详细说明事件背景和影响，必须符合历史事实）
   - department: 相关部门（吏部、户部、礼部、兵部、刑部、工部）
   - options: 3个可能的应对选项，每个选项包括text（选项文本）和description（选项描述）
   - impact: 事件可能的影响（对各属性的影响，数值必须合理）

2. 历史背景约束：
   - 事件必须严格符合历史背景
   - 事件内容必须与当时的政治、经济、文化、军事状况相符
   - 不得生成与历史事实明显不符的内容
   - 不得生成超越时代的科技、文化或社会现象
   - 人物、地名、官职等必须符合对应历史时期的实际情况

3. 幻觉控制：
   - 严格基于历史事实和游戏状态生成事件
   - 避免生成虚构的人物、事件或地点
   - 所有事件必须有合理的历史依据
   - 对于不确定的历史细节，应选择最符合主流历史记载的版本

4. 游戏平衡性：
   - 事件难度应该适中，既有挑战又有合理的应对空间
   - 影响数值必须合理，不得出现极端值
   - 选项应该提供有意义的选择，而非明显优劣的选项

5. 唯一性要求：
   - 不要生成重复或过于相似的事件
   - 确保每个事件都有独特的背景和影响

6. 输出要求：
   - 直接输出事件列表，不要包含任何解释性文字
   - 确保JSON格式正确，字段完整
   - 所有内容必须使用中文，符合历史文献的语言风格

【输出格式】
请以JSON格式输出事件列表，例如：
[
  {
    "title": "江南水患",
    "description": "江南地区遭遇严重水患，农田被淹，百姓流离失所...",
    "department": "户部",
    "options": [
      {"text": "拨款赈灾", "description": "从国库拨款三十万两用于赈灾..."},
      {"text": "派官视察", "description": "派遣户部官员前往视察灾情..."},
      {"text": "号召募捐", "description": "号召各地富商捐款赈灾..."}
    ],
    "impact": {"treasury": -30, "stability": -5}
  }
]
`;

        const response = await this.processRequest({
            type: 'event_generation',
            content: prompt,
            systemPrompt: '你是一个历史策略游戏的事件生成器，需要根据当前游戏状态生成符合逻辑的随机事件。',
            context: { gameState, recentEvents, playerActions },
            constraints: {
                maxTokens: 2000,
                temperature: 0.7
            }
        });

        try {
            // 清理和修复JSON格式
            let content = response;
            // 提取JSON部分
            const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (jsonMatch) {
                content = jsonMatch[0];
            }
            // 解析JSON
            const events = JSON.parse(content);
            // 验证事件
            const validatedEvents = events.filter(event => 
                event.title && event.description && event.department && event.options && event.impact
            );
            return validatedEvents.length > 0 ? validatedEvents : [{
                title: "AI生成事件",
                description: "系统通过AI生成的事件",
                department: "未知",
                options: [
                    {"text": "查看详情", "description": "查看事件的详细信息"},
                    {"text": "忽略", "description": "暂时忽略此事件"}
                ],
                impact: {}
            }];
        } catch (error) {
            console.error('解析事件时出错:', error);
            return [{
                title: "AI生成事件",
                description: "系统通过AI生成的事件",
                department: "未知",
                options: [
                    {"text": "查看详情", "description": "查看事件的详细信息"},
                    {"text": "忽略", "description": "暂时忽略此事件"}
                ],
                impact: {}
            }];
        }
    }
}

// 导出模块
module.exports = AIService;