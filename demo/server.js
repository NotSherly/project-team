/**
 * 后端 API 服务器
 * 为前端可视化提供接口服务
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const { 
    world, 
    runWorldTurn, 
    checkEvents, 
    addRecentEvent, 
    addPlayerAction,
    setDepartmentMemorial,
    getDepartmentMemorial,
    getAllDepartmentMemorials,
    clearDepartmentMemorials,
    updateWorldValue,
    getWorldState,
    checkGameEnd,
    getDepartmentList
} = require('./world');

const LibuAgent = require('./agents/libu_agent');
const HubuAgent = require('./agents/hubu_agent');
const LibubuAgent = require('./agents/libubu_agent');
const BingbuAgent = require('./agents/bingbu_agent');
const XingbuAgent = require('./agents/xingbu_agent');
const GongbuAgent = require('./agents/gongbu_agent');
const NarrativeAgent = require('./agents/narrative_agent');
const AIService = require('./ai_service');
const GroupChat = require('./group_chat');
const gameState = require('./game_state');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const agents = {
    'libu': { agent: null, class: LibuAgent, name: '吏部尚书' },
    'hubu': { agent: null, class: HubuAgent, name: '户部尚书' },
    'libubu': { agent: null, class: LibubuAgent, name: '礼部尚书' },
    'bingbu': { agent: null, class: BingbuAgent, name: '兵部尚书' },
    'xingbu': { agent: null, class: XingbuAgent, name: '刑部尚书' },
    'gongbu': { agent: null, class: GongbuAgent, name: '工部尚书' }
};

function initAgents() {
    for (const key in agents) {
        agents[key].agent = new agents[key].class();
    }
}

async function generateNarrative(worldState) {
    const narrativeAgent = new NarrativeAgent();
    const events = checkEvents();
    
    const narrative = await narrativeAgent.generateNarrative(worldState, {
        report: `当前事件：${events.join('、')}`,
        options: []
    });
    
    return narrative;
}

async function generateAllMemorials(worldState) {
    clearDepartmentMemorials();
    const memorials = {};
    
    for (const key in agents) {
        const agentData = agents[key];
        
        agentData.agent.observeWorld(worldState);
        const memorial = await agentData.agent.act();
        
        setDepartmentMemorial(key, memorial);
        memorials[key] = memorial;
    }
    
    return memorials;
}



app.post('/api/game/start', async (req, res) => {
    try {
        initAgents();
        
        const worldState = getWorldState();
        const narrative = await generateNarrative(worldState);
        const memorials = await generateAllMemorials(worldState);
        
        res.json({
            success: true,
            data: {
                worldState: worldState,
                narrative: narrative,
                memorials: memorials,
                events: checkEvents()
            }
        });
    } catch (error) {
        console.error('启动游戏失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/game/next-turn', async (req, res) => {
    try {
        const { decisions, chatHistory } = req.body;
        
        if (decisions && decisions.length > 0) {
            const decisionsSummary = decisions.map(d => `[${d.department}] ${d.action}`).join('\n');
            
            const aiService = new AIService();
            const prompt = `陛下本回合做出了以下决策：

${decisionsSummary}

当前国家状态：
- 时间：${world.时间}
- 银两：${world.银两}万两
- 粮食：${world.粮食}万石
- 民心：${world.民心}
- 军力：${world.军力}
- 稳定度：${world.稳定度}
- 威望：${world.威望}
- 文化：${world.文化}
- 工程：${world.工程}
- 法律：${world.法律}

请综合分析这些决策对国家的影响，并以JSON格式返回各项数值的变化。考虑决策之间的相互影响和综合效果。

请以JSON格式返回数值变化，例如：
{"银两": -10, "粮食": 20, "民心": 5, "军力": 0, "稳定度": 5, "威望": 3, "文化": 0, "工程": 5, "法律": 0}`;

            try {
                const aiResponse = await aiService.processRequest({
                    type: 'agent_dialogue',
                    content: prompt,
                    systemPrompt: '你是朝廷的决策顾问，负责综合分析皇帝的各项决策对国家的影响。请根据决策内容合理预测数值变化。',
                    constraints: {
                        maxTokens: 800,
                        temperature: 0.7
                    }
                });
                
                const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/);
                if (jsonMatch) {
                    try {
                        const changes = JSON.parse(jsonMatch[0]);
                        for (const key in changes) {
                            updateWorldValue(key, changes[key]);
                        }
                    } catch (parseError) {
                        console.error('解析AI响应失败:', parseError);
                    }
                }
            } catch (aiError) {
                console.error('AI分析失败:', aiError);
            }
            
            decisions.forEach(decision => {
                addPlayerAction({ 
                    type: decision.type || '执行建议', 
                    description: `[${decision.department}] ${decision.action}` 
                });
                addRecentEvent({
                    title: `执行${decision.department}决策`,
                    description: decision.action,
                    department: decision.department
                });
            });
        }
        
        const worldState = runWorldTurn();
        const events = checkEvents();
        const narrative = await generateNarrative(worldState);
        const memorials = await generateAllMemorials(worldState);
        
        res.json({
            success: true,
            data: {
                worldState: worldState,
                narrative: narrative,
                memorials: memorials,
                events: events
            }
        });
    } catch (error) {
        console.error('下一回合失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/game/chat', async (req, res) => {
    try {
        const { department, message, worldState, memorial } = req.body;
        
        const agentData = agents[department];
        if (!agentData) {
            return res.status(400).json({
                success: false,
                error: '无效的部门'
            });
        }
        
        const aiService = new AIService();
        const prompt = `陛下向您问询：${message}

当前国家状态：
- 时间：${worldState.时间}
- 银两：${worldState.银两}万两
- 粮食：${worldState.粮食}万石
- 民心：${worldState.民心}
- 军力：${worldState.军力}
- 稳定度：${worldState.稳定度}

您刚才的奏折要点：
${memorial ? memorial.report.substring(0, 300) + '...' : '暂无'}

请作为${agentData.name}，简明扼要地回答陛下的问题，体现您的职责和性格。回答要简洁，不超过200字。`;

        const response = await aiService.processRequest({
            type: 'agent_dialogue',
            content: prompt,
            systemPrompt: `你是${agentData.name}，正在回答皇帝的问询。请根据你的职责和性格，简洁明了地回答问题。`,
            constraints: {
                maxTokens: 300,
                temperature: 0.7
            }
        });
        
        res.json({
            success: true,
            data: {
                response: response
            }
        });
    } catch (error) {
        console.error('对话失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/departments', (req, res) => {
    res.json({
        success: true,
        data: getDepartmentList()
    });
});

app.get('/api/memorial/:department', (req, res) => {
    const { department } = req.params;
    const memorial = getDepartmentMemorial(department);
    
    if (!memorial) {
        return res.status(404).json({
            success: false,
            error: '未找到该部门的奏折'
        });
    }
    
    res.json({
        success: true,
        data: memorial
    });
});

let groupChatInstance = null;

app.post('/api/group-chat/start', (req, res) => {
    groupChatInstance = new GroupChat();
    res.json({
        success: true,
        data: {
            message: '群聊已开始',
            agents: Object.keys(groupChatInstance.agents).map(id => ({
                id,
                name: groupChatInstance.agents[id].name
            }))
        }
    });
});

app.get('/api/group-chat/history', (req, res) => {
    if (!groupChatInstance) {
        return res.json({
            success: true,
            data: { history: [] }
        });
    }
    
    res.json({
        success: true,
        data: {
            history: groupChatInstance.getHistory(),
            status: groupChatInstance.getStatus()
        }
    });
});

app.post('/api/group-chat/player-speak', async (req, res) => {
    if (!groupChatInstance) {
        groupChatInstance = new GroupChat();
    }
    
    const { message, worldState } = req.body;
    
    const generator = groupChatInstance.playerSpeak(message, worldState);
    let finalResult = {};
    let departmentOrder = null;
    let mainDepartment = null;
    
    for await (const result of generator) {
        if (result.type === 'reactions_available') {
            departmentOrder = result.departmentOrder;
            mainDepartment = result.mainDepartment;
            finalResult = result;
        } else if (result.type === 'auto_agent_speak') {
            // 保留部门顺序信息
            finalResult = {
                ...result,
                departmentOrder: departmentOrder,
                mainDepartment: mainDepartment
            };
        }
    }
    
    res.json({
        success: true,
        data: finalResult
    });
});

app.post('/api/group-chat/agent-speak', async (req, res) => {
    if (!groupChatInstance) {
        groupChatInstance = new GroupChat();
    }
    
    const { agentId, topic, worldState } = req.body;
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    try {
        const generator = groupChatInstance.speakStream(agentId, topic, worldState);
        
        for await (const result of generator) {
            res.write(`data: ${JSON.stringify(result)}\n\n`);
        }
        
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        res.write(`data: ${JSON.stringify({ type: 'error', content: error.message })}\n\n`);
        res.end();
    }
});

app.post('/api/group-chat/agent-speak-sync', async (req, res) => {
    if (!groupChatInstance) {
        groupChatInstance = new GroupChat();
    }
    
    const { agentId, topic, worldState } = req.body;
    
    try {
        let fullContent = '';
        const generator = groupChatInstance.speakStream(agentId, topic, worldState);
        
        for await (const result of generator) {
            if (result.type === 'chunk') {
                fullContent += result.content;
            }
        }
        
        res.json({
            success: true,
            data: {
                agentId: agentId,
                agentName: groupChatInstance.agents[agentId]?.name,
                content: fullContent,
                history: groupChatInstance.getHistory()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/group-chat/status', (req, res) => {
    if (!groupChatInstance) {
        return res.json({
            success: true,
            data: {
                isSpeaking: false,
                currentSpeaker: null,
                messageCount: 0
            }
        });
    }
    
    res.json({
        success: true,
        data: groupChatInstance.getStatus()
    });
});

// 私聊相关接口
const chatHistory = {};

app.post('/api/chat/private', async (req, res) => {
    try {
        const { agentId, message } = req.body;

        const agentData = agents[agentId];
        if (!agentData) {
            return res.status(400).json({
                success: false,
                error: '无效的Agent ID'
            });
        }

        // 确保agent实例存在
        if (!agentData.agent) {
            agentData.agent = new agentData.class();
        }

        // 获取当前世界状态
        const worldState = getWorldState();

        // 观察世界
        agentData.agent.observeWorld(worldState);

        // 获取聊天历史上下文（最近5条消息）
        if (!chatHistory[agentId]) {
            chatHistory[agentId] = [];
        }
        const recentHistory = chatHistory[agentId].slice(-10);
        const historyContext = recentHistory.map(msg =>
            `${msg.senderId === 'player' ? '陛下' : agentData.name}：${msg.content}`
        ).join('\n');

        // 使用Agent的私聊方法生成回复
        const response = await agentData.agent.privateChat(message, worldState, historyContext);

        // 保存聊天历史
        const timestamp = Date.now();
        chatHistory[agentId].push({
            id: `msg_${timestamp}_player`,
            senderId: 'player',
            content: message,
            timestamp: timestamp
        });

        chatHistory[agentId].push({
            id: `msg_${timestamp}_agent`,
            senderId: agentId,
            content: response,
            timestamp: timestamp
        });

        // 限制历史记录长度
        if (chatHistory[agentId].length > 50) {
            chatHistory[agentId] = chatHistory[agentId].slice(-50);
        }

        res.json({
            success: true,
            data: {
                message: response
            }
        });
    } catch (error) {
        console.error('私聊失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/chat/history', (req, res) => {
    try {
        const { agentId } = req.query;
        
        if (!agentId) {
            return res.status(400).json({
                success: false,
                error: '缺少agentId参数'
            });
        }
        
        const history = chatHistory[agentId] || [];
        
        res.json({
            success: true,
            data: {
                messages: history
            }
        });
    } catch (error) {
        console.error('获取聊天历史失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/agents', (req, res) => {
    try {
        const agentList = Object.keys(agents).map(key => ({
            id: key,
            name: agents[key].name,
            department: key
        }));
        
        res.json({
            success: true,
            data: {
                agents: agentList
            }
        });
    } catch (error) {
        console.error('获取Agent列表失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 议案发起与群聊初始化接口
app.post('/api/group-chat/proposal/start', async (req, res) => {
    try {
        const { topic_type, content, cost_treasury } = req.body;
        
        if (!topic_type || !content) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数'
            });
        }
        
        if (!groupChatInstance) {
            groupChatInstance = new GroupChat();
        }
        
        const worldState = getWorldState();
        const result = await groupChatInstance.startProposal(topic_type, content, cost_treasury, worldState);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('发起议案失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 投票执行接口
app.post('/api/group-chat/vote/execute', (req, res) => {
    try {
        const { session_id, force_execute } = req.body;
        
        if (!groupChatInstance) {
            return res.status(400).json({
                success: false,
                error: '群聊未初始化'
            });
        }
        
        if (groupChatInstance.getSessionId() !== session_id) {
            return res.status(400).json({
                success: false,
                error: '会话ID不匹配'
            });
        }
        
        const result = groupChatInstance.executeVote(force_execute || false);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('执行投票失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 实时消息流接口（EventSource）
app.get('/api/group-chat/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // 定期发送消息
    const interval = setInterval(() => {
        if (groupChatInstance) {
            const status = groupChatInstance.getStatus();
            res.write(`data: ${JSON.stringify({ type: 'status', data: status })}\n\n`);
        }
    }, 2000);
    
    // 处理客户端断开连接
    req.on('close', () => {
        clearInterval(interval);
        res.end();
    });
});

// 设置文武倾向接口
app.post('/api/group-chat/era-spirit', (req, res) => {
    try {
        const { spirit } = req.body;
        
        if (!groupChatInstance) {
            groupChatInstance = new GroupChat();
        }
        
        if (['balanced', 'military', 'civil'].includes(spirit)) {
            groupChatInstance.setEraSpirit(spirit);
            res.json({
                success: true,
                data: { message: `已设置文武倾向为: ${spirit}` }
            });
        } else {
            res.status(400).json({
                success: false,
                error: '无效的文武倾向，可选值: balanced, military, civil'
            });
        }
    } catch (error) {
        console.error('设置文武倾向失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 全局状态快照接口
app.get('/api/game/state', (req, res) => {
    try {
        const state = gameState.getState();
        res.json({
            success: true,
            data: state
        });
    } catch (error) {
        console.error('获取游戏状态失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 手动触发回合结算接口
app.post('/api/game/round/end', async (req, res) => {
    try {
        const result = await gameState.triggerRoundEnd();
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('执行回合结算失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 模拟天灾接口
app.post('/api/game/disaster', (req, res) => {
    try {
        const result = gameState.triggerDisaster();
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('触发天灾失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 游戏状态实时流接口
app.get('/api/game/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // 发送初始状态
    const initialState = gameState.getState();
    res.write(`data: ${JSON.stringify({ type: 'INITIAL_STATE', data: initialState })}\n\n`);
    
    // 订阅状态变更
    const unsubscribe = gameState.subscribe((message) => {
        try {
            res.write(`data: ${JSON.stringify(message)}\n\n`);
        } catch (error) {
            console.error('发送状态更新失败:', error);
        }
    });
    
    // 处理客户端断开连接
    req.on('close', () => {
        unsubscribe();
        res.end();
    });
});

app.listen(PORT, () => {
    console.log(`服务器已启动: http://localhost:${PORT}`);
    console.log(`可视化界面: http://localhost:${PORT}/index.html`);
});
