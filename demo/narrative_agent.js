/**
 * 叙事Agent层 - 数值→剧情翻译
 */

// 任务5：定义叙事Agent
class NarrativeAgent {
    constructor() {
        this.identity = "史官";
    }
    
    // 功能：输入世界状态 + NPC上奏内容，输出古风剧情旁白
    async generateNarrative(world, npcReport) {
        const prompt = `你是一位古代史官，正在记录历史。请根据以下信息生成一段古风剧情旁白：\n\n世界状态：\n- 时间：${world.时间}\n- 银两：${world.银两}\n- 粮食：${world.粮食}\n- 民心：${world.民心}\n\n吏部尚书奏折：\n${npcReport}`;
        
        // 内部调用LLM生成
        const narrative = await this.llm(prompt);
        return narrative;
    }
    
    async llm(prompt) {
        try {
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
                        {"role": "system","content": "你是一位古代史官，正在记录历史。请根据用户提供的信息生成一段古风剧情旁白。"},
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
                // 返回默认剧情
                return `时维${prompt.split('时间：')[1].split('\n')[0]}，天下大势，瞬息万变。\n\n朝堂之上，吏部尚书启奏陛下，所述之事，关乎社稷安危。\n\n${prompt.split('吏部尚书奏折：')[1].trim()}\n\n皇帝听罢，沉思良久，心中已有定夺。`;
            }
        } catch (error) {
            console.error('豆包API 调用失败:', error);
            // 返回默认剧情
            return `时维${prompt.split('时间：')[1].split('\n')[0]}，天下大势，瞬息万变。\n\n朝堂之上，吏部尚书启奏陛下，所述之事，关乎社稷安危。\n\n${prompt.split('吏部尚书奏折：')[1].trim()}\n\n皇帝听罢，沉思良久，心中已有定夺。`;
        }
    }
}

// 导出模块
module.exports = NarrativeAgent;