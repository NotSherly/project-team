/**
 * 礼部 Agent 层 - 礼部尚书
 * 职责：掌管国家典章制度、祭祀、学校、科举和外事活动
 * 相当于现代：教育部 + 文化部 + 外交部
 */

const fs = require('fs');
const path = require('path');
const AIService = require('../ai_service');

class LibubuAgent {
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
        const configPath = path.join(__dirname, 'agents_config', 'libubu_agent_config.json');
        try {
            const configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.error('[LibubuAgent] 加载配置文件失败:', error);
            return {
                agent: {
                    name: "礼部尚书",
                    identity: "礼部尚书",
                    personality: "儒雅博学，重视礼仪，精通典章",
                    goals: ["维护典章制度", "推动教育文化", "促进外事交流"],
                    responsibilities: ["掌管典章制度", "管理教育", "处理外事"]
                },
                prompts: {
                    systemPrompt: "你是礼部尚书，正在向皇帝上奏文化教育事宜。",
                    reportTemplate: "请生成礼部奏折，要点：{{issue}}",
                    constraints: { maxTokens: 1000, temperature: 0.7 }
                },
                fallback: {
                    options: ["完善典章制度", "兴办学校", "加强外交"]
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

        if (world.民心 >= events.education.threshold) {
            if (randomFactor < events.education.probability) {
                issue = events.education.variants[0].replace('{{people}}', world.民心);
            } else {
                issue = events.education.variants[1];
            }
        }
        else if (world.民心 >= events.ceremony.threshold) {
            if (randomFactor < events.ceremony.probability) {
                issue = events.ceremony.variants[0];
            } else {
                issue = events.ceremony.variants[1];
            }
        }
        else if (world.民心 >= events.foreignAffairs.threshold) {
            if (randomFactor < events.foreignAffairs.probability) {
                issue = events.foreignAffairs.variants[0];
            } else {
                issue = events.foreignAffairs.variants[1];
            }
        }
        else if (world.民心 >= events.examination.threshold) {
            if (randomFactor < events.examination.probability) {
                issue = events.examination.variants[0];
            } else {
                issue = events.examination.variants[1];
            }
        }
        else if (events.culture && world.文化 < events.culture.threshold) {
            if (randomFactor < events.culture.probability) {
                issue = events.culture.variants[0].replace('{{culture}}', world.文化);
            } else {
                issue = events.culture.variants[1].replace('{{culture}}', world.文化);
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
        prompt = prompt.replace(/\{\{culture\}\}/g, world.文化);
        prompt = prompt.replace(/\{\{prestige\}\}/g, world.威望);
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

module.exports = LibubuAgent;
