# 更新说明 - 天命：AI君主模拟器

## 更新日期
2026-03-04

## 更新概述
本次更新完成了AI君主模拟器的核心功能开发，包括六部Agent系统、前端可视化界面、群聊系统、AI智能排序等核心功能，并修复了多个已知问题。

---

## 一、项目初始化

### 1. 基础架构搭建
- **world.js** - 世界层数值系统
  - 实现完整的数值管理（银两、粮食、民心、军力、稳定度、威望、文化、工程、法律）
  - 实现回合制时间系统
  - 实现事件检测机制（粮荒、民变、财政危机、边关告急等）
  - 实现部门奏折缓存系统
  - 实现玩家行动记录系统

- **main.js** - 主控游戏循环
  - 实现完整的六部交互系统
  - 实现决策缓存机制（可同时选择多个决策后统一执行）
  - 实现AI决策分析（综合分析多项决策的影响）
  - 实现默认决策逻辑作为后备方案

- **server.js** - 后端API服务器
  - 提供游戏状态API
  - 提供回合制API
  - 提供部门交互API
  - 提供群聊系统API

### 2. AI服务集成
- **ai_service.js** - AI服务类
  - 封装豆包API调用
  - 实现缓存管理机制
  - 实现流式响应生成
  - 实现fallback响应机制

---

## 二、六部Agent系统

### 1. Agent配置文件
为六部尚书分别创建了详细的配置文件：

| 部门 | 配置文件 | 性格特点 | 核心职责 |
|------|----------|----------|----------|
| 吏部 | libu_agent_config.json | 忠心耿耿，直言敢谏，统筹全局 | 选拔任免官员、考核政绩、统筹六部协作 |
| 户部 | hubu_agent_config.json | 精明干练，善于理财，注重实效 | 统计人口田亩、征收赋税、管理财政 |
| 礼部 | libubu_agent_config.json | 博学多才，温文尔雅，注重礼教 | 典章制度、祭祀礼仪、学校教育、科举考试 |
| 兵部 | bingbu_agent_config.json | 刚毅果敢，忠勇善战，深谋远虑 | 选用武官、兵籍管理、军械装备、军事战略 |
| 刑部 | xingbu_agent_config.json | 刚正不阿，明察秋毫，执法严明 | 刑罚政令、审核刑名案件、监督司法审判 |
| 工部 | gongbu_agent_config.json | 务实稳重，精于技艺，善于规划 | 工程建设、管理工匠、兴修水利设施 |

### 2. Agent实现文件
- **libu_agent.js** - 吏部尚书Agent
- **hubu_agent.js** - 户部尚书Agent
- **libubu_agent.js** - 礼部尚书Agent
- **bingbu_agent.js** - 兵部尚书Agent
- **xingbu_agent.js** - 刑部尚书Agent
- **gongbu_agent.js** - 工部尚书Agent
- **narrative_agent.js** - 叙事Agent（生成历史叙事）
- **npc_agent.js** - NPC Agent（通用NPC交互）

### 3. 配置文件结构
每个Agent配置文件包含：
- `agent` - 角色基本信息（姓名、身份、性格、目标、职责、部门关系）
- `prompts` - 提示词配置（系统提示、奏折模板、约束条件）
- `events` - 事件触发配置（阈值、变体、概率）
- `chat` - 对话配置（系统提示、响应风格）
- `fallback` - 后备选项

### 4. 部门关系网络
实现了六部之间的协作关系：
```
吏部 ←→ 户部：协调财政与人事，确保官员俸禄发放
吏部 ←→ 礼部：配合科举考试，选拔优秀人才
吏部 ←→ 兵部：选拔武官，考核军事人才
吏部 ←→ 刑部：监督官员廉洁，惩治贪腐
吏部 ←→ 工部：选拔工程人才，考核工程官员

户部 → 各部门：提供资金支持
礼部 → 各部门：培养和输送人才
兵部 → 国家：提供军事保障
刑部 → 各部门：监督廉洁，维护法治
工部 → 国家：建设基础设施
```

---

## 三、前端可视化界面

### 1. 主界面 (public/index.html)
- **国家状态面板**
  - 显示时间、银两、粮食、民心、军力、稳定度、威望等数值
  - 数值预警显示（低于阈值时红色警告）
  
- **部门选择面板**
  - 六部选择按钮
  - 显示部门名称和简介
  
- **奏折详情面板**
  - 显示当前选中部门的奏折内容
  - 显示决策选项
  
- **决策按钮区域**
  - 预设选项按钮
  - 自定义决策输入框
  - 执行决策按钮

- **日志控制台**
  - 实时显示系统日志
  - 支持不同级别的日志（info、warn、error）

### 2. 群聊界面 (public/group-chat.html)
- **聊天消息区域**
  - 显示玩家和六部尚书的对话
  - 支持消息动画效果
  - 自动滚动到最新消息

- **部门列表**
  - 显示六部尚书状态
  - 点击可触发发言
  - 显示当前发言状态

- **快捷话题**
  - 预设常见话题按钮
  - 一键发送话题

- **国家状态显示**
  - 实时显示国家各项数值

- **日志控制台**
  - 显示详细的系统日志
  - 支持调试信息显示

---

## 四、群聊系统

### 1. 核心功能
- **group_chat.js** - 群聊核心逻辑
  - 消息历史管理（最多保存100条）
  - Agent管理（加载六部配置）
  - 流式响应生成
  - 共享上下文处理

### 2. AI智能排序系统
- **功能描述**：根据对话内容智能决定发言顺序
- **实现方式**：
  - 分析消息涉及哪些部门的职责
  - 考虑当前国家状态
  - 考虑对话历史
  - 返回JSON格式的部门顺序
- **后备方案**：关键词匹配排序

### 3. 自动发言机制
- 玩家发送消息后自动触发第一个部门发言
- 支持"下一个发言"按钮按顺序发言
- 玩家插嘴时重新进行AI排序

### 4. 互相掣肘功能
- 尚书们可以提出反驳和争论
- 从部门立场出发提出反对意见
- 反驳适度，增加游戏趣味性

---

## 五、API接口

### 游戏状态API
- `GET /api/game/state` - 获取游戏状态
- `POST /api/game/start` - 开始游戏
- `POST /api/game/next-turn` - 进入下一回合

### 部门交互API
- `GET /api/departments` - 获取部门列表
- `GET /api/departments/:id/memorial` - 获取部门奏折
- `POST /api/departments/:id/decide` - 执行部门决策
- `POST /api/departments/:id/chat` - 与部门对话

### 群聊系统API
- `POST /api/group-chat/start` - 开始群聊
- `POST /api/group-chat/player-speak` - 玩家发言
- `POST /api/group-chat/agent-speak` - Agent发言（流式）
- `POST /api/group-chat/agent-speak-sync` - Agent发言（同步）
- `GET /api/group-chat/status` - 获取群聊状态
- `GET /api/group-chat/history` - 获取聊天历史

---

## 六、问题修复

### 1. 滚动问题修复
- **问题描述**：group-chat.html页面无法滚动
- **解决方案**：将 `.main-content` 的 `overflow` 从 `hidden` 改为 `auto`

### 2. 服务器启动问题修复
- **问题描述**：模块导入路径错误
- **解决方案**：
  - 修正 `group_chat.js` 导入路径
  - 修正配置文件路径

### 3. 部门顺序丢失问题修复
- **问题描述**：返回 `auto_agent_speak` 时部门顺序丢失
- **解决方案**：在 server.js 中保存并合并部门顺序信息

---

## 七、技术改进

### 1. 上下文优化
- 将上下文数量从10条增加到20条
- 保持主叙事连贯性

### 2. 错误处理改进
- 统一使用 `logMessage` 函数
- 添加详细的错误日志

### 3. 代码结构优化
- 新增 `determineDepartmentByKeywords` 作为后备方案
- 优化 `playerSpeak` 方法逻辑流程

---

## 八、文件结构

```
demo/
├── agents/
│   ├── agents_config/
│   │   ├── libu_agent_config.json
│   │   ├── hubu_agent_config.json
│   │   ├── libubu_agent_config.json
│   │   ├── bingbu_agent_config.json
│   │   ├── xingbu_agent_config.json
│   │   └── gongbu_agent_config.json
│   ├── libu_agent.js
│   ├── hubu_agent.js
│   ├── libubu_agent.js
│   ├── bingbu_agent.js
│   ├── xingbu_agent.js
│   ├── gongbu_agent.js
│   ├── narrative_agent.js
│   └── npc_agent.js
├── public/
│   ├── index.html
│   └── group-chat.html
├── ai_service.js
├── group_chat.js
├── main.js
├── server.js
├── world.js
├── package.json
├── README.md
└── CHANGELOG.md
```

---

## 九、使用说明

### 环境配置
1. 在项目根目录创建 `.env` 文件
2. 配置 `DOUBAO_API_KEY` 和 `DOUBAO_API_URL`

### 启动服务
```bash
cd demo
npm install
npm start
```

### 访问地址
- 主界面：http://localhost:3000/index.html
- 群聊系统：http://localhost:3000/group-chat.html

### 操作流程
1. 点击"开始游戏"
2. 查看国家状态和各部门奏折
3. 选择部门进行交互
4. 选择或输入决策
5. 点击"进入下一回合"执行决策
6. 查看决策影响和国家状态变化

---

## 十、后续计划

1. **性能优化**
   - 缓存AI排序结果
   - 优化大量消息时的渲染性能

2. **功能扩展**
   - 支持玩家直接指定发言顺序
   - 添加历史事件回顾功能
   - 实现多轮对话记忆

3. **UI优化**
   - 添加发言顺序可视化展示
   - 优化移动端适配
   - 添加主题切换功能

4. **AI优化**
   - 优化AI排序提示词
   - 提高排序准确性
   - 增加更多个性化回复

---

## 备注

- 本次更新需要配置 `.env` 文件中的 `DOUBAO_API_KEY` 才能正常使用AI功能
- 如果AI服务不可用，系统会自动降级到关键词匹配模式
- 建议使用 Node.js v16 或更高版本
