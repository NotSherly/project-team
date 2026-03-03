/**
 * 叙事Agent层 - 数值→剧情翻译
 * 优化点：
 * 1. 提示词明确要求严格依据世界状态和奏折，禁止虚构额外重大事件。
 * 2. 增加叙事结构要求：时局概括、奏折回应、史官评语/展望，使输出更完整。
 * 3. 鼓励从不同角度描述同一事实，增加生动性但保持一致性。
 * 4. 根据数值高低合理推断社会状况，但避免超出数值范围编造具体事件。
 * 5. 修复了默认fallback中对prompt解析的不稳定性（改用更稳健的提取方式）。
 * 6. 使用AIService统一管理LLM调用和缓存。
 */

const AIService = require('../ai_service');

class NarrativeAgent {
    constructor() {
        this.identity = "史官";
        this.aiService = new AIService(); // 使用AIService
    }
    
    // 功能：输入世界状态 + NPC上奏内容，输出古风剧情旁白
    async generateNarrative(world, npcData) {
        // 处理NPC Agent返回的对象
        const npcReport = npcData.report || npcData;
        
        const prompt = `你是一位古代史官，负责客观记录历史。请根据以下世界状态和吏部尚书奏折，生成一段古风剧情旁白。要求：

1. 严格依据提供的信息，不得虚构世界状态数值以外的重大事件。
2. 叙事应包含三部分：
   - 对当前时局的简要概括（基于世界状态）。
   - 对尚书奏折的转述或皇帝的反应。
   - 对未来的一点展望或史官的评语。
3. 语言风格古雅，可适当使用典故，但需贴合情境。
4. 为增加历史的生动性，可以从不同角度描述同一事实，但不可矛盾。
5. 若有数值异常（如粮食极低、民心极高），请根据常理推断社会状况，但不要超出数值范围虚构具体事件。

世界状态：
- 时间：${world.时间}
- 银两：${world.银两}
- 粮食：${world.粮食}
- 民心：${world.民心}

吏部尚书奏折：
${npcReport}

请开始生成剧情旁白：`;
        
        // 调用AIService生成叙事
        const narrative = await this.aiService.processRequest({
            type: 'creative_narrative',
            content: prompt,
            systemPrompt: '你是一位古代史官，正在记录历史。请根据用户提供的信息生成一段古风剧情旁白，严格依据信息，避免虚构。',
            constraints: {
                maxTokens: 1000,
                temperature: 0.7
            }
        });
        return narrative;
    }
    

}

// 导出模块
module.exports = NarrativeAgent;