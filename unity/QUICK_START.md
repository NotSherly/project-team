# Unity 私聊系统 - 快速开始指南

## 🎯 项目状态

### ✅ 已完成
1. **后端 API 服务**（demo 文件夹）
   - 6 个部门 Agent 的私聊接口
   - 集成豆包大模型
   - 对话历史保存
   - 服务器地址：http://localhost:3000

2. **Unity C# 脚本**（全部完成）
   - 网络通信层：ApiClient.cs, NetworkManager.cs
   - 游戏逻辑层：ChatManager.cs, GameManager.cs
   - UI 控制层：PrivateChatWindow.cs, ChatMessageItem.cs, AgentButton.cs, AgentListManager.cs, PrivateChatPanel.cs
   - 数据模型层：ChatMessage.cs, ConversationData.cs, AgentData.cs

3. **自动化工具**
   - PrivateChatUIBuilder.cs - 一键创建 UI 界面

### ⏳ 需要在 Unity Editor 中完成

## 🚀 快速开始（3 步完成）

### 第 1 步：启动后端服务器

```bash
cd d:/Desktop/Workbench/TXAI_GAME/project-team/demo
node server.js
```

看到 "Server running on http://localhost:3000" 表示成功。

### 第 2 步：在 Unity Editor 中自动创建 UI

1. 打开 Unity 项目：`d:\Desktop\Workbench\TXAI_GAME\project-team\unity`
2. 打开场景：`Assets/Scenes/MainScene.unity`
3. 点击菜单：**Tools → Build Private Chat UI**
4. 点击"确定"

脚本会自动创建：
- MainCanvas（如果不存在）
- PrivateChatButton（右下角私聊按钮）
- PrivateChatWindow（私聊窗口面板）
- NetworkManager 和 ChatManager 对象
- 必要的文件夹结构

### 第 3 步：手动配置组件引用

#### 3.1 配置 NetworkManager
1. 选中 Hierarchy 中的 `NetworkManager`
2. 在 Inspector 中点击 "Add Component"
3. 搜索并添加 `NetworkManager` 脚本

#### 3.2 配置 ChatManager
1. 选中 Hierarchy 中的 `ChatManager`
2. 在 Inspector 中点击 "Add Component"
3. 搜索并添加 `ChatManager` 脚本

#### 3.3 创建 ChatMessageItem 预制体

**方法 A：简化版（推荐用于快速测试）**

1. Hierarchy → 右键 → UI → Panel，命名为 `ChatMessageItem`
2. 添加子对象：
   ```
   ChatMessageItem
   ├── PlayerContainer (Panel)
   │   └── PlayerMessage (Text) - 设置字体大小 20，颜色白色
   └── AgentContainer (Panel)
       └── AgentMessage (Text) - 设置字体大小 20，颜色白色
   ```
3. 添加 `ChatMessageItem.cs` 脚本到根对象
4. 连接引用（在 Inspector 中）：
   - Player Container → PlayerContainer
   - Player Message → PlayerContainer/PlayerMessage
   - Agent Container → AgentContainer
   - Agent Message → AgentContainer/AgentMessage
5. 拖拽到 `Assets/Prefabs/UI/` 保存为预制体
6. 删除 Hierarchy 中的临时对象

**方法 B：完整版（包含头像和名称）**

参考 `UNITY_PRIVATE_CHAT_SETUP.md` 文档中的详细步骤。

#### 3.4 创建 AgentButton 预制体

1. Hierarchy → 右键 → UI → Button，命名为 `AgentButton`
2. 设置 RectTransform：
   - Height: 80
3. 修改子对象 Text：
   - 重命名为 `Name`
   - 字体大小：24
   - 对齐方式：居中
4. 添加 `AgentButton.cs` 脚本到根对象
5. 连接引用：
   - Agent Name Text → Name
6. 拖拽到 `Assets/Prefabs/UI/` 保存为预制体
7. 删除 Hierarchy 中的临时对象

#### 3.5 配置 PrivateChatWindow

1. 选中 `MainCanvas/PrivateChatWindow`
2. 添加 `PrivateChatWindow.cs` 脚本
3. 连接引用：
   - Chat Window → PrivateChatWindow（自身）
   - Agent Name Text → ContentPanel/Header/AgentName
   - Message List → ContentPanel/MessageArea/ScrollView/Viewport/MessageListContent
   - Message Input → ContentPanel/InputArea/MessageInput
   - Send Button → ContentPanel/InputArea/SendButton
   - Message Item Prefab → 拖入 ChatMessageItem 预制体

#### 3.6 配置 AgentListManager

1. 选中 `MainCanvas/PrivateChatWindow/ContentPanel/AgentList`
2. 添加 `AgentListManager.cs` 脚本
3. 连接引用：
   - Agent Button Prefab → 拖入 AgentButton 预制体
   - Agent List Content → ScrollView/Viewport/AgentListContent
   - Chat Window → 拖入 PrivateChatWindow 对象

#### 3.7 配置按钮事件

**私聊按钮：**
1. 选中 `MainCanvas/PrivateChatButton`
2. 在 Button 组件的 OnClick 事件中：
   - 点击 "+" 添加事件
   - 拖入 `PrivateChatWindow` 对象
   - 选择函数：`GameObject.SetActive(bool)` 并勾选为 true

**关闭按钮：**
1. 选中 `MainCanvas/PrivateChatWindow/ContentPanel/Header/CloseButton`
2. 在 Button 组件的 OnClick 事件中：
   - 点击 "+" 添加事件
   - 拖入 `PrivateChatWindow` 对象
   - 选择函数：`PrivateChatWindow.CloseChat()`

## 🧪 测试

### 在 Unity Editor 中测试
1. 确保后端服务器正在运行
2. 点击 Unity 的 Play 按钮
3. 点击右下角的"私聊"按钮
4. 选择一个尚书（例如"户部尚书"）
5. 输入消息："当前国库状况如何？"
6. 点击"发送"或按回车

### WebGL 构建测试
1. File → Build Settings
2. 选择 WebGL 平台
3. 点击 "Build And Run"
4. 在浏览器中测试完整功能

## 📝 配置文件说明

### ApiConfig.json
位置：`Assets/Resources/Configs/ApiConfig.json`

```json
{
  "baseUrl": "http://localhost:3000/api",
  "endpoints": {
    "sendMessage": "/chat/private",
    "getHistory": "/chat/history",
    "getAgents": "/agents"
  },
  "timeout": 30000
}
```

**生产环境部署时修改：**
- 将 `baseUrl` 改为实际服务器地址
- 例如：`"baseUrl": "https://your-domain.com/api"`

## 🎨 6 个部门 Agent

| ID | 名称 | 职责 |
|---|---|---|
| libu | 吏部尚书 | 人事管理、官员任免 |
| hubu | 户部尚书 | 财政管理、税收国库 |
| libubu | 礼部尚书 | 礼仪教育、外交文化 |
| bingbu | 兵部尚书 | 军事管理、国防战争 |
| xingbu | 刑部尚书 | 司法刑罚、治安法律 |
| gongbu | 工部尚书 | 工程建设、水利交通 |

每个 Agent 都有独特的性格和专业知识，会根据游戏状态智能回复。

## 🔧 常见问题

### Q1: 点击发送按钮没有反应
**检查：**
1. 后端服务器是否运行（http://localhost:3000）
2. Unity Console 是否有错误日志
3. NetworkManager 和 ChatManager 是否正确初始化
4. ApiConfig.json 文件是否存在

### Q2: Agent 列表不显示
**检查：**
1. AgentListManager 脚本是否添加
2. Agent Button Prefab 引用是否连接
3. ChatManager 是否正确初始化（查看 Console）

### Q3: 消息显示格式错误
**检查：**
1. ChatMessageItem 预制体的布局设置
2. PlayerContainer 和 AgentContainer 是否正确配置
3. Text 组件的字体和颜色设置

### Q4: 网络请求超时
**检查：**
1. 后端服务器是否正常运行
2. 防火墙是否阻止了 3000 端口
3. ApiConfig.json 中的 baseUrl 是否正确

### Q5: WebGL 构建后无法连接后端
**原因：** CORS 跨域问题

**解决方案：**
后端服务器已经配置了 CORS，确保：
1. 后端 server.js 中有 `app.use(cors())` 配置
2. WebGL 构建部署在同一域名下，或
3. 修改后端 CORS 配置允许特定域名

## 📚 相关文档

- **UNITY_PRIVATE_CHAT_SETUP.md** - 详细的 UI 搭建步骤
- **demo/README.md** - 后端 API 文档
- **demo/public/private-chat.html** - Web 端测试页面

## 🎯 下一步优化

1. **添加消息时间戳显示**
2. **实现打字动画效果**
3. **添加消息发送状态（发送中、成功、失败）**
4. **实现消息撤回功能**
5. **添加表情包支持**
6. **实现消息通知提醒**
7. **添加聊天记录搜索功能**
8. **支持发送图片和文件**

## 💡 提示

- 每个 Agent 的对话历史独立保存
- Agent 会根据游戏状态（国库、民心等）调整回复
- 对话历史会作为上下文传递给大模型，实现连贯对话
- 可以在 ChatManager.cs 中修改 Agent 列表和配置

## 🆘 获取帮助

如果遇到问题：
1. 查看 Unity Console 的错误日志
2. 查看浏览器开发者工具的 Network 标签
3. 查看后端服务器的控制台输出
4. 参考 UNITY_PRIVATE_CHAT_SETUP.md 详细文档

---

**祝你开发顺利！** 🎉
