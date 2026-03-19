/**
 * 兵部 Agent 层 - 兵部尚书
 * 职责：掌管选用武官及兵籍、军械、军令等事务
 * 相当于现代：国防部
 */

const fs = require('fs');
const path = require('path');
const AIService = require('../ai_service');

class BingbuAgent {
    constructor() {
        this.config = this.loadConfig();
        
        this.identity = this.config.agent.identity;
        this.personality = this.config.agent.personality;
        this.goals = this.config.agent.goals;
        this.responsibilities = this.config.agent.responsibilities;
        this.memory = [];
        this.aiService = new AIService();
    }
    
    loadConfig() {
        const configPath = path.join(__dirname, 'agents_config', 'bingbu_agent_config.json');
        try {
            const configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.error('[BingbuAgent] 加载配置文件失败:', error);
            return {
                agent: {
                    name: "兵部尚书",
                    identity: "兵部尚书",
                    personality: "刚毅果敢，精通兵法，重视军备",
                    goals: ["保家卫国", "训练军队", "管理军械"],
                    responsibilities: ["管理兵籍", "管理军械", "维护边境"]
                },
                prompts: {
                    systemPrompt: "你是兵部尚书，正在向皇帝上奏军事事宜。",
                    reportTemplate: "请生成军事奏折，要点：{{issue}}",
                    constraints: { maxTokens: 1000, temperature: 0.7 }
                },
                fallback: {
                    options: ["加强军事训练", "更新军械", "改革武官选拔"]
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

        if (world.民心 >= events.borderSecurity.threshold) {
            if (randomFactor < events.borderSecurity.probability) {
                issue = events.borderSecurity.variants[0].replace('{{people}}', world.民心);
            } else {
                issue = events.borderSecurity.variants[1];
            }
        }
        else if (world.银两 >= events.weaponry.threshold) {
            if (randomFactor < events.weaponry.probability) {
                issue = events.weaponry.variants[0].replace('{{silver}}', world.银两);
            } else {
                issue = events.weaponry.variants[1].replace('{{silver}}', world.银两);
            }
        }
        else if (world.银两 >= events.militaryTraining.threshold) {
            if (randomFactor < events.militaryTraining.probability) {
                issue = events.militaryTraining.variants[0];
            } else {
                issue = events.militaryTraining.variants[1];
            }
        }
        else if (world.银两 >= events.officerSelection.threshold) {
            if (randomFactor < events.officerSelection.probability) {
                issue = events.officerSelection.variants[0];
            } else {
                issue = events.officerSelection.variants[1];
            }
        }
        else if (events.militaryStrength && world.军力 < events.militaryStrength.threshold) {
            if (randomFactor < events.militaryStrength.probability) {
                issue = events.militaryStrength.variants[0].replace('{{military}}', world.军力);
            } else {
                issue = events.militaryStrength.variants[1].replace('{{military}}', world.军力);
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
            issue = normalEvents[index];
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
        prompt = prompt.replace(/\{\{military\}\}/g, world.军力);
        prompt = prompt.replace(/\{\{prestige\}\}/g, world.威望);
        prompt = prompt.replace(/\{\{silver\}\}/g, world.银两);
        prompt = prompt.replace(/\{\{people\}\}/g, world.民心);
        
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
        const chatConfig = this.config.chat || {};
        const systemPrompt = chatConfig.systemPrompt || this.config.prompts.systemPrompt;

        let contextPrompt = '';
        if (historyContext) {
            contextPrompt = `\n\n对话历史：\n${historyContext}\n`;
        }

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

module.exports = BingbuAgent;
