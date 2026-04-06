const fs = require('fs');
const path = require('path');

class GameState {
    constructor() {
        this.state = {
            era_spirit: 80,
            treasury: 45,
            livelihood: 60,
            agents: [
                { dept: "war", power: 90, loyalty: 75, bias_war: 40 },
                { dept: "finance", power: 60, loyalty: 80, bias_money: -20 },
                { dept: "culture", power: 50, loyalty: 70, bias_culture: 30 },
                { dept: "infrastructure", power: 40, loyalty: 65, bias_infra: 25 },
                { dept: "politics", power: 80, loyalty: 75, bias_politics: 15 },
                { dept: "law", power: 55, loyalty: 85, bias_law: 20 }
            ],
            active_buffs: [],
            active_debuffs: [],
            lastDisasterRound: -1,
            currentRound: 0,
            "粮食": 300,
            "民心": 60,
            "军力": 50,
            "稳定度": 70,
            "威望": 50,
            "文化": 50,
            "工程": 50,
            "法律": 50
        };
        
        this.subscribers = [];
        this.roundInterval = null;
        this.roundDuration = 60000; // 60秒一个回合
        this.stateHistory = []; // 状态变更历史记录
        this.maxHistoryLength = 100; // 最大历史记录长度
    }
    
    // 获取全局状态快照
    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }
    
    // 记录状态变更历史
    recordStateHistory(action, oldState, newState) {
        const delta = this.calculateDelta(oldState, newState);
        const historyEntry = {
            timestamp: new Date().toISOString(),
            action: action,
            oldState: oldState,
            newState: newState,
            delta: delta,
            round: this.state.currentRound
        };
        
        this.stateHistory.push(historyEntry);
        
        // 限制历史记录长度
        if (this.stateHistory.length > this.maxHistoryLength) {
            this.stateHistory.shift();
        }
    }
    
    // 获取状态历史记录
    getStateHistory() {
        return JSON.parse(JSON.stringify(this.stateHistory));
    }
    
    // 获取特定回合的状态历史
    getStateHistoryByRound(round) {
        return this.stateHistory.filter(entry => entry.round === round);
    }
    
    // 获取最近的状态历史
    getRecentStateHistory(limit = 10) {
        return this.stateHistory.slice(-limit);
    }
    
    // 更新状态
    updateState(newState) {
        const oldState = JSON.parse(JSON.stringify(this.state));
        this.state = { ...this.state, ...newState };
        this.recordStateHistory('updateState', oldState, this.state);
        this.notifySubscribers(oldState, this.state);
    }
    
    // 更新特定数值
    updateValue(key, value) {
        const oldState = JSON.parse(JSON.stringify(this.state));
        this.state[key] = value;
        this.recordStateHistory(`updateValue: ${key}`, oldState, this.state);
        this.notifySubscribers(oldState, this.state);
    }
    
    // 更新Agent状态
    updateAgent(dept, updates) {
        const oldState = JSON.parse(JSON.stringify(this.state));
        const agentIndex = this.state.agents.findIndex(agent => agent.dept === dept);
        if (agentIndex !== -1) {
            this.state.agents[agentIndex] = { ...this.state.agents[agentIndex], ...updates };
            this.recordStateHistory(`updateAgent: ${dept}`, oldState, this.state);
            this.notifySubscribers(oldState, this.state);
        }
    }
    
    // 添加BUFF
    addBuff(buffId) {
        if (!this.state.active_buffs.includes(buffId)) {
            const oldState = JSON.parse(JSON.stringify(this.state));
            this.state.active_buffs.push(buffId);
            this.recordStateHistory(`addBuff: ${buffId}`, oldState, this.state);
            this.notifySubscribers(oldState, this.state);
        }
    }
    
    // 移除BUFF
    removeBuff(buffId) {
        const oldState = JSON.parse(JSON.stringify(this.state));
        this.state.active_buffs = this.state.active_buffs.filter(buff => buff !== buffId);
        this.recordStateHistory(`removeBuff: ${buffId}`, oldState, this.state);
        this.notifySubscribers(oldState, this.state);
    }
    
    // 添加DEBUFF
    addDebuff(debuffId) {
        if (!this.state.active_debuffs.includes(debuffId)) {
            const oldState = JSON.parse(JSON.stringify(this.state));
            this.state.active_debuffs.push(debuffId);
            this.recordStateHistory(`addDebuff: ${debuffId}`, oldState, this.state);
            this.notifySubscribers(oldState, this.state);
        }
    }
    
    // 移除DEBUFF
    removeDebuff(debuffId) {
        const oldState = JSON.parse(JSON.stringify(this.state));
        this.state.active_debuffs = this.state.active_debuffs.filter(debuff => debuff !== debuffId);
        this.recordStateHistory(`removeDebuff: ${debuffId}`, oldState, this.state);
        this.notifySubscribers(oldState, this.state);
    }
    
    // 订阅状态变更
    subscribe(callback) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    }
    
    // 通知订阅者
    notifySubscribers(oldState, newState) {
        const delta = this.calculateDelta(oldState, newState);
        // 添加时间戳和变更类型
        const notification = {
            type: "UPDATE_STATS",
            timestamp: new Date().toISOString(),
            data: delta,
            oldState: oldState,
            newState: newState
        };
        this.subscribers.forEach(callback => {
            try {
                callback(notification);
            } catch (error) {
                console.error('通知订阅者失败:', error);
            }
        });
    }
    
    // 计算状态变化
    calculateDelta(oldState, newState) {
        const delta = {};
        
        // 比较基本数值
        Object.keys(newState).forEach(key => {
            if (typeof newState[key] !== 'object' || newState[key] === null) {
                if (oldState[key] !== newState[key]) {
                    const change = newState[key] - oldState[key];
                    let percentageChange = 0;
                    if (oldState[key] !== 0) {
                        percentageChange = (change / Math.abs(oldState[key])) * 100;
                    }
                    delta[key] = {
                        old: oldState[key],
                        new: newState[key],
                        change: change,
                        percentageChange: parseFloat(percentageChange.toFixed(2))
                    };
                }
            }
        });
        
        // 比较agents
        if (JSON.stringify(oldState.agents) !== JSON.stringify(newState.agents)) {
            const agentChanges = [];
            newState.agents.forEach((newAgent, index) => {
                const oldAgent = oldState.agents[index];
                if (JSON.stringify(newAgent) !== JSON.stringify(oldAgent)) {
                    const agentDelta = { dept: newAgent.dept, changes: {} };
                    Object.keys(newAgent).forEach(key => {
                        if (newAgent[key] !== oldAgent[key]) {
                            agentDelta.changes[key] = {
                                old: oldAgent[key],
                                new: newAgent[key],
                                change: newAgent[key] - oldAgent[key]
                            };
                        }
                    });
                    agentChanges.push(agentDelta);
                }
            });
            delta.agents = agentChanges;
        }
        
        // 比较buffs和debuffs
        if (JSON.stringify(oldState.active_buffs) !== JSON.stringify(newState.active_buffs)) {
            const addedBuffs = newState.active_buffs.filter(buff => !oldState.active_buffs.includes(buff));
            const removedBuffs = oldState.active_buffs.filter(buff => !newState.active_buffs.includes(buff));
            delta.active_buffs = {
                current: newState.active_buffs,
                added: addedBuffs,
                removed: removedBuffs
            };
        }
        if (JSON.stringify(oldState.active_debuffs) !== JSON.stringify(newState.active_debuffs)) {
            const addedDebuffs = newState.active_debuffs.filter(debuff => !oldState.active_debuffs.includes(debuff));
            const removedDebuffs = oldState.active_debuffs.filter(debuff => !newState.active_debuffs.includes(debuff));
            delta.active_debuffs = {
                current: newState.active_debuffs,
                added: addedDebuffs,
                removed: removedDebuffs
            };
        }
        
        return delta;
    }
    
    // 开始回合定时器
    startRoundTimer() {
        if (this.roundInterval) {
            clearInterval(this.roundInterval);
        }
        
        this.roundInterval = setInterval(async () => {
            await this.executeRoundEnd();
        }, this.roundDuration);
        
        console.log(`回合定时器已启动，每${this.roundDuration/1000}秒执行一次`);
    }
    
    // 停止回合定时器
    stopRoundTimer() {
        if (this.roundInterval) {
            clearInterval(this.roundInterval);
            this.roundInterval = null;
            console.log('回合定时器已停止');
        }
    }
    
    // 执行回合结束逻辑
    async executeRoundEnd() {
        console.log(`执行回合 ${this.state.currentRound + 1} 结束逻辑`);
        
        const oldState = JSON.parse(JSON.stringify(this.state));
        const results = {
            new_buffs: [],
            new_debuffs: [],
            updated_stats: {},
            narrative: ""
        };
        
        // 1. 自然增长
        this.state.粮食 += 10; // 粮食自然增长
        this.state.treasury += 5; // 税收
        
        // 2. 检查BUFF/DEBUFF触发条件
        // 检查风调雨顺BUFF（上一回合无天灾）
        if (this.state.lastDisasterRound < this.state.currentRound - 1) {
            this.addBuff("BUFF_02"); // 风调雨顺
            results.new_buffs.push("BUFF_02");
            results.narrative += "今年风调雨顺，粮食丰收... ";
        }
        
        // 3. 应用BUFF效果
        this.state.active_buffs.forEach(buff => {
            switch(buff) {
                case "BUFF_02": // 风调雨顺
                    this.state.粮食 += 20;
                    this.state.livelihood += 5;
                    break;
            }
        });
        
        // 4. 应用DEBUFF效果
        this.state.active_debuffs.forEach(debuff => {
            switch(debuff) {
                case "DEBUFF_01": // 旱灾
                    this.state.粮食 -= 15;
                    this.state.livelihood -= 10;
                    break;
            }
        });
        
        // 5. 检查数值边界
        this.state.粮食 = Math.max(0, this.state.粮食);
        this.state.treasury = Math.max(0, this.state.treasury);
        this.state.livelihood = Math.max(0, Math.min(100, this.state.livelihood));
        
        // 6. 增加回合数
        this.state.currentRound += 1;
        
        // 7. 生成结果
        results.updated_stats = this.calculateDelta(oldState, this.state);
        
        // 8. 记录状态变更历史
        this.recordStateHistory('executeRoundEnd', oldState, this.state);
        
        // 9. 通知订阅者
        this.notifySubscribers(oldState, this.state);
        
        console.log('回合结束执行完成:', results);
        return results;
    }
    
    // 手动执行回合结束
    async triggerRoundEnd() {
        return await this.executeRoundEnd();
    }
    
    // 模拟天灾
    triggerDisaster() {
        const oldState = JSON.parse(JSON.stringify(this.state));
        this.state.lastDisasterRound = this.state.currentRound;
        this.addDebuff("DEBUFF_01"); // 旱灾
        this.state.粮食 -= 30;
        this.state.livelihood -= 15;
        this.state.民心 -= 10;
        this.recordStateHistory('triggerDisaster', oldState, this.state);
        this.notifySubscribers(oldState, this.state);
        return {
            type: "DISASTER",
            data: {
                disasterType: "drought",
                effects: {
                    粮食: -30,
                    livelihood: -15,
                    民心: -10
                }
            }
        };
    }
    
    // 保存状态到文件
    saveState() {
        try {
            const savePath = path.join(__dirname, 'game_state.json');
            fs.writeFileSync(savePath, JSON.stringify(this.state, null, 2));
            console.log('游戏状态已保存');
        } catch (error) {
            console.error('保存游戏状态失败:', error);
        }
    }
    
    // 从文件加载状态
    loadState() {
        try {
            const savePath = path.join(__dirname, 'game_state.json');
            if (fs.existsSync(savePath)) {
                const savedState = JSON.parse(fs.readFileSync(savePath, 'utf8'));
                this.state = { ...this.state, ...savedState };
                console.log('游戏状态已加载');
            }
        } catch (error) {
            console.error('加载游戏状态失败:', error);
        }
    }
}

// 导出单例
const gameState = new GameState();
gameState.loadState();
// gameState.startRoundTimer();

module.exports = gameState;