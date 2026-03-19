# 游戏API接口文档

本文档详细描述了游戏系统的API接口，包括私聊系统、群聊系统、游戏状态管理、实时数据同步等功能。

## 1. 接口列表

### 1.1 私聊相关接口

| 接口路径 | 方法 | 功能描述 |
|---------|------|----------|
| `/api/chat/private` | POST | 发送私聊消息 |
| `/api/chat/history` | GET | 获取私聊历史记录 |
| `/api/agents` | GET | 获取Agent列表 |

### 1.2 群聊相关接口

| 接口路径 | 方法 | 功能描述 |
|---------|------|----------|
| `/api/group-chat/proposal/start` | POST | 发起议案并初始化群聊 |
| `/api/group-chat/vote/execute` | POST | 执行投票并结算结果 |
| `/api/group-chat/stream` | GET | 实时消息流（EventSource） |
| `/api/group-chat/era-spirit` | POST | 设置文武倾向 |
| `/api/group-chat/start` | POST | 开始群聊会话 |
| `/api/group-chat/history` | GET | 获取群聊历史记录 |
| `/api/group-chat/player-speak` | POST | 玩家发言 |
| `/api/group-chat/agent-speak` | POST | Agent发言（流式） |
| `/api/group-chat/agent-speak-sync` | POST | Agent发言（同步） |
| `/api/group-chat/status` | GET | 获取群聊状态 |

### 1.3 游戏状态管理接口

| 接口路径 | 方法 | 功能描述 |
|---------|------|----------|
| `/api/game/state` | GET | 获取全局状态快照 |
| `/api/game/round/end` | POST | 手动触发回合结算 |
| `/api/game/disaster` | POST | 模拟天灾事件 |
| `/api/game/stream` | GET | 游戏状态实时流（EventSource） |

## 2. 私聊接口详细说明

### 2.1 发送私聊消息

**接口**: `POST /api/chat/private`

**功能**: 玩家与特定Agent进行私聊，获取AI回复

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `agentId` | string | 是 | Agent ID，如：libu, hubu, libubu, bingbu, xingbu, gongbu |
| `message` | string | 是 | 玩家发送的消息内容 |

**响应格式**:

```json
{
  "success": true,
  "data": {
    "message": "陛下，臣以为当前朝廷人事状况尚可，但仍有改进空间..."
  }
}
```

**业务逻辑**:

1. **Agent验证**：检查agentId是否有效
2. **世界状态获取**：获取当前游戏世界状态
3. **历史上下文**：获取最近10条聊天历史作为上下文
4. **AI生成回复**：调用Agent的privateChat方法生成回复
5. **保存历史**：将玩家消息和AI回复保存到聊天历史
6. **历史限制**：保持最近50条消息记录

### 2.2 获取私聊历史记录

**接口**: `GET /api/chat/history`

**功能**: 获取与特定Agent的私聊历史记录

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `agentId` | string | 是 | Agent ID |

**响应格式**:

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_1773667361294_player",
        "senderId": "player",
        "content": "当前朝廷人事状况如何？",
        "timestamp": 1773667361294
      },
      {
        "id": "msg_1773667361294_agent",
        "senderId": "libu",
        "content": "陛下，臣以为当前朝廷人事状况尚可...",
        "timestamp": 1773667361294
      }
    ]
  }
}
```

### 2.3 获取Agent列表

**接口**: `GET /api/agents`

**功能**: 获取所有可用的Agent列表

**响应格式**:

```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "libu",
        "name": "吏部尚书",
        "department": "libu"
      },
      {
        "id": "hubu",
        "name": "户部尚书",
        "department": "hubu"
      },
      {
        "id": "libubu",
        "name": "礼部尚书",
        "department": "libubu"
      },
      {
        "id": "bingbu",
        "name": "兵部尚书",
        "department": "bingbu"
      },
      {
        "id": "xingbu",
        "name": "刑部尚书",
        "department": "xingbu"
      },
      {
        "id": "gongbu",
        "name": "工部尚书",
        "department": "gongbu"
      }
    ]
  }
}
```

## 3. 群聊接口详细说明

### 3.1 发起议案并初始化群聊

**接口**: `POST /api/group-chat/proposal/start`

**功能**: 玩家提交议案，后端计算初始支持率，触发AI生成第一条回复

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `topic_type` | string | 是 | 议案类型，如：war, economy, culture, infrastructure, politics, law |
| `content` | string | 是 | 议案内容 |
| `cost_treasury` | number | 否 | 议案所需银两 |

**响应格式**:

```json
{
  "success": true,
  "data": {
    "sessionId": "session_1773667361294_tfn7ztm05",
    "initialSupportRate": 60,
    "firstAiMessage": "陛下，臣支持该议案...",
    "proposal": {
      "id": "proposal_1773667361294",
      "topicType": "war",
      "content": "我们要攻打匈奴",
      "costTreasury": 40,
      "status": "pending",
      "votes": {},
      "startTime": "2026-03-16T13:22:41.294Z"
    }
  }
}
```

### 3.2 执行投票并结算结果

**接口**: `POST /api/group-chat/vote/execute`

**功能**: 玩家点击"强制执行"或AI自动完成投票后，结算结果

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `session_id` | string | 是 | 会话ID，从发起议案接口获取 |
| `force_execute` | boolean | 否 | 是否强制执行，默认为false |

**响应格式**:

```json
{
  "success": true,
  "data": {
    "result": "passed",
    "effects": [
      {
        "type": "execute_eff",
        "value": 95
      }
    ],
    "voteResult": {
      "supportWeight": 77.09794819558532,
      "opposeWeight": 0,
      "totalWeight": 77.09794819558532,
      "supportRate": 100,
      "passed": true,
      "votes": {
        "bingbu": "support"
      }
    },
    "nextEvent": "朝野上下一片赞同之声"
  }
}
```

### 3.3 实时消息流

**接口**: `GET /api/group-chat/stream`

**功能**: 推送AI生成的消息、投票状态变化

**技术**: 使用EventSource实现服务器推送

**响应格式**:

```
data: {"type":"status","data":{"isSpeaking":false,"currentSpeaker":null,"messageCount":2,"sessionId":"session_1773667361294_tfn7ztm05","proposal":{"id":"proposal_1773667361294","topicType":"war","content":"我们要攻打匈奴","costTreasury":40,"status":"passed","votes":{},"startTime":"2026-03-16T13:22:41.294Z"},"votes":{"bingbu":"support"},"agentStats":{"libu":{"loyalty":82.345...,"power":65.123...,"bias":"pro","obeyRate":75.456...,"biasWar":55.789...},...}}}
```

### 3.4 设置文武倾向

**接口**: `POST /api/group-chat/era-spirit`

**功能**: 设置当前朝代的文武倾向，影响部门投票权重

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `spirit` | string | 是 | 文武倾向，可选值：balanced, military, civil |

**响应格式**:

```json
{
  "success": true,
  "data": {
    "message": "已设置文武倾向为: military"
  }
}
```

### 3.5 开始群聊会话

**接口**: `POST /api/group-chat/start`

**功能**: 开始一个新的群聊会话

**响应格式**:

```json
{
  "success": true,
  "data": {
    "message": "群聊已开始",
    "agents": [
      {"id": "libu", "name": "吏部尚书"},
      {"id": "hubu", "name": "户部尚书"},
      {"id": "libubu", "name": "礼部尚书"},
      {"id": "bingbu", "name": "兵部尚书"},
      {"id": "xingbu", "name": "刑部尚书"},
      {"id": "gongbu", "name": "工部尚书"}
    ]
  }
}
```

### 3.6 获取群聊历史记录

**接口**: `GET /api/group-chat/history`

**功能**: 获取群聊历史消息

**响应格式**:

```json
{
  "success": true,
  "data": {
    "history": [
      {
        "role": "player",
        "content": "我们要攻打匈奴",
        "timestamp": "2026-03-16T13:22:41.294Z"
      },
      {
        "role": "agent",
        "content": "陛下，臣支持该议案...",
        "agentId": "bingbu",
        "agentName": "兵部尚书",
        "timestamp": "2026-03-16T13:22:45.123Z"
      }
    ],
    "status": {
      "isSpeaking": false,
      "currentSpeaker": null,
      "messageCount": 2
    }
  }
}
```

### 3.7 玩家发言

**接口**: `POST /api/group-chat/player-speak`

**功能**: 玩家在群聊中发言，触发AI回复

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `message` | string | 是 | 玩家发言内容 |
| `worldState` | object | 是 | 当前世界状态 |

**响应格式**:

```json
{
  "success": true,
  "data": {
    "type": "reactions_available",
    "reactions": [
      {"agentId": "bingbu", "agentName": "兵部尚书"},
      {"agentId": "hubu", "agentName": "户部尚书"},
      ...
    ],
    "mainDepartment": "bingbu",
    "departmentOrder": ["bingbu", "hubu", "libu", "libubu", "xingbu", "gongbu"]
  }
}
```

### 3.8 Agent发言（流式）

**接口**: `POST /api/group-chat/agent-speak`

**功能**: Agent在群聊中发言，返回流式响应

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `agentId` | string | 是 | Agent ID |
| `topic` | string | 是 | 发言主题 |
| `worldState` | object | 是 | 当前世界状态 |

**响应格式**:

```
data: {"type":"chunk","agentId":"bingbu","agentName":"兵部尚书","content":"陛下，臣认为","isComplete":false}

data: {"type":"chunk","agentId":"bingbu","agentName":"兵部尚书","content":"当前军力不足","isComplete":false}

data: {"type":"complete","agentId":"bingbu","agentName":"兵部尚书","content":"陛下，臣认为当前军力不足，建议先加强训练","isComplete":true,"vote":"oppose"}

data: [DONE]
```

### 3.9 Agent发言（同步）

**接口**: `POST /api/group-chat/agent-speak-sync`

**功能**: Agent在群聊中发言，返回完整响应

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| `agentId` | string | 是 | Agent ID |
| `topic` | string | 是 | 发言主题 |
| `worldState` | object | 是 | 当前世界状态 |

**响应格式**:

```json
{
  "success": true,
  "data": {
    "agentId": "bingbu",
    "agentName": "兵部尚书",
    "content": "陛下，臣认为当前军力不足，建议先加强训练",
    "history": [
      // 完整的聊天历史
    ]
  }
}
```

### 3.10 获取群聊状态

**接口**: `GET /api/group-chat/status`

**功能**: 获取当前群聊状态

**响应格式**:

```json
{
  "success": true,
  "data": {
    "isSpeaking": false,
    "currentSpeaker": null,
    "messageCount": 2,
    "sessionId": "session_1773667361294_tfn7ztm05",
    "proposal": {
      "id": "proposal_1773667361294",
      "topicType": "war",
      "content": "我们要攻打匈奴",
      "costTreasury": 40,
      "status": "passed",
      "votes": {},
      "startTime": "2026-03-16T13:22:41.294Z"
    },
    "votes": {
      "bingbu": "support"
    },
    "agentStats": {
      "libu": {
        "loyalty": 82.345,
        "power": 65.123,
        "bias": "pro",
        "obeyRate": 75.456,
        "biasWar": 55.789
      },
      // 其他部门的状态
    }
  }
}
```

## 4. 游戏状态管理接口详细说明

### 4.1 获取全局状态快照

**接口**: `GET /api/game/state`

**功能**: 获取当前所有数值的完整状态，用于前端初始化UI

**响应格式**:

```json
{
  "success": true,
  "data": {
    "era_spirit": 80,
    "treasury": 45,
    "livelihood": 60,
    "agents": [
      {
        "dept": "war",
        "power": 90,
        "loyalty": 75,
        "bias_war": 40
      },
      {
        "dept": "finance",
        "power": 60,
        "loyalty": 80,
        "bias_money": -20
      },
      {
        "dept": "culture",
        "power": 50,
        "loyalty": 70,
        "bias_culture": 30
      },
      {
        "dept": "infrastructure",
        "power": 40,
        "loyalty": 65,
        "bias_infra": 25
      },
      {
        "dept": "politics",
        "power": 80,
        "loyalty": 75,
        "bias_politics": 15
      },
      {
        "dept": "law",
        "power": 55,
        "loyalty": 85,
        "bias_law": 20
      }
    ],
    "active_buffs": [],
    "active_debuffs": [],
    "lastDisasterRound": -1,
    "currentRound": 0,
    "粮食": 300,
    "民心": 60,
    "军力": 50,
    "稳定度": 70,
    "威望": 50,
    "文化": 50,
    "工程": 50,
    "法律": 50
  }
}
```

### 4.2 手动触发回合结算

**接口**: `POST /api/game/round/end`

**功能**: 执行回合结束逻辑，包括自然增长、BUFF触发、状态更新等

**响应格式**:

```json
{
  "success": true,
  "data": {
    "new_buffs": [],
    "new_debuffs": [],
    "updated_stats": {
      "treasury": {
        "old": 45,
        "new": 50
      },
      "currentRound": {
        "old": 0,
        "new": 1
      },
      "粮食": {
        "old": 300,
        "new": 310
      }
    },
    "narrative": "今年风调雨顺，粮食丰收..."
  }
}
```

**回合结算逻辑**:

1. **自然增长**：
   - 粮食 +10
   - 税收 +5

2. **BUFF/DEBUFF触发条件检查**：
   - 如果上一回合无天灾，触发"风调雨顺"BUFF
   - 检查其他BUFF/DEBUFF的触发条件

3. **应用BUFF效果**：
   - 风调雨顺：粮食 +20，livelihood +5
   - 其他BUFF效果

4. **应用DEBUFF效果**：
   - 旱灾：粮食 -15，livelihood -10
   - 其他DEBUFF效果

5. **数值边界检查**：
   - 确保所有数值在合理范围内

6. **增加回合数**：
   - currentRound +1

### 4.3 模拟天灾事件

**接口**: `POST /api/game/disaster`

**功能**: 模拟天灾事件，影响游戏状态

**响应格式**:

```json
{
  "success": true,
  "data": {
    "type": "DISASTER",
    "data": {
      "disasterType": "drought",
      "effects": {
        "粮食": -30,
        "livelihood": -15,
        "民心": -10
      }
    }
  }
}
```

**天灾效果**:

- 旱灾：
  - 粮食 -30
  - livelihood -15
  - 民心 -10
  - 添加DEBUFF_01（旱灾）

### 4.4 游戏状态实时流

**接口**: `GET /api/game/stream`

**功能**: 实时推送游戏状态变化

**技术**: 使用EventSource实现服务器推送

**响应格式**:

```
data: {"type":"INITIAL_STATE","data":{"era_spirit":80,"treasury":45,...}}

data: {"type":"UPDATE_STATS","data":{"treasury":{"old":45,"new":50},"粮食":{"old":300,"new":310}}}

data: {"type":"DISASTER","data":{"disasterType":"drought","effects":{"粮食":-30,...}}}
```

**消息类型**:

1. **INITIAL_STATE**：初始状态
   - 连接建立时发送
   - 包含完整的游戏状态

2. **UPDATE_STATS**：状态更新
   - 当任何数值变化时发送
   - 包含变化的差值

3. **DISASTER**：天灾事件
   - 当触发天灾时发送
   - 包含灾害类型和影响

## 5. 数据结构定义

### 5.1 聊天消息（ChatMessage）

```json
{
  "id": "msg_1773667361294_player",
  "senderId": "player",
  "content": "当前朝廷人事状况如何？",
  "timestamp": 1773667361294
}
```

### 5.2 Agent信息（AgentInfo）

```json
{
  "id": "libu",
  "name": "吏部尚书",
  "department": "libu"
}
```

### 5.3 游戏状态（GameState）

```json
{
  "era_spirit": 80,              // 文武倾向
  "treasury": 45,                // 国库
  "livelihood": 60,              // 民生
  "agents": [                    // 各部门状态
    {
      "dept": "war",             // 部门名称
      "power": 90,               // 权力值
      "loyalty": 75,             // 忠诚度
      "bias_war": 40             // 战争倾向
    }
  ],
  "active_buffs": [],            // 激活的BUFF
  "active_debuffs": [],          // 激活的DEBUFF
  "lastDisasterRound": -1,       // 上次天灾回合
  "currentRound": 0,             // 当前回合数
  "粮食": 300,                  // 粮食
  "民心": 60,                   // 民心
  "军力": 50,                   // 军力
  "稳定度": 70,                 // 稳定度
  "威望": 50,                   // 威望
  "文化": 50,                   // 文化
  "工程": 50,                   // 工程
  "法律": 50                    // 法律
}
```

### 5.4 Agent状态（AgentStats）

```json
{
  "libu": {
    "loyalty": 82.345,      // 忠诚度
    "power": 65.123,         // 权力值
    "bias": "pro",          // 倾向
    "obeyRate": 75.456,      // 顺从概率
    "biasWar": 55.789        // 战争倾向
  }
}
```

### 5.5 投票结果（VoteResult）

```json
{
  "supportWeight": 77.097,  // 支持票权重
  "opposeWeight": 0,        // 反对票权重
  "totalWeight": 77.097,     // 总权重
  "supportRate": 100,        // 支持率
  "passed": true,            // 是否通过
  "votes": {                 // 各部门投票
    "bingbu": "support",
    "hubu": "oppose"
  }
}
```

### 5.6 状态更新（StateUpdate）

```json
{
  "treasury": {
    "old": 45,
    "new": 50
  },
  "粮食": {
    "old": 300,
    "new": 310
  },
  "agents": [
    // 完整的agents数组
  ],
  "active_buffs": ["BUFF_02"],
  "active_debuffs": ["DEBUFF_01"]
}
```

## 6. 错误处理

所有API接口都返回统一的错误格式：

```json
{
  "success": false,
  "error": "错误信息"
}
```

常见错误类型：

| 错误信息 | 原因 |
|---------|------|
| 缺少必要参数 | 请求参数不完整 |
| 无效的Agent ID | agentId参数错误 |
| 缺少agentId参数 | 请求参数不完整 |
| 群聊未初始化 | 未调用start接口 |
| 会话ID不匹配 | session_id参数错误 |
| 无效的文武倾向 | spirit参数值错误 |
| 未找到Agent | agentId参数错误 |
| 获取游戏状态失败 | 服务器内部错误 |
| 执行回合结算失败 | 服务器内部错误 |
| 触发天灾失败 | 服务器内部错误 |

## 7. 示例代码

### 7.1 获取Agent列表

```javascript
fetch('/api/agents')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('Agent列表:', data.data.agents);
      // 显示Agent列表
      displayAgentList(data.data.agents);
    } else {
      console.error('获取Agent列表失败:', data.error);
    }
  });
```

### 7.2 发送私聊消息

```javascript
async function sendPrivateMessage(agentId, message) {
  const response = await fetch('/api/chat/private', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      agentId: agentId,
      message: message
    })
  });
  
  const data = await response.json();
  if (data.success) {
    console.log('私聊回复:', data.data.message);
    // 显示AI回复
    displayAgentMessage(agentId, data.data.message);
    // 刷新聊天历史
    loadChatHistory(agentId);
  } else {
    console.error('发送私聊失败:', data.error);
  }
}

// 使用示例
sendPrivateMessage('libu', '当前朝廷人事状况如何？');
```

### 7.3 获取私聊历史记录

```javascript
function loadChatHistory(agentId) {
  fetch(`/api/chat/history?agentId=${agentId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('聊天历史:', data.data.messages);
        // 显示聊天历史
        displayChatHistory(data.data.messages);
      } else {
        console.error('获取聊天历史失败:', data.error);
      }
    });
}

// 使用示例
loadChatHistory('libu');
```

### 7.4 完整的私聊对话框实现

```javascript
class PrivateChatWindow {
  constructor(agentId, agentName) {
    this.agentId = agentId;
    this.agentName = agentName;
    this.messages = [];
    this.init();
  }
  
  init() {
    // 加载聊天历史
    this.loadHistory();
    // 绑定发送按钮
    document.getElementById('sendButton').addEventListener('click', () => {
      this.sendMessage();
    });
    // 绑定回车发送
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });
  }
  
  async loadHistory() {
    const response = await fetch(`/api/chat/history?agentId=${this.agentId}`);
    const data = await response.json();
    if (data.success) {
      this.messages = data.data.messages;
      this.displayMessages();
    }
  }
  
  async sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    if (!message) return;
    
    // 显示玩家消息
    this.addMessage('player', message);
    input.value = '';
    
    // 发送到服务器
    const response = await fetch('/api/chat/private', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agentId: this.agentId,
        message: message
      })
    });
    
    const data = await response.json();
    if (data.success) {
      // 显示Agent回复
      this.addMessage('agent', data.data.message);
    } else {
      console.error('发送失败:', data.error);
    }
  }
  
  addMessage(sender, content) {
    const timestamp = Date.now();
    this.messages.push({
      id: `msg_${timestamp}_${sender}`,
      senderId: sender === 'player' ? 'player' : this.agentId,
      content: content,
      timestamp: timestamp
    });
    this.displayMessages();
  }
  
  displayMessages() {
    const container = document.getElementById('chatMessages');
    container.innerHTML = '';
    
    this.messages.forEach(msg => {
      const messageDiv = document.createElement('div');
      messageDiv.className = msg.senderId === 'player' ? 'player-message' : 'agent-message';
      
      const senderName = msg.senderId === 'player' ? '陛下' : this.agentName;
      const time = new Date(msg.timestamp).toLocaleTimeString();
      
      messageDiv.innerHTML = `
        <div class="message-header">
          <span class="sender">${senderName}</span>
          <span class="time">${time}</span>
        </div>
        <div class="message-content">${msg.content}</div>
      `;
      
      container.appendChild(messageDiv);
    });
    
    // 滚动到底部
    container.scrollTop = container.scrollHeight;
  }
}

// 使用示例
const chatWindow = new PrivateChatWindow('libu', '吏部尚书');
```

### 7.5 发起议案

```javascript
fetch('/api/group-chat/proposal/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    topic_type: 'war',
    content: '我们要攻打匈奴',
    cost_treasury: 40
  })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('议案发起成功:', data.data);
    const sessionId = data.data.sessionId;
  } else {
    console.error('议案发起失败:', data.error);
  }
});
```

### 7.6 执行投票

```javascript
fetch('/api/group-chat/vote/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    session_id: 'session_1773667361294_tfn7ztm05',
    force_execute: false
  })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('投票执行结果:', data.data);
  } else {
    console.error('投票执行失败:', data.error);
  }
});
```

### 7.7 获取全局状态

```javascript
fetch('/api/game/state')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('游戏状态:', data.data);
      // 初始化UI
      initializeUI(data.data);
    } else {
      console.error('获取游戏状态失败:', data.error);
    }
  });
```

### 7.8 手动触发回合结算

```javascript
fetch('/api/game/round/end', {
  method: 'POST'
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('回合结算结果:', data.data);
    // 更新UI
    updateUI(data.data.updated_stats);
    // 显示叙事文本
    showNarrative(data.data.narrative);
  } else {
    console.error('回合结算失败:', data.error);
  }
});
```

### 7.9 监听游戏状态实时更新

```javascript
// 创建EventSource连接
const eventSource = new EventSource('/api/game/stream');

// 监听消息
eventSource.onmessage = function(event) {
  try {
    const data = JSON.parse(event.data);
    console.log('收到状态更新:', data);
    
    // 处理不同类型的消息
    switch(data.type) {
      case 'INITIAL_STATE':
        // 初始化UI
        initializeUI(data.data);
        break;
      case 'UPDATE_STATS':
        // 更新UI
        updateUI(data.data);
        break;
      case 'DISASTER':
        // 显示天灾通知
        showDisasterNotification(data.data);
        break;
    }
  } catch (error) {
    console.error('解析消息失败:', error);
  }
};

// 监听错误
eventSource.onerror = function(error) {
  console.error('连接错误:', error);
  eventSource.close();
};

// 关闭连接
function closeStream() {
  eventSource.close();
}
```

### 7.10 模拟天灾

```javascript
fetch('/api/game/disaster', {
  method: 'POST'
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('天灾事件:', data.data);
    // 显示天灾通知
    showDisasterNotification(data.data.data);
    // 更新UI
    updateUI(data.data.data.effects);
  } else {
    console.error('触发天灾失败:', data.error);
  }
});
```

### 7.11 实时消息流（群聊）

```javascript
// 创建EventSource连接
const eventSource = new EventSource('/api/group-chat/stream');

// 监听消息
eventSource.onmessage = function(event) {
  try {
    const data = JSON.parse(event.data);
    console.log('收到实时消息:', data);
    
    // 处理不同类型的消息
    if (data.type === 'status') {
      // 更新群聊状态
      updateChatStatus(data.data);
    }
  } catch (error) {
    console.error('解析消息失败:', error);
  }
};

// 监听错误
eventSource.onerror = function(error) {
  console.error('连接错误:', error);
  eventSource.close();
};

// 关闭连接
function closeStream() {
  eventSource.close();
}
```

## 8. 注意事项

### 8.1 私聊系统

1. **Agent选择**：用户需要先选择要对话的Agent，才能发送私聊消息
2. **历史记录**：每个Agent的聊天历史独立保存，最多保留50条消息
3. **上下文管理**：AI回复时会参考最近10条消息的上下文
4. **错误处理**：发送失败时需要提示用户，并允许重试
5. **UI更新**：消息发送后立即显示，AI回复后更新UI

### 8.2 群聊系统

1. **会话管理**：每个群聊会话都有唯一的sessionId，后续操作需要使用该ID
2. **实时通信**：使用EventSource进行实时消息推送，需要前端正确处理连接和重连
3. **投票权重**：投票结果基于部门权力值和文武倾向计算，不同朝代可能有不同的权重分配
4. **强制执行**：强制执行议案会导致忠诚度和威望下降，需要谨慎使用
5. **错误处理**：所有API调用都应该处理错误情况，确保系统稳定性

### 8.3 游戏状态管理

1. **状态同步**：前端UI上显示的进度条、数字必须与数据库中的真实状态严格一致
2. **实时更新**：使用EventSource实时获取状态更新，避免轮询带来的性能问题
3. **回合结算**：可以手动触发回合结算，也可以等待后端定时器自动执行（默认60秒）
4. **天灾系统**：天灾会严重影响游戏状态，需要在前端显示明显的通知
5. **BUFF/DEBUFF**：注意BUFF和DEBUFF的持续时间和效果，及时更新UI显示
6. **状态持久化**：游戏状态会自动保存到文件，服务器重启后会自动加载

### 8.4 性能优化

1. **减少请求**：尽量使用实时流接口，避免频繁轮询
2. **缓存数据**：合理缓存游戏状态和聊天历史，减少不必要的请求
3. **批量更新**：UI更新时尽量批量处理，避免频繁重绘
4. **错误重试**：网络错误时实现自动重试机制
5. **消息分页**：聊天历史较多时实现分页加载

## 9. 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.0 | 2026-03-16 | 初始版本，实现基本群聊和投票功能 |
| 1.1 | 2026-03-16 | 新增游戏状态管理接口，支持实时数据同步 |
| 1.2 | 2026-03-16 | 新增私聊系统接口，支持与Agent一对一对话 |

---

**文档作者**: bit_Hlh
**最后更新**: 2026-03-16
