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
        // 加载配置文件
        this.config = this.loadConfig();
        
        this.identity = this.config.agent.identity;
        this.personality = this.config.agent.personality;
        this.goals = this.config.agent.goals;
        this.responsibilities = this.config.agent.responsibilities;
        this.memory = [];
        this.aiService = new AIService();
    }
    
    // 加载配置文件
    loadConfig() {
        const configPath = path.join(__dirname, 'agents_config', 'xingbu_agent_config.json');
        try {
            const configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.error('[XingbuAgent] 加载配置文件失败:', error);
            // 返回默认配置
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
    
    // 观察世界（读取数值）
    observeWorld(world) {
        this.currentWorld = world;
        return world;
    }
    
    // 思考决策（根据社会状况决定上奏内容）
    think() {
        const world = this.currentWorld;
        const randomFactor = Math.random();
        const events = this.config.events;
        let issue = "";

        // 1. 社会秩序（民心良好）
        if (world.民心 >= events.lawAndOrder.threshold) {
            if (randomFactor < events.lawAndOrder.probability) {
                issue = events.lawAndOrder.variants[0].replace('{{people}}', world.民心);
            } else {
                issue = events.lawAndOrder.variants[1];
            }
        }
        // 2. 刑事案件（民心一般）
        else if (world.民心 >= events.criminalCases.threshold) {
            if (randomFactor < events.criminalCases.probability) {
                issue = events.criminalCases.variants[0];
            } else {
                issue = events.criminalCases.variants[1];
            }
        }
        // 3. 法律制度（民心较低）
        else if (world.民心 >= events.legalSystem.threshold) {
            if (randomFactor < events.legalSystem.probability) {
                issue = events.legalSystem.variants[0];
            } else {
                issue = events.legalSystem.variants[1];
            }
        }
        // 4. 监狱管理（民心很低）
        else if (world.民心 >= events.prisonManagement.threshold) {
            if (randomFactor < events.prisonManagement.probability) {
                issue = events.prisonManagement.variants[0];
            } else {
                issue = events.prisonManagement.variants[1];
            }
        }
        // 5. 正常状态
        else {
            const season = this.getSeason(world.时间);
            const normalEvents = events.normal.variants;
            const index = Math.floor(randomFactor * normalEvents.length);
            issue = normalEvents[index];
        }

        return issue;
    }

    // 辅助：从时间字符串中推测季节
    getSeason(timeStr) {
        if (timeStr.includes('春')) return '春季';
        if (timeStr.includes('夏')) return '夏季';
        if (timeStr.includes('秋')) return '秋季';
        if (timeStr.includes('冬')) return '冬季';
        return '此时';
    }
    
    // 行动（调用LLM API生成奏折和选择选项）
    async act() {
        const 奏折要点 = this.think();
        const prompt = this.config.prompts.reportTemplate.replace('{{issue}}', 奏折要点);
        
        // 调用AIService生成奏折
        const 生成的内容 = await this.aiService.processRequest({
            type: 'agent_dialogue',
            content: prompt,
            systemPrompt: this.config.prompts.systemPrompt,
            constraints: this.config.prompts.constraints
        });
        
        // 存储到记忆
        this.memory.push({
            timestamp: new Date().toISOString(),
            content: 生成的内容
        });
        
        // 分离奏折和选项
        const { report, options } = this.extractReportAndOptions(生成的内容);
        
        return {
            report: report,
            options: options
        };
    }
    
    // 分离奏折和选项
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
                // 选项之间的空行，忽略
            } else if (inOptions) {
                // 选项描述的续行
                if (options.length > 0) {
                    options[options.length - 1] += ' ' + line.trim();
                }
            } else {
                reportLines.push(line);
            }
        }
        
        const report = reportLines.join('\n');
        
        // 如果没有提取到选项，返回默认选项
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

// 导出模块
module.exports = XingbuAgent;
