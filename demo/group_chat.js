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
        
        const systemPrompt = `${agent.config.chat.systemPrompt}

你正在参与朝廷议事，与其他五部尚书一起讨论国家大事。
当前讨论主题：${topic}

当前国家状态：
- 银两：${worldState.银两}万两
- 粮食：${worldState.粮食}万石
- 民心：${worldState.民心}
- 军力：${worldState.军力}
- 稳定度：${worldState.稳定度}

最近的对话：
${historyContext || '（暂无对话）'}

请发表你的看法，注意：
1. 回答要简洁，不超过150字
2. 体现你的职责和性格
3. 可以回应其他尚书的观点，当你有不同意见时，要敢于提出反驳和争论
4. 互相掣肘是朝廷常态，对于冲突的提案，要从你的部门立场出发提出合理的反对意见
5. 反驳要适度，不是所有情况都需要反驳，只有在涉及你部门利益或有明显不同观点时才需要
6. 可以提出具体建议`;

        const prompt = `请就"${topic}"发表你的看法。`;
        
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
            
            yield {
                type: 'complete',
                agentId: agentId,
                agentName: agent.name,
                content: fullContent,
                isComplete: true
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
    
    getHistory() {
        return [...this.messageHistory];
    }
    
    clearHistory() {
        this.messageHistory = [];
    }
    
    getStatus() {
        return {
            isSpeaking: this.isSpeaking,
            currentSpeaker: this.currentSpeaker,
            messageCount: this.messageHistory.length
        };
    }
}

module.exports = GroupChat;
