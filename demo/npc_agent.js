/**
 * NPC Agent层 - 吏部尚书
 */

// 任务4：定义NPC Agent类（吏部尚书）
class NpcAgent {
    constructor() {
        // 初始化（身份、性格、目标、记忆）
        this.identity = "吏部尚书";
        this.personality = "忠心耿耿，直言敢谏";
        this.goals = ["维护朝廷稳定", "保障民生"];
        this.memory = [];
    }
    
    // 观察世界（读取数值）
    observeWorld(world) {
        this.currentWorld = world;
        return world;
    }
    
    // 思考决策（根据粮食/民心决定上奏内容）
    think() {
        const world = this.currentWorld;
        let 奏折内容 = "";
        
        if (world.粮食 < 30) {
            奏折内容 = `启奏陛下，当前粮食储备仅余${world.粮食}石，已不足维持百姓生计，恐生粮荒之变，请陛下定夺。`;
        } else if (world.民心 < 40) {
            奏折内容 = `启奏陛下，近日民心不稳，当前民心仅余${world.民心}，若不及时安抚，恐生民变，请陛下圣裁。`;
        } else {
            奏折内容 = `启奏陛下，当前国泰民安，粮食充足，民心稳定，实乃盛世之象。`;
        }
        
        return 奏折内容;
    }
    
    // 行动（调用LLM API生成奏折）
    async act() {
        const 奏折内容 = this.think();
        const prompt = `你是吏部尚书，正在向皇帝上奏。请根据以下内容生成一份正式的奏折：\n${奏折内容}`;
        
        // 调用LLM API生成奏折
        const 生成的奏折 = await this.llm(prompt);
        
        // 存储到记忆
        this.memory.push({
            timestamp: new Date().toISOString(),
            content: 生成的奏折
        });
        
        return 生成的奏折;
    }
    
    // 可替换的模板函数：调用LLM API
    async llm(prompt) {
        try {
            console.log(`[LLM] 生成奏折中...`);
            console.log(`[LLM] Prompt: ${prompt}`);
            
            // 豆包API调用
            const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer e5d3732f-691b-4eae-86c4-2cc7f99a36cf'
                },
                body: JSON.stringify({
                    model: 'doubao-1-5-pro-32k-250115',
                    messages: [
                        {"role": "system","content": "你是吏部尚书，正在向皇帝上奏。请根据用户提供的内容生成一份正式的奏折。"},
                        {"role": "user","content": prompt}
                    ]
                })
            });
            
            const data = await response.json();
            
            // 检查响应是否成功
            if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
                return data.choices[0].message.content;
            } else {
                console.error('豆包API 响应格式错误:', data);
                // 返回默认奏折
                return `奏折

${this.identity}谨奏：

${prompt.split('：')[1].trim()}

伏惟陛下圣鉴，臣不胜惶恐之至。`;
            }
        } catch (error) {
            console.error('豆包API 调用失败:', error);
            // 返回默认奏折
            return `奏折

${this.identity}谨奏：

${prompt.split('：')[1].trim()}

伏惟陛下圣鉴，臣不胜惶恐之至。`;
        }
    }
}

// 导出模块
module.exports = NpcAgent;