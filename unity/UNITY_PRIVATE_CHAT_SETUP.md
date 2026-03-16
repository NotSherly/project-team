# Unity 私聊界面搭建指南

## 项目概述
本指南将帮助你在 Unity 中创建一个完整的私聊系统，包括 UI 界面、网络通信和数据持久化。

## 已完成的代码
✅ 所有 C# 脚本已经创建完成，位于：
- `/Assets/Scripts/Network/` - 网络通信层
- `/Assets/Scripts/Game/` - 游戏逻辑层
- `/Assets/Scripts/UI/PrivateChat/` - UI 控制层
- `/Assets/Scripts/Data/` - 数据模型层

## 需要在 Unity Editor 中完成的步骤

### 第一步：创建 UI 预制体

#### 1. 创建 ChatMessageItem 预制体
1. 在 Hierarchy 中右键 → UI → Panel，命名为 `ChatMessageItem`
2. 添加以下子对象：
   ```
   ChatMessageItem (Panel)
   ├── PlayerContainer (Panel) - 玩家消息容器
   │   ├── PlayerAvatar (Image) - 玩家头像
   │   ├── PlayerName (Text) - 玩家名称
   │   └── PlayerMessage (Text) - 玩家消息内容
   └── AgentContainer (Panel) - Agent消息容器
       ├── AgentAvatar (Image) - Agent头像
       ├── AgentName (Text) - Agent名称
       └── AgentMessage (Text) - Agent消息内容
   ```
3. 添加 `ChatMessageItem.cs` 脚本到根对象
4. 在 Inspector 中连接引用：
   - Player Container → PlayerContainer
   - Player Avatar → PlayerAvatar
   - Player Name → PlayerName
   - Player Message → PlayerMessage
   - Agent Container → AgentContainer
   - Agent Avatar → AgentAvatar
   - Agent Name → AgentName
   - Agent Message → AgentMessage
5. 拖拽到 `/Assets/Prefabs/UI/` 文件夹保存为预制体

#### 2. 创建 AgentButton 预制体
1. 在 Hierarchy 中右键 → UI → Button，命名为 `AgentButton`
2. 添加以下子对象：
   ```
   AgentButton (Button)
   ├── Avatar (Image) - Agent头像
   └── Name (Text) - Agent名称
   ```
3. 添加 `AgentButton.cs` 脚本到根对象
4. 在 Inspector 中连接引用：
   - Agent Avatar → Avatar
   - Agent Name Text → Name
5. 拖拽到 `/Assets/Prefabs/UI/` 文件夹保存为预制体

### 第二步：创建主界面 UI

#### 1. 创建 Canvas
1. Hierarchy → 右键 → UI → Canvas，命名为 `MainCanvas`
2. 设置 Canvas Scaler：
   - UI Scale Mode: Scale With Screen Size
   - Reference Resolution: 1920x1080

#### 2. 创建私聊按钮
1. 在 MainCanvas 下创建 Button，命名为 `PrivateChatButton`
2. 设置位置（例如右下角）：
   - Anchor: Bottom Right
   - Position: (-100, 100, 0)
3. 修改按钮文字为 "私聊"

#### 3. 创建私聊窗口
1. 在 MainCanvas 下创建 Panel，命名为 `PrivateChatWindow`
2. 设置为全屏或居中显示
3. 添加以下子对象结构：
   ```
   PrivateChatWindow (Panel)
   ├── Header (Panel) - 顶部栏
   │   ├── AgentName (Text) - 当前对话的Agent名称
   │   └── CloseButton (Button) - 关闭按钮
   ├── AgentList (Panel) - Agent列表区域
   │   └── AgentListContent (Vertical Layout Group) - Agent按钮容器
   ├── MessageArea (Panel) - 消息显示区域
   │   └── ScrollView
   │       └── Viewport
   │           └── MessageListContent (Vertical Layout Group) - 消息列表容器
   └── InputArea (Panel) - 输入区域
       ├── MessageInput (InputField) - 消息输入框
       └── SendButton (Button) - 发送按钮
   ```

#### 4. 配置 PrivateChatWindow 组件
1. 添加 `PrivateChatWindow.cs` 脚本到 PrivateChatWindow 对象
2. 在 Inspector 中连接所有引用：
   - Chat Window → PrivateChatWindow (自身)
   - Agent Name Text → Header/AgentName
   - Message List → MessageArea/ScrollView/Viewport/MessageListContent
   - Message Input → InputArea/MessageInput
   - Send Button → InputArea/SendButton
   - Message Item Prefab → 拖入之前创建的 ChatMessageItem 预制体

### 第三步：配置 Agent 列表

#### 1. 创建 AgentListManager 脚本
创建新脚本 `/Assets/Scripts/UI/PrivateChat/AgentListManager.cs`：

```csharp
using UnityEngine;
using TXAI.Game.Game;

namespace TXAI.Game.UI.PrivateChat
{
    public class AgentListManager : MonoBehaviour
    {
        public GameObject agentButtonPrefab;
        public Transform agentListContent;
        public PrivateChatWindow chatWindow;

        private void Start() {
            LoadAgentButtons();
        }

        private void LoadAgentButtons() {
            var agents = ChatManager.Instance.GetAgents();
            foreach (var agent in agents) {
                GameObject buttonObj = Instantiate(agentButtonPrefab, agentListContent);
                AgentButton button = buttonObj.GetComponent<AgentButton>();
                if (button != null) {
                    button.Initialize(agent, chatWindow);
                }
            }
        }
    }
}
```

#### 2. 配置 AgentListManager
1. 添加 `AgentListManager.cs` 脚本到 PrivateChatWindow 对象（或创建单独的 GameObject）
2. 连接引用：
   - Agent Button Prefab → 拖入 AgentButton 预制体
   - Agent List Content → AgentList/AgentListContent
   - Chat Window → PrivateChatWindow

### 第四步：配置网络管理器

#### 1. 创建 API 配置文件
1. 在 `/Assets/Resources/Configs/` 创建文件夹（如果不存在）
2. 创建 `ApiConfig.json` 文件：
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

#### 2. 创建 NetworkManager GameObject
1. Hierarchy → 右键 → Create Empty，命名为 `NetworkManager`
2. 添加 `NetworkManager.cs` 脚本
3. 勾选 "Don't Destroy On Load"

#### 3. 创建 ChatManager GameObject
1. Hierarchy → 右键 → Create Empty，命名为 `ChatManager`
2. 添加 `ChatManager.cs` 脚本
3. 勾选 "Don't Destroy On Load"

### 第五步：连接按钮事件

#### 1. 配置私聊按钮
1. 选中 `PrivateChatButton`
2. 在 Button 组件的 OnClick 事件中：
   - 点击 "+" 添加事件
   - 拖入 PrivateChatWindow 对象
   - 选择函数：`GameObject.SetActive(bool)` 并勾选为 true

#### 2. 配置关闭按钮
1. 选中 `PrivateChatWindow/Header/CloseButton`
2. 在 Button 组件的 OnClick 事件中：
   - 点击 "+" 添加事件
   - 拖入 PrivateChatWindow 对象
   - 选择函数：`PrivateChatWindow.CloseChat()`

### 第六步：添加 Agent 头像资源

1. 在 `/Assets/Resources/AgentAvatars/` 创建文件夹
2. 添加 6 个 Agent 的头像图片，命名为：
   - `libu.png` - 吏部尚书
   - `hubu.png` - 户部尚书
   - `libubu.png` - 礼部尚书
   - `bingbu.png` - 兵部尚书
   - `xingbu.png` - 刑部尚书
   - `gongbu.png` - 工部尚书

### 第七步：测试

#### 1. 启动后端服务器
```bash
cd d:/Desktop/Workbench/TXAI_GAME/project-team/demo
node server.js
```

#### 2. 在 Unity 中测试
1. 点击 Play 按钮
2. 点击 "私聊" 按钮
3. 选择一个 Agent
4. 发送消息测试

#### 3. WebGL 构建测试
1. File → Build Settings → WebGL
2. 点击 "Build And Run"
3. 在浏览器中测试完整功能

## 数据持久化说明

当前实现中，聊天记录保存在后端服务器的内存中。如果需要持久化到数据库：

1. 修改 `/demo/server.js`，添加数据库连接（如 MongoDB、MySQL）
2. 在 `POST /api/chat/private` 和 `GET /api/chat/history` 接口中添加数据库操作
3. 无需修改 Unity 代码，因为接口保持不变

## 常见问题

### Q: 消息发送失败
A: 检查：
1. 后端服务器是否运行（http://localhost:3000）
2. ApiConfig.json 中的 baseUrl 是否正确
3. 浏览器控制台是否有 CORS 错误

### Q: Agent 列表不显示
A: 检查：
1. ChatManager 是否正确初始化
2. AgentListManager 的引用是否正确连接
3. AgentButton 预制体是否正确配置

### Q: 消息显示格式错误
A: 检查：
1. ChatMessageItem 预制体的布局设置
2. Text 组件的字体大小和颜色
3. Vertical Layout Group 的 Spacing 设置

## 下一步优化建议

1. **添加消息时间戳显示**
2. **实现消息已读/未读状态**
3. **添加消息发送动画**
4. **实现消息撤回功能**
5. **添加表情包支持**
6. **实现语音消息功能**
7. **添加消息搜索功能**
8. **实现消息通知提醒**

## 文件清单

### C# 脚本（已完成）
- ✅ `/Assets/Scripts/Network/ApiClient.cs`
- ✅ `/Assets/Scripts/Network/NetworkManager.cs`
- ✅ `/Assets/Scripts/Game/ChatManager.cs`
- ✅ `/Assets/Scripts/Game/GameManager.cs`
- ✅ `/Assets/Scripts/UI/PrivateChat/PrivateChatWindow.cs`
- ✅ `/Assets/Scripts/UI/PrivateChat/ChatMessageItem.cs`
- ✅ `/Assets/Scripts/UI/PrivateChat/AgentButton.cs`
- ✅ `/Assets/Scripts/Data/ChatMessage.cs`
- ✅ `/Assets/Scripts/Data/ConversationData.cs`
- ✅ `/Assets/Scripts/Data/AgentData.cs`

### 需要创建的资源
- ⏳ ChatMessageItem.prefab
- ⏳ AgentButton.prefab
- ⏳ Agent 头像图片（6张）
- ⏳ ApiConfig.json

### 需要配置的场景对象
- ⏳ MainCanvas
- ⏳ PrivateChatButton
- ⏳ PrivateChatWindow
- ⏳ NetworkManager GameObject
- ⏳ ChatManager GameObject

## 联系与支持

如有问题，请检查：
1. Unity Console 的错误日志
2. 浏览器开发者工具的 Network 标签
3. 后端服务器的控制台输出
