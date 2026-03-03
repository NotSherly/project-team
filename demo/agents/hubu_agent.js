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
        const configPath = path.join(__dirname, 'agents_config', 'hubu_agent_config.json');
        try {
            const configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.error('[HubuAgent] 加载配置文件失败:', error);
            // 返回默认配置
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
    
    // 观察世界（读取数值）
    observeWorld(world) {
        this.currentWorld = world;
        return world;
    }
    
    // 思考决策（根据财政状况决定上奏内容）
    think() {
        const world = this.currentWorld;
        const randomFactor = Math.random();
        const events = this.config.events;
        let issue = "";

        // 1. 国库充盈（银两充足）
        if (world.银两 >= events.taxRevenue.threshold) {
            if (randomFactor < events.taxRevenue.probability) {
                issue = events.taxRevenue.variants[0].replace('{{silver}}', world.银两);
            } else {
                issue = events.taxRevenue.variants[1].replace('{{silver}}', world.银两);
            }
        }
        // 2. 国库短缺（银两不足）
        else if (world.银两 < events.taxShortage.threshold) {
            if (randomFactor < events.taxShortage.probability) {
                issue = events.taxShortage.variants[0].replace('{{silver}}', world.银两);
            } else {
                issue = events.taxShortage.variants[1].replace('{{silver}}', world.银两);
            }
        }
        // 3. 人口/民心良好
        else if (world.民心 >= events.populationGrowth.threshold) {
            if (randomFactor < events.populationGrowth.probability) {
                issue = events.populationGrowth.variants[0].replace('{{people}}', world.民心);
            } else {
                issue = events.populationGrowth.variants[1].replace('{{people}}', world.民心);
            }
        }
        // 4. 田亩/粮食管理
        else if (world.粮食 < events.landManagement.threshold) {
            if (randomFactor < events.landManagement.probability) {
                issue = events.landManagement.variants[0].replace('{{food}}', world.粮食);
            } else {
                issue = events.landManagement.variants[1].replace('{{food}}', world.粮食);
            }
        }
        // 5. 正常财政状态
        else {
            const season = this.getSeason(world.时间);
            const normalEvents = events.normal.variants;
            const index = Math.floor(randomFactor * normalEvents.length);
            issue = normalEvents[index].replace('{{season}}', season);
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
module.exports = HubuAgent;
