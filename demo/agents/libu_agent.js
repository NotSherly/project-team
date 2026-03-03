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
        // 加载配置文件
        this.config = this.loadConfig();
        
        this.identity = this.config.agent.identity;
        this.personality = this.config.agent.personality;
        this.goals = this.config.agent.goals;
        this.memory = [];
        this.aiService = new AIService();
    }
    
    // 加载配置文件
    loadConfig() {
        const configPath = path.join(__dirname, 'agents_config', 'libu_agent_config.json');
        try {
            const configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.error('[LibuAgent] 加载配置文件失败:', error);
            // 返回默认配置
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
    
    // 观察世界（读取数值）
    observeWorld(world) {
        this.currentWorld = world;
        return world;
    }
    
    // 思考决策（根据粮食/民心/银两等数值，结合随机性决定上奏内容）
    think() {
        const world = this.currentWorld;
        const randomFactor = Math.random();
        const events = this.config.events;
        let issue = "";

        // 1. 粮食危机
        if (world.粮食 < events.foodCrisis.threshold) {
            if (randomFactor < events.foodCrisis.probability) {
                issue = events.foodCrisis.variants[0].replace('{{food}}', world.粮食);
            } else {
                issue = events.foodCrisis.variants[1];
            }
        }
        // 2. 民心不稳
        else if (world.民心 < events.unrest.threshold) {
            if (randomFactor < events.unrest.probability) {
                issue = events.unrest.variants[0].replace('{{people}}', world.民心);
            } else {
                issue = events.unrest.variants[1];
            }
        }
        // 3. 银两不足
        else if (world.银两 < events.finance.threshold) {
            if (randomFactor < events.finance.probability) {
                issue = events.finance.variants[0].replace('{{silver}}', world.银两);
            } else {
                issue = events.finance.variants[1];
            }
        }
        // 4. 正常或盛世状态
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
module.exports = LibuAgent;
