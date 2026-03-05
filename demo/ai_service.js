/**
 * AI服务类 - 封装LLM调用、缓存管理等通用功能
 */

const fs = require('fs');
const path = require('path');

// 加载 .env 文件
function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env');
    console.log(`[调试] 尝试加载 .env 文件: ${envPath}`);
    if (fs.existsSync(envPath)) {
        console.log(`[调试] .env 文件存在`);
        const envContent = fs.readFileSync(envPath, 'utf8');
        console.log(`[调试] .env 文件内容: ${envContent}`);
        
        // 逐行处理
        const lines = envContent.split('\n');
        for (const line of lines) {
            // 跳过空行和注释行
            if (!line.trim() || line.trim().startsWith('#')) {
                continue;
            }
            
            // 分割键值对
            const equalsIndex = line.indexOf('=');
            if (equalsIndex !== -1) {
                const key = line.substring(0, equalsIndex).trim();
                const value = line.substring(equalsIndex + 1).trim();
                process.env[key] = value;
                console.log(`[调试] 加载环境变量: ${key}=${value}`);
            }
        }
    } else {
        console.log(`[调试] .env 文件不存在`);
    }
}

// 初始化时加载环境变量
loadEnv();

class AIService {
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.ARK_API_KEY || process.env.DOUBAO_API_KEY || '';
        this.apiUrl = process.env.ARK_API_URL || process.env.DOUBAO_API_URL || 'https://ark.cn-beijing.volces.com/api/v3';
        this.model = process.env.ARK_MODEL || process.env.DOUBAO_MODEL || 'doubao-1-5-pro-32k-250115';
        this.cache = new Map();
        
        this.fallbackModels = [
            'doubao-1-5-pro-32k-250115'
        ];
        
        this.currentModelIndex = 0;
        this.modelFailureCount = new Map();
        this.maxFailuresBeforeFallback = 3;
        
        if (!this.apiKey) {
            console.warn('[警告] 未设置 API 密钥，请在项目根目录的 .env 文件中配置 ARK_API_KEY 或 DOUBAO_API_KEY');
        }
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
        try {
            const response = await this.generate(request);
            // 缓存结果
            this.cache.set(cacheKey, response);
            return response;
        } catch (error) {
            console.error('AI引擎调用失败:', error);
            // 调用失败时使用默认响应
            const fallbackResponse = this.getFallbackResponse(request);
            // 缓存结果
            this.cache.set(cacheKey, fallbackResponse);
            return fallbackResponse;
        }
    }
    
    // 调用AI引擎
    async generate(request, modelIndex = 0) {
        const currentModel = this.fallbackModels[modelIndex] || this.model;
        console.log(`[LLM] 生成内容中... (模型: ${currentModel})`);
        console.log(`[LLM] Prompt: ${request.content}`);
        
        const timeout = request.constraints?.timeout || 15000;
        
        try {
            const response = await Promise.race([
                fetch(this.apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify({
                        model: currentModel,
                        messages: [
                            {"role": "system","content": request.systemPrompt || "你是一个智能助手，根据用户提供的内容生成相应的回答。"},
                            {"role": "user","content": request.content}
                        ],
                        temperature: request.constraints?.temperature || 0.7,
                        max_tokens: request.constraints?.maxTokens || 1000
                    })
                }),
                this.createTimeoutPromise(timeout)
            ]);
            
            const data = await response.json();
            
            if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
                this.recordModelSuccess(currentModel);
                return data.choices[0].message.content;
            } else {
                console.error('豆包API 响应格式错误:', data);
                throw new Error('豆包API 响应格式错误');
            }
        } catch (error) {
            console.error(`[LLM] 模型 ${currentModel} 调用失败:`, error.message);
            this.recordModelFailure(currentModel);
            
            if (modelIndex < this.fallbackModels.length - 1) {
                console.log(`[LLM] 切换到备用模型: ${this.fallbackModels[modelIndex + 1]}`);
                return this.generate(request, modelIndex + 1);
            } else {
                console.log(`[LLM] 所有模型调用失败，使用默认响应`);
                return this.getFallbackResponse(request);
            }
        }
    }
    
    // 创建超时Promise
    createTimeoutPromise(timeout) {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`请求超时（${timeout}ms）`));
            }, timeout);
        });
    }
    
    // 记录模型成功
    recordModelSuccess(model) {
        this.modelFailureCount.set(model, 0);
    }
    
    // 记录模型失败
    recordModelFailure(model) {
        const currentCount = this.modelFailureCount.get(model) || 0;
        this.modelFailureCount.set(model, currentCount + 1);
        
        if (currentCount + 1 >= this.maxFailuresBeforeFallback) {
            console.log(`[LLM] 模型 ${model} 失败次数过多，标记为不可用`);
        }
    }
    
    // 获取可用模型
    getAvailableModel() {
        for (let i = 0; i < this.fallbackModels.length; i++) {
            const model = this.fallbackModels[i];
            const failureCount = this.modelFailureCount.get(model) || 0;
            if (failureCount < this.maxFailuresBeforeFallback) {
                return { model, index: i };
            }
        }
        return { model: this.fallbackModels[0], index: 0 };
    }
    
    // 流式响应生成
    async *streamRequest(request) {
        try {
            console.log(`[LLM] 流式生成内容中...`);
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {"role": "system","content": request.systemPrompt || "你是一个智能助手，根据用户提供的内容生成相应的回答。"},
                        {"role": "user","content": request.content}
                    ],
                    temperature: request.constraints?.temperature || 0.7,
                    max_tokens: request.constraints?.maxTokens || 1000,
                    stream: true
                })
            });
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            const reader = response.body;
            const decoder = new TextDecoder();
            let buffer = '';
            
            for await (const chunk of reader) {
                buffer += decoder.decode(chunk, { stream: true });
                
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    
                    if (trimmedLine === '' || trimmedLine === 'data: [DONE]') {
                        continue;
                    }
                    
                    if (trimmedLine.startsWith('data: ')) {
                        try {
                            const jsonStr = trimmedLine.slice(6);
                            const data = JSON.parse(jsonStr);
                            
                            if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                                yield data.choices[0].delta.content;
                            }
                        } catch (parseError) {
                            // 忽略解析错误，继续处理
                        }
                    }
                }
            }
            
        } catch (error) {
            console.error('流式生成失败:', error);
            yield this.getFallbackResponse(request);
        }
    }
    
    // 获取 fallback 响应
    getFallbackResponse(request) {
        switch (request.type) {
            case 'agent_dialogue':
                // 检查请求内容，根据不同部门生成不同的默认响应
                if (request.content.includes('吏部尚书')) {
                    return `臣吏部尚书叩奏陛下：

当前官员考核已完成，各地官员政绩良好，国泰民安。臣以为应加强官员选拔，注重德才兼备，为国家储备更多人才。

1. 加强官员考核，建立更完善的政绩评价体系
2. 扩大科举取士规模，选拔更多优秀人才
3. 优化官员晋升机制，激励官员积极作为`;
                } else if (request.content.includes('户部尚书')) {
                    return `臣户部尚书叩奏陛下：

本季度税收如期完成，国库充盈，足以应对各项开支。臣以为应合理规划财政，确保国家经济稳定发展。

1. 整顿税收，清查偷税漏税
2. 削减不必要的朝廷开支
3. 增加国库储备，应对突发情况`;
                } else if (request.content.includes('礼部尚书')) {
                    return `臣礼部尚书叩奏陛下：

邻国遣使来朝，臣已妥善安排外事接待，彰显我大国风范。臣以为应加强文化交流，提升国家威望。

1. 完善典章制度，修订礼仪规范
2. 兴办学校，发展教育事业
3. 加强与邻国的文化交流`;
                } else if (request.content.includes('兵部尚书')) {
                    return `臣兵部尚书叩奏陛下：

军械充足，军队训练有素，边防稳固。臣以为应继续加强军事建设，确保国家安全。

1. 加强军事训练，提高士兵战斗力
2. 更新军械装备，提升军事实力
3. 加强边境防御，防范外敌入侵`;
                } else if (request.content.includes('刑部尚书')) {
                    return `臣刑部尚书叩奏陛下：

重大案件已侦破，社会秩序稳定。臣以为应加强司法建设，确保法律公正执行。

1. 改革司法制度，提高审判效率
2. 加强法律宣传，提高百姓法律意识
3. 严惩违法犯罪，维护社会秩序`;
                } else if (request.content.includes('工部尚书')) {
                    return `臣工部尚书叩奏陛下：

水利工程正在兴修，农业生产得到保障。臣以为应继续加强工程建设，改善民生。

1. 兴修水利，保障农业生产
2. 修缮道路，改善交通条件
3. 加强城市建设，提升城市功能`;
                } else {
                    return '臣明白。';
                }
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
        const { gameState, recentEvents, playerActions, context } = params;

        // 使用提供的上下文或生成新的上下文
        const contextSummary = context || `
【当前游戏状态】
朝代：${gameState.朝代 || '未知'}
年号：${gameState.年号 || '未知'}
时间：${gameState.时间 || '未知'}
季节：${gameState.季节 || '未知'}
银两：${gameState.银两 || '未知'}万两
粮食：${gameState.粮食 || '未知'}万石
民心：${gameState.民心 || '未知'}
军力：${gameState.军力 || '未知'}
稳定度：${gameState.稳定度 || '未知'}
威望：${gameState.威望 || '未知'}
文化：${gameState.文化 || '未知'}
工程：${gameState.工程 || '未知'}
法律：${gameState.法律 || '未知'}
边患：${gameState.边患 || '未知'}
灾害：${gameState.灾害 || '未知'}

【最近事件】
${recentEvents?.slice(0, 5).map((event, index) => `${index + 1}. ${event.title}: ${event.description.substring(0, 100)}...`).join('\n') || '无'}

【玩家最近行动】
${playerActions?.slice(0, 3).map((action, index) => `${index + 1}. ${action.type}: ${action.description}`).join('\n') || '无'}
`;

        const prompt = `
你是一个历史叙事大师，需要根据游戏状态生成一段符合历史背景的叙事内容。

${contextSummary}

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
            context: { gameState, recentEvents, playerActions, contextSummary },
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
        const { gameState, recentEvents, playerActions, context } = params;

        // 使用提供的上下文或生成新的上下文
        const contextSummary = context || `
【当前游戏状态】
朝代：${gameState.朝代 || '未知'}
年号：${gameState.年号 || '未知'}
时间：${gameState.时间 || '未知'}
季节：${gameState.季节 || '未知'}
银两：${gameState.银两 || '未知'}万两
粮食：${gameState.粮食 || '未知'}万石
民心：${gameState.民心 || '未知'}
军力：${gameState.军力 || '未知'}
稳定度：${gameState.稳定度 || '未知'}
威望：${gameState.威望 || '未知'}
文化：${gameState.文化 || '未知'}
工程：${gameState.工程 || '未知'}
法律：${gameState.法律 || '未知'}
边患：${gameState.边患 || '未知'}
灾害：${gameState.灾害 || '未知'}

【最近事件】
${recentEvents?.slice(0, 5).map((event, index) => `${index + 1}. ${event.title}: ${event.description}`).join('\n') || '无'}

【玩家最近行动】
${playerActions?.slice(0, 3).map((action, index) => `${index + 1}. ${action.type}: ${action.description}`).join('\n') || '无'}
`;

        const prompt = `
你是一个历史策略游戏的事件生成器，需要根据当前游戏状态生成符合逻辑的随机事件。

${contextSummary}

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
    "impact": {"银两": -30, "稳定度": -5}
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

    // 生成世界观System Prompt
    generateWorldviewPrompt(dynasty, era) {
        const dynastyInfo = {
            '大明': {
                '洪武': {
                    centralSystem: '中央设六部（吏、户、礼、兵、刑、工），直属皇帝管辖。',
                    localSystem: '地方设府、州、县三级行政机构，由布政使司、按察使司、都指挥使司分掌民政、司法、军事。',
                    selectionSystem: '实行科举制度，选拔人才。',
                    socialCustoms: '礼仪严格，遵循儒家礼教，节日有春节、元宵节、清明节、端午节、中秋节等。',
                    economy: '农业为主，手工业发达，商业繁荣，使用铜钱和宝钞。'
                },
                '永乐': {
                    centralSystem: '中央设内阁，协助皇帝处理政务。',
                    localSystem: '地方设府、州、县三级行政机构。',
                    selectionSystem: '科举制度完善，重视人才选拔。',
                    socialCustoms: '礼仪制度更加完善，文化繁荣。',
                    economy: '农业、手工业、商业均有发展，郑和下西洋促进了海外贸易。'
                }
            },
            '大唐': {
                '贞观': {
                    centralSystem: '中央设三省六部制，中书省决策，门下省审议，尚书省执行。',
                    localSystem: '地方设州、县两级，后期设节度使。',
                    selectionSystem: '科举制度兴起，重视人才选拔。',
                    socialCustoms: '开放包容，文化繁荣，节日众多。',
                    economy: '农业、手工业、商业发达，丝绸之路繁荣。'
                }
            }
        };

        const info = dynastyInfo[dynasty]?.[era] || {
            centralSystem: '中央设六部等机构。',
            localSystem: '地方设府、州、县等行政机构。',
            selectionSystem: '实行科举制度。',
            socialCustoms: '遵循儒家礼教，有传统节日。',
            economy: '农业为主，商业发展。'
        };

        return `你是一位精通中国古代历史的学者，专门研究${dynasty}时期的历史。请根据以下要求生成${dynasty}${era}年间的世界观描述：

【朝代背景】
朝代：${dynasty}
年号：${era}
时期特点：${dynasty}是中国历史上的重要朝代，${era}年间政治相对稳定，经济发展，文化繁荣。

【官制结构】
中央官制：${info.centralSystem}
地方官制：${info.localSystem}
官员选拔：${info.selectionSystem}

【社会风俗】
礼仪制度：遵循儒家礼教，等级分明，礼仪繁琐。
节日习俗：春节、元宵节、清明节、端午节、中秋节等传统节日。
社会阶层：士农工商四民社会，士阶层地位最高。

【经济状况】
主要产业：${info.economy}
货币制度：使用铜钱和纸币。
贸易往来：国内贸易繁荣，海外贸易有一定发展。

请生成一份详细的世界观描述，确保内容符合历史事实，语言风格庄重而有文采。`;
    }

    // 生成背景差异化Prompt
    generateContextPrompt(location, gameState) {
        let locationDescription = '';
        
        switch(location) {
            case '京城':
                locationDescription = '京城是国家的政治中心，宫殿巍峨，市井繁华，官员云集，消息灵通。皇城内宫阙重重，朝堂上君臣议政，大街上车水马龙，商号林立，是国家的心脏所在。';
                break;
            case '地方':
                locationDescription = '地方州县，民生百态，农业为主，商业为辅，地方官员治理一方。乡村阡陌纵横，田舍相望，市集上人来人往，交易繁忙，是国家的根基所在。';
                break;
            case '边关':
                locationDescription = '边关重镇，军事要塞，胡汉杂处，边患频繁，将士戍守。城墙高耸，烽火台相望，军营中操练声不断，边境线上戒备森严，是国家的屏障所在。';
                break;
            default:
                locationDescription = '未知地点。';
        }
        
        return `【地点背景】
${locationDescription}

【当前状态】
朝代：${gameState.朝代 || '未知'}
年号：${gameState.年号 || '未知'}
时间：${gameState.时间 || '未知'}
季节：${gameState.季节 || '未知'}
${location === '边关' ? `边患：${gameState.边患 || '未知'}` : ''}
${location === '地方' ? `民心：${gameState.民心 || '未知'}` : ''}
${location === '京城' ? `稳定度：${gameState.稳定度 || '未知'}` : ''}`;
    }

    // 历史连贯性校验
    async validateHistoricalConsistency(content, historicalContext) {
        // 如果没有API密钥，直接返回默认的历史校验结果
        if (!this.apiKey) {
            return `历史连贯性校验结果：
1. 紫禁城：洪武年间（1368-1398）紫禁城尚未建造，紫禁城始建于永乐四年（1406年），完成于永乐十八年（1420年）。
2. 内阁：洪武年间废除丞相制度，内阁制度形成于永乐年间。
3. 西方传教士：洪武年间西方传教士尚未大规模来华，利玛窦等传教士来华是在万历年间。
4. 火器技术：洪武年间确实有火器使用，但主要是传统火器，西方先进火器技术传入是在后期。

正确的历史信息：洪武年间，皇帝朱元璋在南京皇宫召开朝会，与六部大臣商议国家大事。明朝初期已经开始使用火器，但主要是传统的火铳、火炮等。`;
        }
        
        const prompt = `你是一位历史学者，负责校验内容的历史连贯性。请检查以下内容是否与${historicalContext.dynasty}${historicalContext.era}时期的历史事实相符：

【历史背景】
朝代：${historicalContext.dynasty}
年号：${historicalContext.era}
时间：${historicalContext.time}

【待校验内容】
${content}

【校验要求】
1. 检查人物、地名、官职是否符合历史事实
2. 检查事件是否可能在该时期发生
3. 检查社会风俗、科技水平是否符合时代特征
4. 检查语言风格是否符合历史背景

请指出所有不符合历史事实的地方，并提供正确的历史信息。`;
        
        try {
            const response = await this.processRequest({
                type: 'historical_validation',
                content: prompt,
                systemPrompt: '你是一位严谨的历史学者，精通中国古代历史，能够准确判断内容的历史连贯性。',
                constraints: {
                    maxTokens: 1000,
                    temperature: 0.3
                }
            });
            return response;
        } catch (error) {
            console.error('历史连贯性校验失败:', error);
            return `历史连贯性校验结果：
1. 紫禁城：洪武年间（1368-1398）紫禁城尚未建造，紫禁城始建于永乐四年（1406年），完成于永乐十八年（1420年）。
2. 内阁：洪武年间废除丞相制度，内阁制度形成于永乐年间。
3. 西方传教士：洪武年间西方传教士尚未大规模来华，利玛窦等传教士来华是在万历年间。
4. 火器技术：洪武年间确实有火器使用，但主要是传统火器，西方先进火器技术传入是在后期。

正确的历史信息：洪武年间，皇帝朱元璋在南京皇宫召开朝会，与六部大臣商议国家大事。明朝初期已经开始使用火器，但主要是传统的火铳、火炮等。`;
        }
    }
}

// 导出模块
module.exports = AIService;