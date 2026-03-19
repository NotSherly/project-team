/**
 * 并行生成调度器 - 负责六部同时"思考"，顺序"发言"
 * 实现并行生成、发言顺序决策、缓存排序、超时容错等功能
 */

const AIService = require('./ai_service');

class ParallelScheduler {
    constructor() {
        this.aiService = new AIService();
        this.generationCache = new Map();
        this.departmentRelations = this.initDepartmentRelations();
        this.generationStats = {
            totalTime: 0,
            successCount: 0,
            failureCount: 0,
            averageTime: 0
        };
    }

    initDepartmentRelations() {
        return {
            '吏部': {
                interests: ['官员选拔', '政绩考核', '部门协调'],
                conflicts: ['户部', '刑部'],
                allies: ['礼部', '工部'],
                personality: '谨慎、稳重、注重秩序'
            },
            '户部': {
                interests: ['财政收支', '税收管理', '国库储备'],
                conflicts: ['兵部', '工部'],
                allies: ['吏部', '刑部'],
                personality: '精明、务实、善于理财'
            },
            '礼部': {
                interests: ['文化教育', '礼仪制度', '外事活动'],
                conflicts: ['刑部'],
                allies: ['吏部', '兵部'],
                personality: '儒雅、博学、重视传统'
            },
            '兵部': {
                interests: ['军事建设', '边防安全', '军械装备'],
                conflicts: ['户部', '礼部'],
                allies: ['工部', '刑部'],
                personality: '刚毅、果敢、重视军事'
            },
            '刑部': {
                interests: ['司法审判', '刑罚政令', '社会秩序'],
                conflicts: ['礼部', '吏部'],
                allies: ['户部', '兵部'],
                personality: '公正、严明、执法如山'
            },
            '工部': {
                interests: ['工程建设', '水利交通', '民生改善'],
                conflicts: ['户部'],
                allies: ['吏部', '兵部'],
                personality: '务实、肯干、注重民生'
            }
        };
    }

    async generateParallelDepartments(event, gameState, options = {}) {
        const startTime = Date.now();
        const departments = ['吏部', '户部', '礼部', '兵部', '刑部', '工部'];
        
        console.log(`\n[调度器] 开始并行生成六部响应...`);
        console.log(`[调度器] 事件类型: ${event.type || '未知'}`);
        
        const speakingOrder = this.determineSpeakingOrder(event, gameState);
        console.log(`[调度器] 发言顺序: ${speakingOrder.join(' -> ')}`);
        
        const generationPromises = departments.map(dept => 
            this.generateDepartmentResponse(dept, event, gameState, options)
                .catch(error => {
                    console.error(`[调度器] ${dept}生成失败:`, error.message);
                    return this.getFallbackResponse(dept, event);
                })
        );
        
        try {
            const results = await Promise.all(generationPromises);
            
            const responseMap = new Map();
            departments.forEach((dept, index) => {
                responseMap.set(dept, results[index]);
            });
            
            const orderedResponses = speakingOrder.map(dept => ({
                department: dept,
                response: responseMap.get(dept),
                order: speakingOrder.indexOf(dept) + 1
            }));
            
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            
            this.updateStats(totalTime, true);
            
            console.log(`[调度器] 并行生成完成，总耗时: ${totalTime}ms`);
            
            return {
                success: true,
                speakingOrder: speakingOrder,
                responses: orderedResponses,
                stats: {
                    totalTime: totalTime,
                    departmentCount: departments.length,
                    averageTimePerDept: totalTime / departments.length
                }
            };
        } catch (error) {
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            
            this.updateStats(totalTime, false);
            
            console.error(`[调度器] 并行生成失败:`, error);
            
            return {
                success: false,
                error: error.message,
                fallbackResponses: this.getAllFallbackResponses(event)
            };
        }
    }

    determineSpeakingOrder(event, gameState) {
        const departments = ['吏部', '户部', '礼部', '兵部', '刑部', '工部'];
        
        const relevanceScores = departments.map(dept => ({
            department: dept,
            score: this.calculateRelevanceScore(dept, event, gameState)
        }));
        
        relevanceScores.sort((a, b) => b.score - a.score);
        
        const orderedDepts = relevanceScores.map(item => item.department);
        
        console.log(`[调度器] 相关性评分:`, relevanceScores);
        
        return orderedDepts;
    }

    calculateRelevanceScore(department, event, gameState) {
        let score = 0;
        
        const eventTypeMap = {
            '财政': ['户部', '吏部', '工部'],
            '军事': ['兵部', '户部', '工部'],
            '文化': ['礼部', '吏部', '户部'],
            '司法': ['刑部', '吏部', '户部'],
            '工程': ['工部', '户部', '兵部'],
            '人事': ['吏部', '礼部', '刑部'],
            '外交': ['礼部', '兵部', '户部'],
            '灾害': ['工部', '户部', '吏部'],
            '边患': ['兵部', '户部', '刑部'],
            '民变': ['刑部', '吏部', '户部']
        };
        
        const eventType = event.type || '人事';
        const relevantDepts = eventTypeMap[eventType] || eventTypeMap['人事'];
        
        if (relevantDepts.includes(department)) {
            score += (relevantDepts.length - relevantDepts.indexOf(department)) * 10;
        }
        
        const deptInfo = this.departmentRelations[department];
        if (deptInfo && event.keywords) {
            event.keywords.forEach(keyword => {
                if (deptInfo.interests.some(interest => interest.includes(keyword))) {
                    score += 5;
                }
            });
        }
        
        score += Math.random() * 3;
        
        return score;
    }

    async generateDepartmentResponse(department, event, gameState, options = {}) {
        const cacheKey = `${department}_${event.id || 'default'}_${JSON.stringify(gameState)}`;
        
        if (this.generationCache.has(cacheKey)) {
            console.log(`[调度器] 从缓存获取${department}响应`);
            return this.generationCache.get(cacheKey);
        }
        
        const deptInfo = this.departmentRelations[department];
        const behaviorType = this.selectBehaviorType(department, event, gameState);
        const temperature = this.calculateTemperature(event, behaviorType);
        
        const prompt = this.buildDepartmentPrompt(department, event, gameState, behaviorType);
        
        try {
            const response = await Promise.race([
                this.aiService.processRequest({
                    type: 'agent_dialogue',
                    content: prompt,
                    systemPrompt: `你是${department}尚书，性格：${deptInfo.personality}。请根据事件和当前状态发表看法。`,
                    constraints: {
                        maxTokens: options.maxTokens || 800,
                        temperature: temperature
                    }
                }),
                this.createTimeoutPromise(options.timeout || 15000)
            ]);
            
            this.generationCache.set(cacheKey, response);
            
            return {
                department: department,
                content: response,
                behaviorType: behaviorType,
                temperature: temperature,
                cached: false
            };
        } catch (error) {
            console.error(`[调度器] ${department}生成失败:`, error.message);
            throw error;
        }
    }

    selectBehaviorType(department, event, gameState) {
        const deptInfo = this.departmentRelations[department];
        const behaviors = ['扯皮', '支持', '中立'];
        
        let weights = [0.3, 0.3, 0.4];
        
        if (event.type) {
            const relevantDepts = this.getRelevantDepartments(event.type);
            if (relevantDepts.includes(department)) {
                weights = [0.2, 0.5, 0.3];
            } else {
                weights = [0.4, 0.2, 0.4];
            }
        }
        
        if (event.previousResponses && event.previousResponses.length > 0) {
            const lastResponse = event.previousResponses[event.previousResponses.length - 1];
            if (lastResponse && deptInfo.allies && deptInfo.allies.includes(lastResponse.department)) {
                weights[1] += 0.2;
            }
            if (lastResponse && deptInfo.conflicts && deptInfo.conflicts.includes(lastResponse.department)) {
                weights[0] += 0.2;
            }
        }
        
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        weights = weights.map(w => w / totalWeight);
        
        const random = Math.random();
        let cumulative = 0;
        for (let i = 0; i < behaviors.length; i++) {
            cumulative += weights[i];
            if (random < cumulative) {
                return behaviors[i];
            }
        }
        
        return '中立';
    }

    getRelevantDepartments(eventType) {
        const eventTypeMap = {
            '财政': ['户部', '吏部', '工部'],
            '军事': ['兵部', '户部', '工部'],
            '文化': ['礼部', '吏部', '户部'],
            '司法': ['刑部', '吏部', '户部'],
            '工程': ['工部', '户部', '兵部'],
            '人事': ['吏部', '礼部', '刑部'],
            '外交': ['礼部', '兵部', '户部'],
            '灾害': ['工部', '户部', '吏部'],
            '边患': ['兵部', '户部', '刑部'],
            '民变': ['刑部', '吏部', '户部']
        };
        
        return eventTypeMap[eventType] || eventTypeMap['人事'];
    }

    calculateTemperature(event, behaviorType) {
        let baseTemp = 0.7;
        
        if (event.severity === 'high') {
            baseTemp = 0.5;
        } else if (event.severity === 'low') {
            baseTemp = 0.8;
        }
        
        switch (behaviorType) {
            case '扯皮':
                baseTemp += 0.1;
                break;
            case '支持':
                baseTemp -= 0.1;
                break;
            case '中立':
                break;
        }
        
        return Math.max(0.3, Math.min(1.0, baseTemp));
    }

    buildDepartmentPrompt(department, event, gameState, behaviorType) {
        const deptInfo = this.departmentRelations[department];
        
        let behaviorInstruction = '';
        switch (behaviorType) {
            case '扯皮':
                behaviorInstruction = `
【行为指导 - 扯皮】
你可以采取以下策略：
1. 质疑数据：对其他部门提供的数据表示怀疑，要求重新核实
2. 推诿责任：暗示问题不在本部门，可能是其他部门的责任
3. 转移话题：将讨论引向对本部门有利的方向
4. 人身攻击：委婉地质疑其他部门官员的能力或动机
注意：保持朝廷礼仪，不要过于直白，使用委婉的语言。`;
                break;
            case '支持':
                behaviorInstruction = `
【行为指导 - 支持】
你可以采取以下策略：
1. 附议：表示赞同其他部门的观点，强调共识的重要性
2. 补充论据：为其他部门的观点提供额外的支持证据
3. 主动请缨：表示本部门愿意承担更多责任
4. 利益交换暗示：委婉地表达希望得到其他部门支持的意愿`;
                break;
            case '中立':
                behaviorInstruction = `
【行为指导 - 中立】
你可以采取以下策略：
1. 询问细节：对事件的具体细节提出疑问
2. 和稀泥：试图平衡各方观点，避免明确站队
3. 观望表态：表示需要更多信息才能做出判断
4. 程序性发言：强调需要按照既定程序处理`;
                break;
        }
        
        return `你是${department}尚书，性格：${deptInfo.personality}。

【当前事件】
${event.description || event.title || '朝廷例行议事'}

【事件类型】
${event.type || '人事'}

【当前国家状态】
- 银两：${gameState.银两 || 500}万两
- 粮食：${gameState.粮食 || 300}万石
- 民心：${gameState.民心 || 60}
- 稳定度：${gameState.稳定度 || 70}
- 军力：${gameState.军力 || 50}
- 威望：${gameState.威望 || 50}

【本部门利益】
${deptInfo.interests.join('、')}

【本部门关系】
- 盟友：${deptInfo.allies.join('、')}
- 潜在冲突：${deptInfo.conflicts.join('、')}

${behaviorInstruction}

【发言要求】
1. 发言长度：100-200字
2. 保持朝廷礼仪，使用文言文风格
3. 体现本部门的立场和利益
4. 根据行为指导选择合适的发言策略
5. 在发言末尾用【】标记你的行为类型，例如：【扯皮】、【支持】、【中立】

请发表你的看法：`;
    }

    createTimeoutPromise(timeout) {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`生成超时（${timeout}ms）`));
            }, timeout);
        });
    }

    getFallbackResponse(department, event) {
        const fallbackResponses = {
            '吏部': `臣${department}尚书以为，此事关乎国家大计，需从长计议。官员选拔乃国家根本，不可草率行事。建议先由吏部核查相关人员履历，再做定夺。【中立】`,
            '户部': `臣${department}尚书认为，此事涉及财政开支，需详细核算成本。国库虽充盈，但也需量入为出，不可铺张浪费。建议户部先行评估财政影响。【中立】`,
            '礼部': `臣${department}尚书以为，此事关乎国家体面，需谨慎处理。礼仪制度乃国家根本，不可随意更改。建议礼部先行拟定方案，再议实施。【中立】`,
            '兵部': `臣${department}尚书认为，此事涉及国家安全，需慎重考虑。边防稳固乃国家根本，不可掉以轻心。建议兵部先行评估安全影响。【中立】`,
            '刑部': `臣${department}尚书以为，此事关乎法律公正，需依法办理。司法公正乃国家根本，不可徇私舞弊。建议刑部先行调查取证。【中立】`,
            '工部': `臣${department}尚书认为，此事涉及工程建设，需详细规划。民生改善乃国家根本，不可敷衍了事。建议工部先行勘察现场。【中立】`
        };
        
        return {
            department: department,
            content: fallbackResponses[department] || `臣${department}尚书以为，此事需从长计议。【中立】`,
            behaviorType: '中立',
            temperature: 0.7,
            cached: false,
            fallback: true
        };
    }

    getAllFallbackResponses(event) {
        const departments = ['吏部', '户部', '礼部', '兵部', '刑部', '工部'];
        return departments.map(dept => this.getFallbackResponse(dept, event));
    }

    updateStats(time, success) {
        this.generationStats.totalTime += time;
        if (success) {
            this.generationStats.successCount++;
        } else {
            this.generationStats.failureCount++;
        }
        this.generationStats.averageTime = 
            this.generationStats.totalTime / 
            (this.generationStats.successCount + this.generationStats.failureCount);
    }

    getStats() {
        return { ...this.generationStats };
    }

    clearCache() {
        this.generationCache.clear();
        console.log(`[调度器] 缓存已清空`);
    }
}

module.exports = ParallelScheduler;
