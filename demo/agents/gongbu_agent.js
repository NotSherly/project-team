/**
 * 工部 Agent 层 - 工部尚书
 * 职责：掌管各项工程、工匠、屯田、水利、交通等政令
 * 相当于现代：住房和城乡建设部 + 水利部 + 交通部
 */

const fs = require('fs');
const path = require('path');
const AIService = require('../ai_service');

class GongbuAgent {
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
        const configPath = path.join(__dirname, 'agents_config', 'gongbu_agent_config.json');
        try {
            const configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.error('[GongbuAgent] 加载配置文件失败:', error);
            return {
                agent: {
                    name: "工部尚书",
                    identity: "工部尚书",
                    personality: "务实肯干，精通工程，注重民生",
                    goals: ["兴修水利", "发展交通", "建造工程"],
                    responsibilities: ["管理工程", "兴修水利", "管理交通"]
                },
                prompts: {
                    systemPrompt: "你是工部尚书，正在向皇帝上奏工程建设事宜。",
                    reportTemplate: "请生成工程奏折，要点：{{issue}}",
                    constraints: { maxTokens: 1000, temperature: 0.7 }
                },
                fallback: {
                    options: ["兴修水利", "修缮道路", "培养工匠"]
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

        if (world.粮食 >= events.waterConservancy.threshold) {
            if (randomFactor < events.waterConservancy.probability) {
                issue = events.waterConservancy.variants[0].replace('{{food}}', world.粮食);
            } else {
                issue = events.waterConservancy.variants[1].replace('{{food}}', world.粮食);
            }
        }
        else if (world.银两 >= events.transportation.threshold) {
            if (randomFactor < events.transportation.probability) {
                issue = events.transportation.variants[0].replace('{{silver}}', world.银两);
            } else {
                issue = events.transportation.variants[1].replace('{{silver}}', world.银两);
            }
        }
        else if (world.银两 >= events.construction.threshold) {
            if (randomFactor < events.construction.probability) {
                issue = events.construction.variants[0];
            } else {
                issue = events.construction.variants[1];
            }
        }
        else if (world.银两 >= events.craftsmen.threshold) {
            if (randomFactor < events.craftsmen.probability) {
                issue = events.craftsmen.variants[0];
            } else {
                issue = events.craftsmen.variants[1];
            }
        }
        else if (events.engineering && world.工程 < events.engineering.threshold) {
            if (randomFactor < events.engineering.probability) {
                issue = events.engineering.variants[0].replace('{{engineering}}', world.工程);
            } else {
                issue = events.engineering.variants[1].replace('{{engineering}}', world.工程);
            }
        }
        else if (events.stability && world.稳定度 < events.stability.threshold) {
            if (randomFactor < events.stability.probability) {
                issue = events.stability.variants[0].replace('{{stability}}', world.稳定度);
            } else {
                issue = events.stability.variants[1];
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
        prompt = prompt.replace(/\{\{engineering\}\}/g, world.工程);
        prompt = prompt.replace(/\{\{food\}\}/g, world.粮食);
        prompt = prompt.replace(/\{\{silver\}\}/g, world.银两);
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

module.exports = GongbuAgent;
