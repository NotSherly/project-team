/**
 * 户部 Agent 层 - 户部尚书
 * 职责：掌管户籍财经，统计人口田亩，征收赋税，管理国家财政
 * 相当于现代：民政部 + 财政部 + 国家税务总局
 */

const fs = require('fs');
const path = require('path');
const AIService = require('../ai_service');

class HubuAgent {
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
        const configPath = path.join(__dirname, 'agents_config', 'hubu_agent_config.json');
        try {
            const configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.error('[HubuAgent] 加载配置文件失败:', error);
            return {
                agent: {
                    name: "户部尚书",
                    identity: "户部尚书",
                    personality: "精明干练，善于理财，注重实效",
                    goals: ["充盈国库", "合理征税", "管理户籍田亩"],
                    responsibilities: ["统计人口田亩", "征收赋税", "管理财政"]
                },
                prompts: {
                    systemPrompt: "你是户部尚书，正在向皇帝汇报财政状况。",
                    reportTemplate: "请生成财政奏折，要点：{{issue}}",
                    constraints: { maxTokens: 1000, temperature: 0.7 }
                },
                fallback: {
                    options: ["整顿税收", "削减开支", "开垦荒地"]
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

        if (world.银两 >= events.taxRevenue.threshold) {
            if (randomFactor < events.taxRevenue.probability) {
                issue = events.taxRevenue.variants[0].replace('{{silver}}', world.银两);
            } else {
                issue = events.taxRevenue.variants[1].replace('{{silver}}', world.银两);
            }
        }
        else if (world.银两 < events.taxShortage.threshold) {
            if (randomFactor < events.taxShortage.probability) {
                issue = events.taxShortage.variants[0].replace('{{silver}}', world.银两);
            } else {
                issue = events.taxShortage.variants[1].replace('{{silver}}', world.银两);
            }
        }
        else if (world.民心 >= events.populationGrowth.threshold) {
            if (randomFactor < events.populationGrowth.probability) {
                issue = events.populationGrowth.variants[0].replace('{{people}}', world.民心);
            } else {
                issue = events.populationGrowth.variants[1].replace('{{people}}', world.民心);
            }
        }
        else if (world.粮食 < events.landManagement.threshold) {
            if (randomFactor < events.landManagement.probability) {
                issue = events.landManagement.variants[0].replace('{{food}}', world.粮食);
            } else {
                issue = events.landManagement.variants[1].replace('{{food}}', world.粮食);
            }
        }
        else if (events.stability && world.稳定度 < events.stability.threshold) {
            if (randomFactor < events.stability.probability) {
                issue = events.stability.variants[0].replace('{{stability}}', world.稳定度);
            } else {
                issue = events.stability.variants[1].replace('{{stability}}', world.稳定度);
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

module.exports = HubuAgent;
