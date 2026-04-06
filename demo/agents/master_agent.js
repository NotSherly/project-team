/**
 * 主Agent类 - 负责旁白世界线生成、决策分析和数值调控
 */

const AIService = require('../ai_service');

class MasterAgent {
    constructor() {
        this.aiService = new AIService();
        this.worldLineHistory = []; // 世界线历史记录
        this.decisionHistory = []; // 决策历史记录
        this.maxHistoryLength = 50; // 最大历史记录长度
    }

    /**
     * 生成世界线叙事
     * @param {Object} worldState - 当前世界状态
     * @param {Array} events - 当前事件
     * @param {Array} recentDecisions - 最近的决策
     * @returns {Promise<string>} 世界线叙事
     */
    async generateWorldLine(worldState, events, recentDecisions) {
        const context = this._buildContext(worldState, events, recentDecisions);
        
        const prompt = `作为大明王朝的史官，你要记录当前的历史进程。

${context}

请生成一段生动的旁白，描述当前的国家状况、社会氛围和历史走向。旁白要连贯、有深度，体现出历史的厚重感。`;

        try {
            const narrative = await this.aiService.processRequest({
                type: 'agent_dialogue',
                content: prompt,
                systemPrompt: '你是大明王朝的史官，负责记录历史进程，生成连贯的世界线叙事。',
                constraints: {
                    maxTokens: 1000,
                    temperature: 0.8
                }
            });

            // 记录到世界线历史
            this._addWorldLineHistory({
                timestamp: new Date().toISOString(),
                narrative: narrative,
                worldState: { ...worldState },
                events: [...events]
            });

            return narrative;
        } catch (error) {
            console.error('生成世界线失败:', error);
            return '当前国家局势稳定，各项事务有序进行。';
        }
    }

    /**
     * 分析决策影响
     * @param {Array} decisions - 玩家决策
     * @param {Object} worldState - 当前世界状态
     * @returns {Promise<Object>} 数值变化
     */
    async analyzeDecisionImpact(decisions, worldState) {
        const context = this._buildDecisionContext(decisions, worldState);
        
        const prompt = `作为朝廷的决策顾问，你需要分析以下决策对国家的影响：

${context}

请综合分析这些决策的短期和长期影响，考虑决策之间的相互作用，并以JSON格式返回各项数值的变化。

JSON格式示例：
{"银两": -10, "粮食": 20, "民心": 5, "军力": 0, "稳定度": 5, "威望": 3, "文化": 0, "工程": 5, "法律": 0}`;

        try {
            const analysis = await this.aiService.processRequest({
                type: 'agent_dialogue',
                content: prompt,
                systemPrompt: '你是朝廷的决策顾问，负责综合分析皇帝的各项决策对国家的影响。请根据决策内容合理预测数值变化，考虑决策之间的相互影响和长期效果。',
                constraints: {
                    maxTokens: 800,
                    temperature: 0.7
                }
            });

            // 解析AI响应
            const jsonMatch = analysis.match(/\{[\s\S]*?\}/);
            if (jsonMatch) {
                try {
                    const changes = JSON.parse(jsonMatch[0]);
                    
                    // 记录决策历史
                    this._addDecisionHistory({
                        timestamp: new Date().toISOString(),
                        decisions: [...decisions],
                        impact: changes
                    });

                    return changes;
                } catch (parseError) {
                    console.error('解析决策影响失败:', parseError);
                    return this._getDefaultImpact(decisions);
                }
            } else {
                return this._getDefaultImpact(decisions);
            }
        } catch (error) {
            console.error('分析决策影响失败:', error);
            return this._getDefaultImpact(decisions);
        }
    }

    /**
     * 调控世界数值
     * @param {Object} worldState - 当前世界状态
     * @returns {Object} 调控后的数值变化
     */
    regulateWorldValues(worldState) {
        const adjustments = {};
        
        // 防止数值极端化
        if (worldState.银两 > 1000) {
            adjustments.银两 = -50; // 减少过多的银两
            adjustments.民心 = 5; // 增加民心
        } else if (worldState.银两 < 100) {
            adjustments.银两 = 20; // 增加过少的银两
            adjustments.民心 = -3; // 减少民心
        }

        if (worldState.粮食 > 500) {
            adjustments.粮食 = -30; // 减少过多的粮食
        } else if (worldState.粮食 < 100) {
            adjustments.粮食 = 20; // 增加过少的粮食
            adjustments.民心 = -5; // 减少民心
        }

        if (worldState.民心 > 90) {
            adjustments.民心 = -5; // 防止民心过高
            adjustments.稳定度 = 3; // 增加稳定度
        } else if (worldState.民心 < 30) {
            adjustments.民心 = 5; // 防止民心过低
            adjustments.稳定度 = -3; // 减少稳定度
        }

        return adjustments;
    }

    /**
     * 构建上下文
     * @private
     */
    _buildContext(worldState, events, recentDecisions) {
        let context = `当前时间：${worldState.时间}\n`;
        context += `朝代：${worldState.朝代} ${worldState.年号}\n`;
        context += `季节：${worldState.季节}\n`;
        context += `国家状态：\n`;
        context += `  银两：${worldState.银两}万两\n`;
        context += `  粮食：${worldState.粮食}万石\n`;
        context += `  民心：${worldState.民心}\n`;
        context += `  军力：${worldState.军力}\n`;
        context += `  稳定度：${worldState.稳定度}\n`;
        context += `  威望：${worldState.威望}\n`;
        context += `  文化：${worldState.文化}\n`;
        context += `  工程：${worldState.工程}\n`;
        context += `  法律：${worldState.法律}\n`;
        context += `  边患：${worldState.边患}\n`;
        context += `  灾害：${worldState.灾害}\n`;
        
        if (events && events.length > 0) {
            context += `\n当前事件：${events.join('、')}\n`;
        }
        
        if (recentDecisions && recentDecisions.length > 0) {
            context += `\n最近决策：\n`;
            recentDecisions.forEach((decision, index) => {
                context += `  ${index + 1}. [${decision.department}] ${decision.action}\n`;
            });
        }
        
        // 添加历史上下文
        if (this.worldLineHistory.length > 0) {
            const recentHistory = this.worldLineHistory.slice(-3);
            context += `\n历史背景：\n`;
            recentHistory.forEach((entry, index) => {
                context += `  ${index + 1}. ${entry.narrative.substring(0, 100)}...\n`;
            });
        }
        
        return context;
    }

    /**
     * 构建决策上下文
     * @private
     */
    _buildDecisionContext(decisions, worldState) {
        let context = `当前国家状态：\n`;
        context += `  银两：${worldState.银两}万两\n`;
        context += `  粮食：${worldState.粮食}万石\n`;
        context += `  民心：${worldState.民心}\n`;
        context += `  军力：${worldState.军力}\n`;
        context += `  稳定度：${worldState.稳定度}\n`;
        context += `  威望：${worldState.威望}\n`;
        context += `  文化：${worldState.文化}\n`;
        context += `  工程：${worldState.工程}\n`;
        context += `  法律：${worldState.法律}\n`;
        
        context += `\n本回合决策：\n`;
        decisions.forEach((decision, index) => {
            context += `  ${index + 1}. [${decision.department}] ${decision.action}\n`;
        });
        
        // 添加历史决策参考
        if (this.decisionHistory.length > 0) {
            const recentDecisions = this.decisionHistory.slice(-2);
            context += `\n历史决策参考：\n`;
            recentDecisions.forEach((entry, index) => {
                context += `  之前决策：${entry.decisions.map(d => d.action).join('、')}\n`;
                context += `  影响：${JSON.stringify(entry.impact)}\n`;
            });
        }
        
        return context;
    }

    /**
     * 添加世界线历史
     * @private
     */
    _addWorldLineHistory(entry) {
        this.worldLineHistory.push(entry);
        if (this.worldLineHistory.length > this.maxHistoryLength) {
            this.worldLineHistory.shift();
        }
    }

    /**
     * 添加决策历史
     * @private
     */
    _addDecisionHistory(entry) {
        this.decisionHistory.push(entry);
        if (this.decisionHistory.length > this.maxHistoryLength) {
            this.decisionHistory.shift();
        }
    }

    /**
     * 获取默认决策影响
     * @private
     */
    _getDefaultImpact(decisions) {
        const impact = {
            银两: 0,
            粮食: 0,
            民心: 0,
            军力: 0,
            稳定度: 0,
            威望: 0,
            文化: 0,
            工程: 0,
            法律: 0
        };

        // 简单的默认逻辑
        decisions.forEach(decision => {
            if (decision.action.includes('放粮') || decision.action.includes('赈济')) {
                impact.粮食 -= 20;
                impact.民心 += 10;
            } else if (decision.action.includes('减税')) {
                impact.银两 -= 30;
                impact.民心 += 8;
            } else if (decision.action.includes('兴修') || decision.action.includes('水利')) {
                impact.银两 -= 50;
                impact.工程 += 15;
            } else if (decision.action.includes('军事') || decision.action.includes('军队')) {
                impact.银两 -= 40;
                impact.军力 += 10;
            } else if (decision.action.includes('文化') || decision.action.includes('教育')) {
                impact.银两 -= 20;
                impact.文化 += 10;
            } else if (decision.action.includes('法律') || decision.action.includes('司法')) {
                impact.法律 += 10;
                impact.稳定度 += 5;
            }
        });

        return impact;
    }

    /**
     * 获取世界线历史
     */
    getWorldLineHistory() {
        return [...this.worldLineHistory];
    }

    /**
     * 获取决策历史
     */
    getDecisionHistory() {
        return [...this.decisionHistory];
    }
}

module.exports = MasterAgent;