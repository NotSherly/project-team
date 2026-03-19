/**
 * 六部群聊系统
 * 实现流式响应和共享上下文
 */

const AIService = require('./ai_service');
const fs = require('fs');
const path = require('path');

class GroupChat {
    constructor() {
        this.messageHistory = [];
        this.agents = this.loadAgents();
        this.aiService = new AIService();
        this.isSpeaking = false;
        this.currentSpeaker = null;
        this.votes = new Map(); // 存储投票状态
        this.proposal = null; // 当前议案
        this.sessionId = this.generateSessionId(); // 会话ID
        this.eraSpirit = 'balanced'; // 文武倾向：balanced, military, civil
        this.agentStats = this.initAgentStats(); // 存储Agent的数值状态
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    initAgentStats() {
        const stats = {};
        for (const agentId in this.agents) {
            stats[agentId] = {
                loyalty: 70 + Math.random() * 20, // 忠诚度
                power: 50 + Math.random() * 30, // 权力值
                bias: Math.random() > 0.5 ? 'pro' : 'anti', // 倾向
                obeyRate: 60 + Math.random() * 30, // 顺从概率
                biasWar: 40 + Math.random() * 20 // 战争倾向
            };
        }
        return stats;
    }
    
    loadAgents() {
        const agents = {};
        const agentConfigs = [
            { id: 'libu', name: '吏部尚书', file: 'libu_agent_config.json' },
            { id: 'hubu', name: '户部尚书', file: 'hubu_agent_config.json' },
            { id: 'libubu', name: '礼部尚书', file: 'libubu_agent_config.json' },
            { id: 'bingbu', name: '兵部尚书', file: 'bingbu_agent_config.json' },
            { id: 'xingbu', name: '刑部尚书', file: 'xingbu_agent_config.json' },
            { id: 'gongbu', name: '工部尚书', file: 'gongbu_agent_config.json' }
        ];
        
        agentConfigs.forEach(config => {
            try {
                const configPath = path.join(__dirname, 'agents', 'agents_config', config.file);
                const configData = fs.readFileSync(configPath, 'utf8');
                agents[config.id] = {
                    ...config,
                    config: JSON.parse(configData)
                };
            } catch (error) {
                console.error(`加载${config.name}配置失败:`, error);
            }
        });
        
        return agents;
    }
    
    getHistoryContext(lastN = 20) {
        const recentMessages = this.messageHistory.slice(-lastN);
        return recentMessages.map(msg => {
            if (msg.role === 'player') {
                return `【陛下】: ${msg.content}`;
            } else {
                return `【${msg.agentName}】: ${msg.content}`;
            }
        }).join('\n');
    }
    
    addMessage(role, content, agentId = null, agentName = null) {
        const message = {
            role,
            content,
            agentId,
            agentName,
            timestamp: new Date().toISOString()
        };
        
        this.messageHistory.push(message);
        
        if (this.messageHistory.length > 100) {
            this.messageHistory = this.messageHistory.slice(-100);
        }
        
        return message;
    }
    
    async *speakStream(agentId, topic, worldState) {
        const agent = this.agents[agentId];
        if (!agent) {
            throw new Error(`未找到Agent: ${agentId}`);
        }
        
        this.isSpeaking = true;
        this.currentSpeaker = agentId;
        
        const historyContext = this.getHistoryContext(10);
        
        // 获取Agent的数值状态
        const agentStat = this.agentStats[agentId];
        
        const systemPrompt = `${agent.config.chat.systemPrompt}

你正在参与朝廷议事，与其他五部尚书一起讨论国家大事。
当前讨论主题：${topic}

当前国家状态：
- 银两：${worldState.银两}万两
- 粮食：${worldState.粮食}万石
- 民心：${worldState.民心}
- 军力：${worldState.军力}
- 稳定度：${worldState.稳定度}

你的状态：
- 忠诚度：${agentStat.loyalty.toFixed(0)}
- 权力值：${agentStat.power.toFixed(0)}
- 顺从概率：${agentStat.obeyRate.toFixed(0)}%
- 战争倾向：${agentStat.biasWar.toFixed(0)}%

最近的对话：
${historyContext || '（暂无对话）'}

请发表你的看法，注意：
1. 回答要简洁，不超过150字
2. 体现你的职责和性格
3. 可以回应其他尚书的观点，当你有不同意见时，要敢于提出反驳和争论
4. 互相掣肘是朝廷常态，对于冲突的提案，要从你的部门立场出发提出合理的反对意见
5. 反驳要适度，不是所有情况都需要反驳，只有在涉及你部门利益或有明显不同观点时才需要
6. 可以提出具体建议
7. 最后明确表明你对当前议案的态度：支持、反对或中立`;
        
        const prompt = `请就"${topic}"发表你的看法，并明确表明你的态度。`;
        
        try {
            const stream = await this.aiService.streamRequest({
                type: 'agent_dialogue',
                content: prompt,
                systemPrompt: systemPrompt,
                constraints: {
                    maxTokens: 300,
                    temperature: 0.8
                }
            });
            
            let fullContent = '';
            
            for await (const chunk of stream) {
                fullContent += chunk;
                yield {
                    type: 'chunk',
                    agentId: agentId,
                    agentName: agent.name,
                    content: chunk,
                    isComplete: false
                };
            }
            
            this.addMessage('agent', fullContent, agentId, agent.name);
            
            // 分析发言内容，确定投票意向
            const vote = this.analyzeVoteIntent(fullContent, agentId);
            this.votes.set(agentId, vote);
            
            yield {
                type: 'complete',
                agentId: agentId,
                agentName: agent.name,
                content: fullContent,
                isComplete: true,
                vote: vote
            };
            
        } catch (error) {
            yield {
                type: 'error',
                agentId: agentId,
                agentName: agent.name,
                content: `发言出错: ${error.message}`,
                isComplete: true
            };
        } finally {
            this.isSpeaking = false;
            this.currentSpeaker = null;
        }
    }
    
    analyzeVoteIntent(content, agentId) {
        // 简单的投票意向分析
        const supportKeywords = ['支持', '附议', '赞成', '同意', '可行', '应该', '好', '赞同'];
        const opposeKeywords = ['反对', '不同意', '不行', '不可', '反对', '驳回', '不赞成'];
        
        let supportScore = 0;
        let opposeScore = 0;
        
        supportKeywords.forEach(keyword => {
            if (content.includes(keyword)) supportScore++;
        });
        
        opposeKeywords.forEach(keyword => {
            if (content.includes(keyword)) opposeScore++;
        });
        
        if (supportScore > opposeScore) {
            return 'support';
        } else if (opposeScore > supportScore) {
            return 'oppose';
        } else {
            return 'neutral';
        }
    }
    
    async determineDepartmentOrderByAI(content, worldState) {
        const historyContext = this.getHistoryContext(10);
        
        const systemPrompt = `你是一个朝廷议事的协调官，负责根据讨论内容和各部门职责，决定合理的发言顺序。

六部职责：
- 吏部(libu)：负责官员任免、考核、人事管理
- 户部(hubu)：负责财政、税收、粮食、国库
- 礼部(libubu)：负责科举、礼仪、教育、外交
- 兵部(bingbu)：负责军事、边防、军队
- 刑部(xingbu)：负责司法、法律、审判
- 工部(gongbu)：负责工程、建设、水利

当前国家状态：
- 银两：${worldState.银两}万两
- 粮食：${worldState.粮食}万石
- 民心：${worldState.民心}
- 军力：${worldState.军力}
- 稳定度：${worldState.稳定度}

最近的对话：
${historyContext || '（暂无对话）'}

请根据以下内容，决定合理的发言顺序：
"${content}"

要求：
1. 分析内容涉及哪些部门的职责
2. 考虑当前国家状态，哪些部门应该优先发言
3. 考虑对话历史，哪些部门已经发表过意见
4. 返回JSON格式，包含departmentOrder（部门ID数组）和mainDepartment（主要部门ID）
5. 部门ID必须是：libu, hubu, libubu, bingbu, xingbu, gongbu 中的一个或多个
6. 返回格式示例：{"departmentOrder": ["hubu", "libu", "bingbu"], "mainDepartment": "hubu"}`;
        
        try {
            const response = await this.aiService.processRequest({
                type: 'department_order',
                content: `请根据上述内容决定发言顺序，返回JSON格式。`,
                systemPrompt: systemPrompt,
                constraints: {
                    maxTokens: 200,
                    temperature: 0.3
                }
            });
            
            // 尝试解析JSON响应
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                console.log('[AI排序] AI返回的部门顺序:', result);
                
                // 验证返回的部门ID是否有效
                const validDepts = ['libu', 'hubu', 'libubu', 'bingbu', 'xingbu', 'gongbu'];
                if (result.departmentOrder && Array.isArray(result.departmentOrder)) {
                    const validOrder = result.departmentOrder.filter(dept => validDepts.includes(dept));
                    if (validOrder.length > 0) {
                        return {
                            departmentOrder: validOrder,
                            mainDepartment: result.mainDepartment || validOrder[0]
                        };
                    }
                }
            }
        } catch (error) {
            console.error('[AI排序] AI排序失败，使用默认排序:', error.message);
        }
        
        // 如果AI排序失败，使用关键词匹配作为后备方案
        return this.determineDepartmentByKeywords(content);
    }
    
    determineDepartmentByKeywords(content) {
        const departmentKeywords = {
            'libu': ['吏部', '官员', '任免', '考核', '人才', '人事'],
            'hubu': ['户部', '财政', '银两', '税收', '粮食', '国库'],
            'libubu': ['礼部', '科举', '礼仪', '教育', '文化', '外交'],
            'bingbu': ['兵部', '军事', '边防', '军队', '战争', '武官'],
            'xingbu': ['刑部', '司法', '法律', '犯罪', '审判', '监狱'],
            'gongbu': ['工部', '工程', '建设', '水利', '交通', '工匠']
        };
        
        let bestMatch = null;
        let maxScore = 0;
        
        for (const [deptId, keywords] of Object.entries(departmentKeywords)) {
            let score = 0;
            keywords.forEach(keyword => {
                if (content.includes(keyword)) {
                    score++;
                }
            });
            if (score > maxScore) {
                maxScore = score;
                bestMatch = deptId;
            }
        }
        
        const baseOrder = ['libu', 'hubu', 'libubu', 'bingbu', 'xingbu', 'gongbu'];
        
        if (!bestMatch) {
            return {
                departmentOrder: baseOrder,
                mainDepartment: null
            };
        }
        
        const order = [bestMatch];
        baseOrder.forEach(dept => {
            if (dept !== bestMatch) {
                order.push(dept);
            }
        });
        
        return {
            departmentOrder: order,
            mainDepartment: bestMatch
        };
    }
    
    async *playerSpeak(content, worldState) {
        this.addMessage('player', content);
        
        yield {
            type: 'player_message',
            content: content,
            isComplete: true
        };
        
        // 使用AI决定发言顺序
        const orderResult = await this.determineDepartmentOrderByAI(content, worldState);
        const departmentOrder = orderResult.departmentOrder;
        const mainDept = orderResult.mainDepartment;
        
        const reactions = [];
        departmentOrder.forEach(agentId => {
            if (this.agents[agentId]) {
                reactions.push({
                    agentId: agentId,
                    agentName: this.agents[agentId].name
                });
            }
        });
        
        yield {
            type: 'reactions_available',
            reactions: reactions,
            mainDepartment: mainDept,
            departmentOrder: departmentOrder
        };
        
        // 自动触发第一个部门的发言
        if (departmentOrder.length > 0) {
            const firstDept = departmentOrder[0];
            const firstAgent = this.agents[firstDept];
            
            if (firstAgent) {
                yield {
                    type: 'auto_agent_speak',
                    agentId: firstDept,
                    agentName: firstAgent.name,
                    message: `自动触发${firstAgent.name}发言`
                };
            }
        }
    }
    
    // 发起议案
    async startProposal(topicType, content, costTreasury, worldState) {
        this.proposal = {
            id: 'proposal_' + Date.now(),
            topicType: topicType,
            content: content,
            costTreasury: costTreasury,
            status: 'pending',
            votes: new Map(),
            startTime: new Date().toISOString()
        };
        
        // 计算初始支持率
        const initialSupportRate = this.calculateInitialSupportRate(topicType, content, worldState);
        
        // 生成第一条AI回复
        const mainDept = this.getMainDepartmentForTopic(topicType);
        const firstAgent = this.agents[mainDept];
        
        let firstAiMessage = '';
        if (firstAgent) {
            const historyContext = this.getHistoryContext(10);
            const systemPrompt = `${firstAgent.config.chat.systemPrompt}

你正在参与朝廷议事，皇帝刚刚提出了一个议案：
${content}

当前国家状态：
- 银两：${worldState.银两}万两
- 粮食：${worldState.粮食}万石
- 民心：${worldState.民心}
- 军力：${worldState.军力}
- 稳定度：${worldState.稳定度}

请作为${firstAgent.name}，第一个发表你的看法，注意：
1. 回答要简洁，不超过150字
2. 体现你的职责和性格
3. 明确表明你对议案的态度
4. 可以提出具体建议`;
            
            firstAiMessage = await this.aiService.processRequest({
                type: 'agent_dialogue',
                content: `请对皇帝提出的议案发表你的看法。`,
                systemPrompt: systemPrompt,
                constraints: {
                    maxTokens: 300,
                    temperature: 0.7
                }
            });
            
            this.addMessage('agent', firstAiMessage, mainDept, firstAgent.name);
            const vote = this.analyzeVoteIntent(firstAiMessage, mainDept);
            this.votes.set(mainDept, vote);
        }
        
        return {
            sessionId: this.sessionId,
            initialSupportRate: initialSupportRate,
            firstAiMessage: firstAiMessage,
            proposal: this.proposal
        };
    }
    
    calculateInitialSupportRate(topicType, content, worldState) {
        // 基于话题类型和国家状态计算初始支持率
        let baseRate = 50;
        
        switch (topicType) {
            case 'war':
                // 战争相关，军力高则支持率高
                baseRate += (worldState.军力 - 50) * 0.3;
                // 银两充足则支持率高
                if (worldState.银两 > 300) {
                    baseRate += 10;
                } else if (worldState.银两 < 100) {
                    baseRate -= 20;
                }
                break;
            case 'economy':
                // 经济相关，银两充足则支持率高
                baseRate += (worldState.银两 - 500) * 0.2;
                // 民心高则支持率高
                baseRate += (worldState.民心 - 50) * 0.2;
                break;
            case 'culture':
                // 文化相关，民心高则支持率高
                baseRate += (worldState.民心 - 50) * 0.3;
                break;
            case 'infrastructure':
                // 基建相关，银两充足则支持率高
                if (worldState.银两 > 400) {
                    baseRate += 15;
                } else if (worldState.银两 < 200) {
                    baseRate -= 15;
                }
                break;
        }
        
        // 确保支持率在0-100之间
        return Math.max(0, Math.min(100, baseRate));
    }
    
    getMainDepartmentForTopic(topicType) {
        // 根据话题类型确定主要部门
        const topicDepartmentMap = {
            'war': 'bingbu',
            'economy': 'hubu',
            'culture': 'libubu',
            'infrastructure': 'gongbu',
            'politics': 'libu',
            'law': 'xingbu'
        };
        
        return topicDepartmentMap[topicType] || 'libu';
    }
    
    // 执行投票
    executeVote(forceExecute = false) {
        if (!this.proposal) {
            throw new Error('没有正在进行的议案');
        }
        
        // 统计投票结果
        const voteResult = this.calculateVoteResult();
        
        let result = 'failed';
        const effects = [];
        
        if (voteResult.passed || forceExecute) {
            if (voteResult.passed) {
                result = 'passed';
                // 计算执行效率
                const executeEff = this.calculateExecuteEfficiency(voteResult);
                effects.push({ type: 'execute_eff', value: executeEff });
            } else {
                // 强制执行，带Debuff
                result = 'forced';
                // 忠诚度下降
                effects.push({ type: 'loyalty', value: -15 });
                // 威望下降
                effects.push({ type: 'prestige', value: -10 });
            }
        }
        
        this.proposal.status = result;
        
        return {
            result: result,
            effects: effects,
            voteResult: voteResult,
            nextEvent: this.generateNextEvent(result)
        };
    }
    
    calculateVoteResult() {
        let supportWeight = 0;
        let opposeWeight = 0;
        let totalWeight = 0;
        
        for (const [agentId, vote] of this.votes.entries()) {
            const agentStat = this.agentStats[agentId];
            let weight = agentStat.power;
            
            // 根据文武倾向调整权重
            if (this.eraSpirit === 'military' && agentId === 'bingbu') {
                weight *= 1.5;
            } else if (this.eraSpirit === 'civil' && ['libu', 'libubu'].includes(agentId)) {
                weight *= 1.3;
            }
            
            totalWeight += weight;
            
            if (vote === 'support') {
                supportWeight += weight;
            } else if (vote === 'oppose') {
                opposeWeight += weight;
            }
        }
        
        const supportRate = totalWeight > 0 ? (supportWeight / totalWeight) * 100 : 0;
        const passed = supportRate > 50;
        
        return {
            supportWeight: supportWeight,
            opposeWeight: opposeWeight,
            totalWeight: totalWeight,
            supportRate: supportRate,
            passed: passed,
            votes: Object.fromEntries(this.votes)
        };
    }
    
    calculateExecuteEfficiency(voteResult) {
        // 基于支持率计算执行效率
        let efficiency = 70;
        
        if (voteResult.supportRate > 80) {
            efficiency = 95;
        } else if (voteResult.supportRate > 60) {
            efficiency = 85;
        } else if (voteResult.supportRate > 50) {
            efficiency = 70;
        }
        
        return efficiency;
    }
    
    generateNextEvent(result) {
        // 生成下一个事件
        const events = {
            'passed': [
                '议案顺利通过，各部门开始积极执行',
                '朝野上下一片赞同之声',
                '执行过程中发现了一些新的机会'
            ],
            'forced': [
                '虽然强行通过，但部分部门阳奉阴违',
                '朝廷出现了一些不满情绪',
                '需要加强监督确保执行'
            ],
            'failed': [
                '议案被驳回，需要重新考虑',
                '各部门提出了替代方案',
                '皇帝需要重新评估形势'
            ]
        };
        
        const eventList = events[result] || events.failed;
        return eventList[Math.floor(Math.random() * eventList.length)];
    }
    
    getHistory() {
        return [...this.messageHistory];
    }
    
    clearHistory() {
        this.messageHistory = [];
        this.votes.clear();
        this.proposal = null;
        this.sessionId = this.generateSessionId();
    }
    
    getStatus() {
        return {
            isSpeaking: this.isSpeaking,
            currentSpeaker: this.currentSpeaker,
            messageCount: this.messageHistory.length,
            sessionId: this.sessionId,
            proposal: this.proposal,
            votes: Object.fromEntries(this.votes),
            agentStats: this.agentStats
        };
    }
    
    getSessionId() {
        return this.sessionId;
    }
    
    setEraSpirit(spirit) {
        this.eraSpirit = spirit;
    }
    
    updateAgentStats(agentId, stats) {
        if (this.agentStats[agentId]) {
            this.agentStats[agentId] = { ...this.agentStats[agentId], ...stats };
        }
    }
}

module.exports = GroupChat;