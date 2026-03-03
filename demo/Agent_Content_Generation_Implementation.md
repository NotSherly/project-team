# 对话、叙事等Agent生成内容的实现逻辑

## 核心实现框架

### 1. 基础架构

```typescript
class AIService {
  private aiAdapter: AIAdapter;
  private cacheManager: CacheManager;
  
  constructor(apiKey: string) {
    this.aiAdapter = new AIAdapter(apiKey);
    this.cacheManager = new CacheManager();
  }
  
  // 核心处理方法
  async processRequest(request: AIRequest): Promise<AIResponse> {
    // 1. 生成缓存键
    // 2. 检查缓存
    // 3. 调用AI引擎
    // 4. 缓存结果
    // 5. 记录使用情况
  }
  
  // 各种生成方法
  async generateDialogueResponse(params: any): Promise<any> { /* ... */ }
  async generateNarrative(params: any): Promise<any> { /* ... */ }
  async generateEvents(params: any): Promise<any[]> { /* ... */ }
}
```

### 2. 对话生成实现

**核心逻辑**：
- 构建角色扮演prompt，包含人物设定、对话背景、对话历史
- 调用AI引擎生成响应
- 处理和返回结果

**关键代码**：
```typescript
async generateDialogueResponse(params: {
  character: any;
  dialogueContext: any;
  lastMessage: string;
  objectives: string[];
  constraints: any;
}): Promise<any> {
  const { character, dialogueContext, lastMessage, objectives, constraints } = params;

  // 构建详细的prompt
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
${dialogueContext.history?.map((entry: any) => `${entry.speakerId === 'player' ? '玩家' : character.name}: ${entry.message}`).join('\n') || ''}

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

  // 调用核心处理方法
  const response = await this.processRequest({
    type: 'agent_dialogue',
    content: prompt,
    context: dialogueContext,
    constraints: {
      maxTokens: constraints.maxTokens || 800,
      temperature: constraints.temperature || 0.6,
      creativity: constraints.creativity || 'medium',
      depth: 'deep'
    }
  });

  // 处理响应
  try {
    return {
      content: response.content,
      tone: '中立',
      emotions: ['平静'],
      subtext: '',
      relationshipImpact: 0
    };
  } catch (error) {
    // 错误处理
    return {
      content: response.content || '臣明白。',
      tone: '中立',
      emotions: ['平静'],
      subtext: '',
      relationshipImpact: 0
    };
  }
}
```

### 3. 叙事生成实现

**核心逻辑**：
- 构建叙事prompt，包含游戏状态、最近事件、玩家行动
- 调用AI引擎生成叙事内容
- 处理和返回结果

**关键代码**：
```typescript
async generateNarrative(params: {
  gameState: any;
  recentEvents: any[];
  playerActions: any[];
}): Promise<any> {
  const { gameState, recentEvents, playerActions } = params;

  // 构建详细的prompt
  const prompt = `
你是一个历史叙事大师，需要根据游戏状态生成一段符合历史背景的叙事内容。

【当前游戏状态】
朝代：${gameState.dynasty}
皇帝：${gameState.emperor}
年份：${gameState.year}年
国库：${gameState.treasury}万两
粮食：${gameState.grainStorage}万石
军力：${gameState.militaryStrength}
威望：${gameState.prestige}
稳定度：${gameState.stability}

【最近事件】
${recentEvents.slice(0, 5).map((event: any, index: number) => `${index + 1}. ${event.title}: ${event.description.substring(0, 100)}...`).join('\n') || '无'}

【玩家最近行动】
${playerActions.slice(0, 3).map((action: any, index: number) => `${index + 1}. ${action.type}: ${action.description}`).join('\n') || '无'}

【叙事要求】
1. 生成一段300-500字的叙事内容，以第三人称视角描述当前的国家局势
2. 结合最近事件和玩家行动，构建连贯的叙事线索
3. 突出当前游戏状态的关键点和潜在的发展趋势
4. 语言风格应该符合历史背景，庄重而有文采
5. 不要包含游戏机制相关的内容，专注于叙事本身
6. 直接输出叙事内容，不要包含任何解释性文字
`;

  // 调用核心处理方法
  const response = await this.processRequest({
    type: 'creative_narrative',
    content: prompt,
    context: { gameState, recentEvents, playerActions },
    constraints: {
      maxTokens: 1000,
      temperature: 0.7,
      creativity: 'high',
      depth: 'medium'
    }
  });

  // 处理响应
  try {
    const narrative = response.content.trim();
    return {
      content: narrative,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    // 错误处理
    return {
      content: '当前国家局势稳定，皇帝治理有方，国泰民安。',
      generatedAt: new Date().toISOString()
    };
  }
}
```

### 4. 事件生成实现

**核心逻辑**：
- 构建事件生成prompt，包含游戏状态、历史背景、最近事件
- 调用AI引擎生成事件
- 解析和处理生成的事件

**关键代码**：
```typescript
async generateEvents(params: {
  gameState: any;
  recentEvents: any[];
  playerActions: any[];
}): Promise<any[]> {
  const { gameState, recentEvents, playerActions } = params;

  // 构建历史背景信息
  const historicalContext = this.buildHistoricalContext(gameState.year, gameState.month, gameState.dynasty);

  // 构建详细的prompt
  const prompt = `
你是一个历史策略游戏的事件生成器，需要根据当前游戏状态生成符合逻辑的随机事件。

【当前游戏状态】
朝代：${gameState.dynasty}
皇帝：${gameState.emperor}
年份：${gameState.year}年${gameState.month}月
国库：${gameState.treasury}万两
粮食：${gameState.grainStorage}万石
军力：${gameState.militaryStrength}
威望：${gameState.prestige}
稳定度：${gameState.stability}

【历史背景】
${historicalContext}

【最近事件】
${recentEvents.slice(0, 5).map((event: any, index: number) => `${index + 1}. ${event.title}: ${event.description}`).join('\n') || '无'}

【玩家最近行动】
${playerActions.slice(0, 3).map((action: any, index: number) => `${index + 1}. ${action.type}: ${action.description}`).join('\n') || '无'}

【事件生成要求】
1. 生成3-5个可能的事件，每个事件必须包含：
   - title: 事件标题（简短明了，符合历史背景）
   - description: 事件描述（详细说明事件背景和影响，必须符合历史事实）
   - department: 相关部门（吏部、户部、礼部、兵部、刑部、工部）
   - options: 3个可能的应对选项，每个选项包括text（选项文本）和description（选项描述）
   - impact: 事件可能的影响（对各属性的影响，数值必须合理）

2. 历史背景约束：
   - 事件必须严格符合${gameState.year}年${gameState.month}月的历史背景
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

  // 调用核心处理方法
  const response = await this.processRequest({
    type: 'event_generation',
    content: prompt,
    context: { gameState, recentEvents, playerActions },
    constraints: {
      maxTokens: 2000,
      temperature: 0.7,
      creativity: 'medium',
      depth: 'deep'
    }
  });

  // 处理和解析响应
  try {
    let content = response.content;
    // 清理和修复JSON格式
    // 解析JSON
    // 验证事件
    return validatedEvents;
  } catch (error) {
    // 错误处理
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
```

### 5. 核心处理方法

**核心逻辑**：
- 生成缓存键
- 检查缓存
- 调用AI引擎
- 缓存结果
- 记录使用情况

**关键代码**：
```typescript
async processRequest(request: AIRequest): Promise<AIResponse> {
  const cacheKey = this.generateCacheKey(request);
  
  // 检查缓存
  const cached = await this.cacheManager.get<AIResponse>(cacheKey);
  if (cached) {
    return {
      ...cached,
      cached: true
    };
  }

  // 调用AI引擎
  const response = await this.aiAdapter.generate(request);
  
  // 缓存结果
  await this.cacheManager.set(cacheKey, response, {
    ttl: this.calculateTTL(request.type),
    priority: this.determinePriority(request)
  });

  // 记录使用情况
  this.recordUsage('volcano', response.tokensUsed, response.latency);
  
  return response;
}
```

## 技术特点与优势

1. **模块化设计**：将不同生成任务分离为独立方法，便于维护和扩展
2. **缓存机制**：减少重复请求，提高性能和降低成本
3. **详细的prompt设计**：包含具体的上下文、要求和格式说明，提高生成质量
4. **错误处理**：提供fallback机制，确保系统稳定性
5. **历史背景整合**：通过buildHistoricalContext方法提供历史背景信息，增强生成内容的准确性
6. **参数化配置**：支持通过constraints参数调整生成参数，如temperature、maxTokens等

## 如何在其他项目中复现

1. **创建基础服务类**：
   - 实现AIService类，包含processRequest核心方法
   - 集成AI引擎适配器（如OpenAI、火山引擎等）
   - 实现缓存管理

2. **实现生成方法**：
   - 对话生成：构建角色扮演prompt，包含人物设定和对话历史
   - 叙事生成：构建叙事prompt，包含游戏状态和事件
   - 事件生成：构建事件生成prompt，包含历史背景和游戏状态

3. **优化和扩展**：
   - 根据具体项目需求调整prompt内容
   - 添加更多生成类型（如任务生成、角色生成等）
   - 优化缓存策略和错误处理

4. **集成到项目中**：
   - 在需要生成内容的地方调用相应的生成方法
   - 处理生成结果并展示给用户

## 示例：在其他项目中使用

```typescript
// 创建AI服务实例
const aiService = new AIService('your-api-key');

// 生成对话
const dialogueResponse = await aiService.generateDialogueResponse({
  character: {
    name: '诸葛亮',
    role: '丞相',
    personality: { traits: ['智慧', '忠诚', '谨慎'] },
    faction: '蜀汉'
  },
  dialogueContext: {
    location: '丞相府',
    history: [
      { speakerId: 'player', message: '丞相，当前国家局势如何？' }
    ]
  },
  lastMessage: '还请丞相为我分析当前的战略形势。',
  objectives: ['分析当前战略形势', '提供应对建议'],
  constraints: {
    maxTokens: 800,
    temperature: 0.6
  }
});

// 生成叙事
const narrative = await aiService.generateNarrative({
  gameState: {
    dynasty: '蜀汉',
    emperor: '刘禅',
    year: 234,
    treasury: 500,
    militaryStrength: 80,
    prestige: 70,
    stability: 60
  },
  recentEvents: [
    { title: '诸葛亮北伐', description: '诸葛亮率领大军北伐曹魏，取得局部胜利' },
    { title: '粮草运输问题', description: '由于山路崎岖，粮草运输遇到困难' }
  ],
  playerActions: [
    { type: '军事', description: '派遣赵云率领精锐部队支援前线' },
    { type: '经济', description: '增加粮草生产和储备' }
  ]
});
```

通过这种实现方式，你可以在其他项目中轻松复现对话、叙事等Agent生成内容的功能，为项目增添智能交互和内容生成能力。