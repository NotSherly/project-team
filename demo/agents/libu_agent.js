/**
 * NPC Agent层 - 吏部尚书
 * 优化点：
 * 1. 将 prompt 和配置提取到外部 JSON 文件
 * 2. think() 引入随机因素，增加事件多样性，并考虑银两、时间等更多维度。
 * 3. 事件类型更丰富，包括粮荒、民变、财政、祥瑞、贪腐、边关等。
 * 4. 在阈值附近设置概率分支，避免每次触发完全相同的内容。
 * 5. act() 中的提示词强化了人物性格和格式要求，并明确禁止虚构额外数据。
 * 6. 使用AIService统一管理LLM调用和缓存。
 */

const fs = require('fs');
const path = require('path');
const AIService = require('../ai_service');

class LibuAgent {
    constructor() {
        this.config = this.loadConfig();
        
        this.identity = this.config.agent.identity;
        this.personality = this.config.agent.personality;
        this.goals = this.config.agent.goals;
        this.memory = [];
        this.aiService = new AIService();
    }
    
    loadConfig() {
        const configPath = path.join(__dirname, 'agents_config', 'libu_agent_config.json');
        try {
            const configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.error('[LibuAgent] 加载配置文件失败:', error);
            return {
                agent: {
                    name: "吏部尚书",
                    identity: "吏部尚书",
                    personality: "忠心耿耿，直言敢谏",
                    goals: ["维护朝廷稳定", "保障民生"]
                },
                prompts: {
                    systemPrompt: "你是吏部尚书，正在向皇帝上奏。",
                    reportTemplate: "请生成奏折，要点：{{issue}}",
                    constraints: { maxTokens: 1000, temperature: 0.7 }
                },
                fallback: {
                    options: ["开仓放粮", "加税", "调查情况"]
                }
            };
        }
    }
    
    observeWorld(world) {
        this.currentWorld = world;
        return world;
    }
    
    think() {
        const world = this.currentWorld;
        const randomFactor = Math.random();
        const events = this.config.events;
        let issue = "";

        if (world.粮食 < events.foodCrisis.threshold) {
            if (randomFactor < events.foodCrisis.probability) {
                issue = events.foodCrisis.variants[0].replace('{{food}}', world.粮食);
            } else {
                issue = events.foodCrisis.variants[1];
            }
        }
        else if (world.民心 < events.unrest.threshold) {
            if (randomFactor < events.unrest.probability) {
                issue = events.unrest.variants[0].replace('{{people}}', world.民心);
            } else {
                issue = events.unrest.variants[1];
            }
        }
        else if (world.银两 < events.finance.threshold) {
            if (randomFactor < events.finance.probability) {
                issue = events.finance.variants[0].replace('{{silver}}', world.银两);
            } else {
                issue = events.finance.variants[1];
            }
        }
        else if (events.stability && world.稳定度 < events.stability.threshold) {
            if (randomFactor < events.stability.probability) {
                issue = events.stability.variants[0].replace('{{stability}}', world.稳定度);
            } else {
                issue = events.stability.variants[1].replace('{{stability}}', world.稳定度);
            }
        }
        else if (events.prestige && world.威望 < events.prestige.threshold) {
            if (randomFactor < events.prestige.probability) {
                issue = events.prestige.variants[0].replace('{{prestige}}', world.威望);
            } else {
                issue = events.prestige.variants[1];
            }
        }
        else {
            const season = this.getSeason(world.时间);
            const normalEvents = events.normal.variants;
            const index = Math.floor(randomFactor * normalEvents.length);
            issue = normalEvents[index].replace('{{season}}', season);
        }

        return issue;
    }

    getSeason(timeStr) {
        if (timeStr.includes('春')) return '春季';
        if (timeStr.includes('夏')) return '夏季';
        if (timeStr.includes('秋')) return '秋季';
        if (timeStr.includes('冬')) return '冬季';
        return '此时';
    }
    
    async act() {
        const world = this.currentWorld;
        const 奏折要点 = this.think();
        
        let prompt = this.config.prompts.reportTemplate;
        prompt = prompt.replace('{{issue}}', 奏折要点);
        prompt = prompt.replace(/\{\{silver\}\}/g, world.银两);
        prompt = prompt.replace(/\{\{food\}\}/g, world.粮食);
        prompt = prompt.replace(/\{\{people\}\}/g, world.民心);
        prompt = prompt.replace(/\{\{stability\}\}/g, world.稳定度);
        prompt = prompt.replace(/\{\{prestige\}\}/g, world.威望);
        
        const 生成的内容 = await this.aiService.processRequest({
            type: 'agent_dialogue',
            content: prompt,
            systemPrompt: this.config.prompts.systemPrompt,
            constraints: this.config.prompts.constraints
        });
        
        this.memory.push({
            timestamp: new Date().toISOString(),
            content: 生成的内容
        });
        
        const { report, options } = this.extractReportAndOptions(生成的内容);
        
        return {
            report: report,
            options: options
        };
    }
    
    async privateChat(message, worldState, historyContext = '') {
        // 使用Agent配置中的私聊系统提示词
        const chatConfig = this.config.chat || {};
        const systemPrompt = chatConfig.systemPrompt || this.config.prompts.systemPrompt;

        // 构建上下文提示
        let contextPrompt = '';
        if (historyContext) {
            contextPrompt = `\n\n对话历史：\n${historyContext}\n`;
        }

        // 构建完整的提示词
        const prompt = `${contextPrompt}
当前国家状态：
- 时间：${worldState.时间}
- 银两：${worldState.银两}万两
- 粮食：${worldState.粮食}万石
- 民心：${worldState.民心}
- 军力：${worldState.军力}
- 稳定度：${worldState.稳定度}
- 威望：${worldState.威望}

陛下问询：${message}

请作为${this.config.agent.name}，根据你的职责和性格回答陛下的问题。${chatConfig.responseStyle || '回答要简洁，不超过200字。'}`;

        // 调用AI服务生成回复
        const response = await this.aiService.processRequest({
            type: 'agent_dialogue',
            content: prompt,
            systemPrompt: systemPrompt,
            constraints: {
                maxTokens: 400,
                temperature: 0.7
            }
        });

        return response;
    }

    extractReportAndOptions(text) {
        const lines = text.split('\n');
        const reportLines = [];
        const options = [];
        let inOptions = false;
        
        for (let line of lines) {
            if (line.match(/^\d+\.\s/)) {
                inOptions = true;
                options.push(line.replace(/^\d+\.\s/, ''));
            } else if (inOptions && line.trim() === '') {
            } else if (inOptions) {
                if (options.length > 0) {
                    options[options.length - 1] += ' ' + line.trim();
                }
            } else {
                reportLines.push(line);
            }
        }
        
        const report = reportLines.join('\n');
        
        if (options.length === 0) {
            return {
                report: report,
                options: this.config.fallback.options
            };
        }
        
        return {
            report: report,
            options: options
        };
    }
}

module.exports = LibuAgent;
