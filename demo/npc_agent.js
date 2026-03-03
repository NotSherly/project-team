/**
 * NPC Agent层 - 吏部尚书
 * 优化点：
 * 1. think() 引入随机因素，增加事件多样性，并考虑银两、时间等更多维度。
 * 2. 事件类型更丰富，包括粮荒、民变、财政、祥瑞、贪腐、边关等。
 * 3. 在阈值附近设置概率分支，避免每次触发完全相同的内容。
 * 4. act() 中的提示词强化了人物性格和格式要求，并明确禁止虚构额外数据。
 * 5. 使用AIService统一管理LLM调用和缓存。
 */

const AIService = require('./ai_service');

class NpcAgent {
    constructor() {
        this.identity = "吏部尚书";
        this.personality = "忠心耿耿，直言敢谏";
        this.goals = ["维护朝廷稳定", "保障民生"];
        this.memory = [];
        this.aiService = new AIService(); // 使用AIService
    }
    
    // 观察世界（读取数值）
    observeWorld(world) {
        this.currentWorld = world;
        return world;
    }
    
    // 思考决策（根据粮食/民心/银两等数值，结合随机性决定上奏内容）
    think() {
        const world = this.currentWorld;
        const randomFactor = Math.random(); // 0-1随机数

        // 定义多个可能的问题域，根据数值和随机概率选择
        let issue = "";

        // 1. 粮食危机
        if (world.粮食 < 30) {
            if (randomFactor < 0.7) {
                issue = `粮食储备仅余${world.粮食}石，民有饥色，恐生粮荒之变。`;
            } else {
                issue = `粮食虽少，但更令人忧心者，乃是粮仓官吏有盗卖之嫌，请陛下彻查。`;
            }
        }
        // 2. 民心不稳
        else if (world.民心 < 40) {
            if (randomFactor < 0.6) {
                issue = `民心不稳，仅有${world.民心}，若不及时安抚，恐生民变。`;
            } else {
                issue = `近日流言四起，民心离散，或有奸人煽动，请陛下圣裁。`;
            }
        }
        // 3. 银两不足
        else if (world.银两 < 50) {
            if (randomFactor < 0.5) {
                issue = `国库银两仅余${world.银两}万两，诸项开支难以为继，请陛下节用。`;
            } else {
                issue = `银两短缺，而边关军饷未发，恐军心生变，请陛下速决。`;
            }
        }
        // 4. 正常或盛世状态，仍可随机触发一些积极或中性事件
        else {
            // 根据季节或时间增加一点变化（简单模拟）
            const season = this.getSeason(world.时间);
            const normalEvents = [
                `国泰民安，粮食充足，民心稳定，实乃盛世之象。`,
                `近来风调雨顺，百姓安乐，臣恭祝陛下圣明。`,
                `有祥瑞现于京郊，或为上天嘉许陛下之德。`,
                `边关无事，朝政清明，唯望陛下勤勉不怠。`,
                `时值${season}，农桑兴旺，税收有望增加。`
            ];
            const index = Math.floor(randomFactor * normalEvents.length);
            issue = normalEvents[index];
        }

        return issue;
    }

    // 辅助：从时间字符串中推测季节（用于丰富事件）
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
        const prompt = `你是吏部尚书，忠心耿耿，直言敢谏。请根据以下要点，生成一份正式的奏折，并在奏折末尾提供3个不同的决策选项，每个选项用数字标记，格式为：
1. 选项1内容
2. 选项2内容
3. 选项3内容

要求：
1. 奏折格式规范，包含称谓、正文、结尾敬语。
2. 正文要详细阐述问题，可适当引用历史典故或经典语句，但核心内容必须基于要点。
3. 体现吏部尚书的性格：忠心、直谏，语气恳切。
4. 不要虚构要点之外的具体数据或事件。
5. 选项要具体可行，涵盖不同的决策方向。

要点：${奏折要点}

请生成奏折和选项：`;
        
        // 调用AIService生成奏折
        const 生成的内容 = await this.aiService.processRequest({
            type: 'agent_dialogue',
            content: prompt,
            systemPrompt: "你是吏部尚书，正在向皇帝上奏。请根据用户提供的内容生成一份正式的奏折，严格依据信息，体现忠心和直谏。",
            constraints: {
                maxTokens: 1000,
                temperature: 0.7
            }
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
                options: [
                    "开仓放粮，赈济灾民",
                    "加税增加国库收入",
                    "派遣官员调查情况"
                ]
            };
        }
        
        return {
            report: report,
            options: options
        };
    }
    

}

// 导出模块
module.exports = NpcAgent;