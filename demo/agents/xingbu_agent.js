/**
 * 刑部 Agent 层 - 刑部尚书
 * 职责：主管全国刑罚政令及审核刑名
 * 相当于现代：司法部 + 最高人民法院 + 最高人民检察院
 */

const fs = require('fs');
const path = require('path');
const AIService = require('../ai_service');

class XingbuAgent {
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
        const configPath = path.join(__dirname, 'agents_config', 'xingbu_agent_config.json');
        try {
            const configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.error('[XingbuAgent] 加载配置文件失败:', error);
            return {
                agent: {
                    name: "刑部尚书",
                    identity: "刑部尚书",
                    personality: "公正严明，执法如山，明辨是非",
                    goals: ["维护司法公正", "惩治犯罪", "完善法律制度"],
                    responsibilities: ["主管刑罚政令", "审核刑名", "监督司法"]
                },
                prompts: {
                    systemPrompt: "你是刑部尚书，正在向皇帝上奏司法事宜。",
                    reportTemplate: "请生成司法奏折，要点：{{issue}}",
                    constraints: { maxTokens: 1000, temperature: 0.7 }
                },
                fallback: {
                    options: ["改革司法制度", "加强法律宣传", "打击犯罪"]
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

        if (world.民心 >= events.lawAndOrder.threshold) {
            if (randomFactor < events.lawAndOrder.probability) {
                issue = events.lawAndOrder.variants[0].replace('{{people}}', world.民心);
            } else {
                issue = events.lawAndOrder.variants[1];
            }
        }
        else if (world.民心 >= events.criminalCases.threshold) {
            if (randomFactor < events.criminalCases.probability) {
                issue = events.criminalCases.variants[0];
            } else {
                issue = events.criminalCases.variants[1];
            }
        }
        else if (world.民心 >= events.legalSystem.threshold) {
            if (randomFactor < events.legalSystem.probability) {
                issue = events.legalSystem.variants[0];
            } else {
                issue = events.legalSystem.variants[1];
            }
        }
        else if (world.民心 >= events.prisonManagement.threshold) {
            if (randomFactor < events.prisonManagement.probability) {
                issue = events.prisonManagement.variants[0];
            } else {
                issue = events.prisonManagement.variants[1];
            }
        }
        else if (events.lawValue && world.法律 < events.lawValue.threshold) {
            if (randomFactor < events.lawValue.probability) {
                issue = events.lawValue.variants[0].replace('{{law}}', world.法律);
            } else {
                issue = events.lawValue.variants[1].replace('{{law}}', world.法律);
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
        prompt = prompt.replace(/\{\{law\}\}/g, world.法律);
        prompt = prompt.replace(/\{\{stability\}\}/g, world.稳定度);
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

module.exports = XingbuAgent;
