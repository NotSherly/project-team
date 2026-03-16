# 天命：AI君主模拟器 - Unity前端

## 项目结构

```
unity/
├── Assets/
│   ├── Scripts/                      # 脚本目录
│   │   ├── Network/                  # 网络通信
│   │   │   ├── ApiClient.cs          # HTTP请求封装
│   │   │   └── NetworkManager.cs     # 网络管理
│   │   ├── Data/                     # 数据模型
│   │   │   ├── ChatMessage.cs        # 聊天消息
│   │   │   ├── AgentData.cs          # Agent信息
│   │   │   └── ConversationData.cs   # 对话历史
│   │   ├── UI/                       # UI相关
│   │   │   ├── PrivateChat/          # 私聊相关
│   │   │   │   ├── PrivateChatWindow.cs  # 私聊窗口
│   │   │   │   ├── ChatMessageItem.cs    # 消息项
│   │   │   │   └── AgentButton.cs        # Agent按钮
│   │   │   └── Common/               # 通用UI组件
│   │   └── Game/                     # 游戏逻辑
│   │       ├── GameManager.cs        # 游戏主管理器
│   │       └── ChatManager.cs        # 聊天系统管理器
│   ├── Prefabs/                      # 预制体
│   │   ├── UI/                       # UI预制体
│   │   └── Agent/                    # Agent相关预制体
│   ├── Resources/                    # 资源文件
│   │   ├── AgentAvatars/             # Agent头像
│   │   └── Configs/                  # 配置文件
│   │       └── ApiConfig.json        # API配置
│   └── Scenes/                       # 场景
│       └── MainScene.unity           # 主场景
├── Packages/                          # 包管理
└── ProjectSettings/                   # 项目设置
```

## 功能说明

### 1. 私聊系统
- 点击Agent按钮打开私聊对话框
- 支持消息发送与接收
- 对接后端Agent私聊接口
- 显示聊天历史记录

### 2. 网络通信
- 基于UnityWebRequest实现HTTP请求
- 封装API客户端，简化网络调用
- 支持错误处理和超时机制

### 3. 数据管理
- 统一管理聊天会话
- 缓存Agent信息
- 处理消息历史

## 运行步骤

### 1. 启动后端服务器
```bash
# 在project-team/demo目录下运行
cd project-team/demo
node server.js
```

### 2. 打开Unity项目
- 使用Unity 2022.3或更高版本打开unity目录
- 导入必要的依赖包

### 3. 配置API地址
- 编辑 `Assets/Resources/Configs/ApiConfig.json` 文件
- 确保baseUrl设置为后端服务器地址（默认：http://localhost:3000/api）

### 4. 运行场景
- 打开 `Assets/Scenes/MainScene.unity`
- 点击运行按钮启动游戏

## 技术栈

- **Unity 2022.3**：游戏引擎
- **C#**：脚本语言
- **UGUI**：UI系统
- **UnityWebRequest**：网络请求
- **JSON**：数据序列化

## 扩展建议

1. **添加消息通知系统**：当收到新消息时显示通知
2. **实现消息加密**：增强通信安全性
3. **添加消息类型**：支持文本、表情、图片等多种消息类型
4. **实现消息缓存**：本地缓存聊天历史，减少网络请求
5. **添加多语言支持**：支持不同语言的界面

## 注意事项

- 确保后端服务器已启动且运行正常
- 检查网络连接，确保Unity可以访问后端API
- 首次运行时，Agent头像可能会显示默认图片，需要添加对应的头像资源
- 后端API的响应时间可能会受到网络和AI模型的影响，请耐心等待
