# Unity 私聊界面快速搭建脚本

本文档提供了一个自动化脚本，帮助你快速在 Unity Editor 中创建私聊界面的 UI 结构。

## 使用方法

1. 将此脚本保存为 `/Assets/Editor/PrivateChatUIBuilder.cs`
2. 在 Unity Editor 中，点击菜单 `Tools → Build Private Chat UI`
3. 脚本会自动创建所有必要的 UI 对象和预制体

## 脚本内容

```csharp
using UnityEngine;
using UnityEngine.UI;
using UnityEditor;
using System.IO;

public class PrivateChatUIBuilder : EditorWindow
{
    [MenuItem("Tools/Build Private Chat UI")]
    static void BuildUI()
    {
        // 创建 Canvas
        GameObject canvas = CreateCanvas();

        // 创建私聊按钮
        GameObject privateChatButton = CreatePrivateChatButton(canvas.transform);

        // 创建私聊窗口
        GameObject privateChatWindow = CreatePrivateChatWindow(canvas.transform);

        // 创建预制体
        CreatePrefabs();

        // 创建管理器对象
        CreateManagers();

        Debug.Log("私聊 UI 创建完成！");
    }

    static GameObject CreateCanvas()
    {
        GameObject canvas = GameObject.Find("MainCanvas");
        if (canvas == null)
        {
            canvas = new GameObject("MainCanvas");
            Canvas c = canvas.AddComponent<Canvas>();
            c.renderMode = RenderMode.ScreenSpaceOverlay;

            CanvasScaler scaler = canvas.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);

            canvas.AddComponent<GraphicRaycaster>();
        }
        return canvas;
    }

    static GameObject CreatePrivateChatButton(Transform parent)
    {
        GameObject button = new GameObject("PrivateChatButton");
        button.transform.SetParent(parent);

        RectTransform rt = button.AddComponent<RectTransform>();
        rt.anchorMin = new Vector2(1, 0);
        rt.anchorMax = new Vector2(1, 0);
        rt.pivot = new Vector2(1, 0);
        rt.anchoredPosition = new Vector2(-50, 50);
        rt.sizeDelta = new Vector2(120, 50);

        Image img = button.AddComponent<Image>();
        img.color = new Color(0.2f, 0.6f, 1f);

        Button btn = button.AddComponent<Button>();

        GameObject text = new GameObject("Text");
        text.transform.SetParent(button.transform);
        RectTransform textRt = text.AddComponent<RectTransform>();
        textRt.anchorMin = Vector2.zero;
        textRt.anchorMax = Vector2.one;
        textRt.sizeDelta = Vector2.zero;

        Text textComp = text.AddComponent<Text>();
        textComp.text = "私聊";
        textComp.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
        textComp.fontSize = 24;
        textComp.alignment = TextAnchor.MiddleCenter;
        textComp.color = Color.white;

        return button;
    }

    static GameObject CreatePrivateChatWindow(Transform parent)
    {
        GameObject window = new GameObject("PrivateChatWindow");
        window.transform.SetParent(parent);

        RectTransform rt = window.AddComponent<RectTransform>();
        rt.anchorMin = Vector2.zero;
        rt.anchorMax = Vector2.one;
        rt.sizeDelta = Vector2.zero;

        Image img = window.AddComponent<Image>();
        img.color = new Color(0, 0, 0, 0.8f);

        // 创建内容面板
        GameObject contentPanel = new GameObject("ContentPanel");
        contentPanel.transform.SetParent(window.transform);
        RectTransform contentRt = contentPanel.AddComponent<RectTransform>();
        contentRt.anchorMin = new Vector2(0.5f, 0.5f);
        contentRt.anchorMax = new Vector2(0.5f, 0.5f);
        contentRt.pivot = new Vector2(0.5f, 0.5f);
        contentRt.anchoredPosition = Vector2.zero;
        contentRt.sizeDelta = new Vector2(1200, 800);

        Image contentImg = contentPanel.AddComponent<Image>();
        contentImg.color = new Color(0.15f, 0.15f, 0.15f);

        // 创建头部
        CreateHeader(contentPanel.transform);

        // 创建 Agent 列表
        CreateAgentList(contentPanel.transform);

        // 创建消息区域
        CreateMessageArea(contentPanel.transform);

        // 创建输入区域
        CreateInputArea(contentPanel.transform);

        window.SetActive(false);
        return window;
    }

    static void CreateHeader(Transform parent)
    {
        GameObject header = new GameObject("Header");
        header.transform.SetParent(parent);

        RectTransform rt = header.AddComponent<RectTransform>();
        rt.anchorMin = new Vector2(0, 1);
        rt.anchorMax = new Vector2(1, 1);
        rt.pivot = new Vector2(0.5f, 1);
        rt.anchoredPosition = Vector2.zero;
        rt.sizeDelta = new Vector2(0, 60);

        Image img = header.AddComponent<Image>();
        img.color = new Color(0.1f, 0.1f, 0.1f);

        // Agent 名称
        GameObject agentName = new GameObject("AgentName");
        agentName.transform.SetParent(header.transform);
        RectTransform nameRt = agentName.AddComponent<RectTransform>();
        nameRt.anchorMin = new Vector2(0, 0);
        nameRt.anchorMax = new Vector2(0.8f, 1);
        nameRt.sizeDelta = Vector2.zero;

        Text nameText = agentName.AddComponent<Text>();
        nameText.text = "选择一个尚书开始对话";
        nameText.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
        nameText.fontSize = 28;
        nameText.alignment = TextAnchor.MiddleLeft;
        nameText.color = Color.white;
        nameText.rectTransform.offsetMin = new Vector2(20, 0);

        // 关闭按钮
        GameObject closeBtn = new GameObject("CloseButton");
        closeBtn.transform.SetParent(header.transform);
        RectTransform closeBtnRt = closeBtn.AddComponent<RectTransform>();
        closeBtnRt.anchorMin = new Vector2(1, 0.5f);
        closeBtnRt.anchorMax = new Vector2(1, 0.5f);
        closeBtnRt.pivot = new Vector2(1, 0.5f);
        closeBtnRt.anchoredPosition = new Vector2(-10, 0);
        closeBtnRt.sizeDelta = new Vector2(40, 40);

        Image closeBtnImg = closeBtn.AddComponent<Image>();
        closeBtnImg.color = new Color(0.8f, 0.2f, 0.2f);

        Button closeBtnComp = closeBtn.AddComponent<Button>();

        GameObject closeBtnText = new GameObject("Text");
        closeBtnText.transform.SetParent(closeBtn.transform);
        RectTransform closeBtnTextRt = closeBtnText.AddComponent<RectTransform>();
        closeBtnTextRt.anchorMin = Vector2.zero;
        closeBtnTextRt.anchorMax = Vector2.one;
        closeBtnTextRt.sizeDelta = Vector2.zero;

        Text closeBtnTextComp = closeBtnText.AddComponent<Text>();
        closeBtnTextComp.text = "×";
        closeBtnTextComp.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
        closeBtnTextComp.fontSize = 32;
        closeBtnTextComp.alignment = TextAnchor.MiddleCenter;
        closeBtnTextComp.color = Color.white;
    }

    static void CreateAgentList(Transform parent)
    {
        GameObject agentList = new GameObject("AgentList");
        agentList.transform.SetParent(parent);

        RectTransform rt = agentList.AddComponent<RectTransform>();
        rt.anchorMin = new Vector2(0, 0);
        rt.anchorMax = new Vector2(0.25f, 1);
        rt.pivot = new Vector2(0, 1);
        rt.anchoredPosition = new Vector2(0, -60);
        rt.sizeDelta = new Vector2(0, -60);

        Image img = agentList.AddComponent<Image>();
        img.color = new Color(0.12f, 0.12f, 0.12f);

        // 创建滚动视图
        GameObject scrollView = new GameObject("ScrollView");
        scrollView.transform.SetParent(agentList.transform);
        RectTransform scrollRt = scrollView.AddComponent<RectTransform>();
        scrollRt.anchorMin = Vector2.zero;
        scrollRt.anchorMax = Vector2.one;
        scrollRt.sizeDelta = Vector2.zero;

        ScrollRect scrollRect = scrollView.AddComponent<ScrollRect>();
        scrollRect.horizontal = false;
        scrollRect.vertical = true;

        // Viewport
        GameObject viewport = new GameObject("Viewport");
        viewport.transform.SetParent(scrollView.transform);
        RectTransform viewportRt = viewport.AddComponent<RectTransform>();
        viewportRt.anchorMin = Vector2.zero;
        viewportRt.anchorMax = Vector2.one;
        viewportRt.sizeDelta = Vector2.zero;
        viewport.AddComponent<Mask>();
        viewport.AddComponent<Image>();

        // Content
        GameObject content = new GameObject("AgentListContent");
        content.transform.SetParent(viewport.transform);
        RectTransform contentRt = content.AddComponent<RectTransform>();
        contentRt.anchorMin = new Vector2(0, 1);
        contentRt.anchorMax = new Vector2(1, 1);
        contentRt.pivot = new Vector2(0.5f, 1);
        contentRt.anchoredPosition = Vector2.zero;
        contentRt.sizeDelta = new Vector2(0, 0);

        VerticalLayoutGroup vlg = content.AddComponent<VerticalLayoutGroup>();
        vlg.spacing = 10;
        vlg.padding = new RectOffset(10, 10, 10, 10);
        vlg.childControlHeight = false;
        vlg.childControlWidth = true;
        vlg.childForceExpandHeight = false;
        vlg.childForceExpandWidth = true;

        ContentSizeFitter csf = content.AddComponent<ContentSizeFitter>();
        csf.verticalFit = ContentSizeFitter.FitMode.PreferredSize;

        scrollRect.viewport = viewportRt;
        scrollRect.content = contentRt;
    }

    static void CreateMessageArea(Transform parent)
    {
        GameObject messageArea = new GameObject("MessageArea");
        messageArea.transform.SetParent(parent);

        RectTransform rt = messageArea.AddComponent<RectTransform>();
        rt.anchorMin = new Vector2(0.25f, 0.15f);
        rt.anchorMax = new Vector2(1, 1);
        rt.pivot = new Vector2(0.5f, 1);
        rt.anchoredPosition = new Vector2(0, -60);
        rt.sizeDelta = new Vector2(-10, -60);

        Image img = messageArea.AddComponent<Image>();
        img.color = new Color(0.18f, 0.18f, 0.18f);

        // 创建滚动视图
        GameObject scrollView = new GameObject("ScrollView");
        scrollView.transform.SetParent(messageArea.transform);
        RectTransform scrollRt = scrollView.AddComponent<RectTransform>();
        scrollRt.anchorMin = Vector2.zero;
        scrollRt.anchorMax = Vector2.one;
        scrollRt.sizeDelta = new Vector2(-10, -10);
        scrollRt.anchoredPosition = Vector2.zero;

        ScrollRect scrollRect = scrollView.AddComponent<ScrollRect>();
        scrollRect.horizontal = false;
        scrollRect.vertical = true;

        // Viewport
        GameObject viewport = new GameObject("Viewport");
        viewport.transform.SetParent(scrollView.transform);
        RectTransform viewportRt = viewport.AddComponent<RectTransform>();
        viewportRt.anchorMin = Vector2.zero;
        viewportRt.anchorMax = Vector2.one;
        viewportRt.sizeDelta = Vector2.zero;
        viewport.AddComponent<Mask>();
        viewport.AddComponent<Image>();

        // Content
        GameObject content = new GameObject("MessageListContent");
        content.transform.SetParent(viewport.transform);
        RectTransform contentRt = content.AddComponent<RectTransform>();
        contentRt.anchorMin = new Vector2(0, 1);
        contentRt.anchorMax = new Vector2(1, 1);
        contentRt.pivot = new Vector2(0.5f, 1);
        contentRt.anchoredPosition = Vector2.zero;
        contentRt.sizeDelta = new Vector2(0, 0);

        VerticalLayoutGroup vlg = content.AddComponent<VerticalLayoutGroup>();
        vlg.spacing = 10;
        vlg.padding = new RectOffset(10, 10, 10, 10);
        vlg.childControlHeight = false;
        vlg.childControlWidth = true;
        vlg.childForceExpandHeight = false;
        vlg.childForceExpandWidth = true;

        ContentSizeFitter csf = content.AddComponent<ContentSizeFitter>();
        csf.verticalFit = ContentSizeFitter.FitMode.PreferredSize;

        scrollRect.viewport = viewportRt;
        scrollRect.content = contentRt;
    }

    static void CreateInputArea(Transform parent)
    {
        GameObject inputArea = new GameObject("InputArea");
        inputArea.transform.SetParent(parent);

        RectTransform rt = inputArea.AddComponent<RectTransform>();
        rt.anchorMin = new Vector2(0.25f, 0);
        rt.anchorMax = new Vector2(1, 0.15f);
        rt.pivot = new Vector2(0.5f, 0);
        rt.anchoredPosition = Vector2.zero;
        rt.sizeDelta = new Vector2(-10, 0);

        Image img = inputArea.AddComponent<Image>();
        img.color = new Color(0.15f, 0.15f, 0.15f);

        // 输入框
        GameObject inputField = new GameObject("MessageInput");
        inputField.transform.SetParent(inputArea.transform);
        RectTransform inputRt = inputField.AddComponent<RectTransform>();
        inputRt.anchorMin = new Vector2(0, 0);
        inputRt.anchorMax = new Vector2(0.8f, 1);
        inputRt.sizeDelta = new Vector2(-10, -20);
        inputRt.anchoredPosition = new Vector2(5, 0);

        Image inputImg = inputField.AddComponent<Image>();
        inputImg.color = Color.white;

        InputField input = inputField.AddComponent<InputField>();

        GameObject placeholder = new GameObject("Placeholder");
        placeholder.transform.SetParent(inputField.transform);
        RectTransform placeholderRt = placeholder.AddComponent<RectTransform>();
        placeholderRt.anchorMin = Vector2.zero;
        placeholderRt.anchorMax = Vector2.one;
        placeholderRt.sizeDelta = new Vector2(-10, 0);

        Text placeholderText = placeholder.AddComponent<Text>();
        placeholderText.text = "输入消息...";
        placeholderText.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
        placeholderText.fontSize = 20;
        placeholderText.color = new Color(0.5f, 0.5f, 0.5f);

        GameObject textObj = new GameObject("Text");
        textObj.transform.SetParent(inputField.transform);
        RectTransform textRt = textObj.AddComponent<RectTransform>();
        textRt.anchorMin = Vector2.zero;
        textRt.anchorMax = Vector2.one;
        textRt.sizeDelta = new Vector2(-10, 0);

        Text text = textObj.AddComponent<Text>();
        text.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
        text.fontSize = 20;
        text.color = Color.black;
        text.supportRichText = false;

        input.textComponent = text;
        input.placeholder = placeholderText;

        // 发送按钮
        GameObject sendBtn = new GameObject("SendButton");
        sendBtn.transform.SetParent(inputArea.transform);
        RectTransform sendBtnRt = sendBtn.AddComponent<RectTransform>();
        sendBtnRt.anchorMin = new Vector2(0.82f, 0);
        sendBtnRt.anchorMax = new Vector2(1, 1);
        sendBtnRt.sizeDelta = new Vector2(-10, -20);
        sendBtnRt.anchoredPosition = new Vector2(-5, 0);

        Image sendBtnImg = sendBtn.AddComponent<Image>();
        sendBtnImg.color = new Color(0.2f, 0.6f, 1f);

        Button sendBtnComp = sendBtn.AddComponent<Button>();

        GameObject sendBtnText = new GameObject("Text");
        sendBtnText.transform.SetParent(sendBtn.transform);
        RectTransform sendBtnTextRt = sendBtnText.AddComponent<RectTransform>();
        sendBtnTextRt.anchorMin = Vector2.zero;
        sendBtnTextRt.anchorMax = Vector2.one;
        sendBtnTextRt.sizeDelta = Vector2.zero;

        Text sendBtnTextComp = sendBtnText.AddComponent<Text>();
        sendBtnTextComp.text = "发送";
        sendBtnTextComp.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
        sendBtnTextComp.fontSize = 24;
        sendBtnTextComp.alignment = TextAnchor.MiddleCenter;
        sendBtnTextComp.color = Color.white;
    }

    static void CreatePrefabs()
    {
        string prefabPath = "Assets/Prefabs/UI";
        if (!Directory.Exists(prefabPath))
        {
            Directory.CreateDirectory(prefabPath);
        }

        // 创建 ChatMessageItem 预制体
        CreateChatMessageItemPrefab(prefabPath);

        // 创建 AgentButton 预制体
        CreateAgentButtonPrefab(prefabPath);

        AssetDatabase.Refresh();
    }

    static void CreateChatMessageItemPrefab(string path)
    {
        GameObject item = new GameObject("ChatMessageItem");
        RectTransform rt = item.AddComponent<RectTransform>();
        rt.sizeDelta = new Vector2(0, 80);

        // Player Container
        GameObject playerContainer = new GameObject("PlayerContainer");
        playerContainer.transform.SetParent(item.transform);
        RectTransform playerRt = playerContainer.AddComponent<RectTransform>();
        playerRt.anchorMin = Vector2.zero;
        playerRt.anchorMax = Vector2.one;
        playerRt.sizeDelta = Vector2.zero;

        // Agent Container
        GameObject agentContainer = new GameObject("AgentContainer");
        agentContainer.transform.SetParent(item.transform);
        RectTransform agentRt = agentContainer.AddComponent<RectTransform>();
        agentRt.anchorMin = Vector2.zero;
        agentRt.anchorMax = Vector2.one;
        agentRt.sizeDelta = Vector2.zero;

        // 添加文本组件（简化版）
        CreateMessageText(playerContainer.transform, "PlayerMessage");
        CreateMessageText(agentContainer.transform, "AgentMessage");

        PrefabUtility.SaveAsPrefabAsset(item, path + "/ChatMessageItem.prefab");
        Object.DestroyImmediate(item);
    }

    static void CreateMessageText(Transform parent, string name)
    {
        GameObject textObj = new GameObject(name);
        textObj.transform.SetParent(parent);
        RectTransform rt = textObj.AddComponent<RectTransform>();
        rt.anchorMin = Vector2.zero;
        rt.anchorMax = Vector2.one;
        rt.sizeDelta = new Vector2(-20, -20);

        Text text = textObj.AddComponent<Text>();
        text.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
        text.fontSize = 18;
        text.color = Color.white;
        text.alignment = TextAnchor.MiddleLeft;
    }

    static void CreateAgentButtonPrefab(string path)
    {
        GameObject button = new GameObject("AgentButton");
        RectTransform rt = button.AddComponent<RectTransform>();
        rt.sizeDelta = new Vector2(0, 80);

        Image img = button.AddComponent<Image>();
        img.color = new Color(0.2f, 0.2f, 0.2f);

        Button btn = button.AddComponent<Button>();

        GameObject nameText = new GameObject("Name");
        nameText.transform.SetParent(button.transform);
        RectTransform nameRt = nameText.AddComponent<RectTransform>();
        nameRt.anchorMin = Vector2.zero;
        nameRt.anchorMax = Vector2.one;
        nameRt.sizeDelta = Vector2.zero;

        Text text = nameText.AddComponent<Text>();
        text.text = "Agent Name";
        text.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
        text.fontSize = 22;
        text.alignment = TextAnchor.MiddleCenter;
        text.color = Color.white;

        PrefabUtility.SaveAsPrefabAsset(button, path + "/AgentButton.prefab");
        Object.DestroyImmediate(button);
    }

    static void CreateManagers()
    {
        // NetworkManager
        GameObject networkManager = GameObject.Find("NetworkManager");
        if (networkManager == null)
        {
            networkManager = new GameObject("NetworkManager");
            // 需要手动添加 NetworkManager 脚本
        }

        // ChatManager
        GameObject chatManager = GameObject.Find("ChatManager");
        if (chatManager == null)
        {
            chatManager = new GameObject("ChatManager");
            // 需要手动添加 ChatManager 脚本
        }
    }
}
```

## 手动配置步骤

脚本创建完 UI 后，还需要手动完成以下配置：

### 1. 添加脚本组件

在创建的 GameObject 上添加对应的脚本：

- `PrivateChatWindow` → 添加 `PrivateChatWindow.cs`
- `AgentList` → 添加 `AgentListManager.cs`
- `NetworkManager` → 添加 `NetworkManager.cs`
- `ChatManager` → 添加 `ChatManager.cs`

### 2. 连接引用

在 `PrivateChatWindow` 组件中连接：
- Chat Window → PrivateChatWindow (自身)
- Agent Name Text → Header/AgentName
- Message List → MessageArea/ScrollView/Viewport/MessageListContent
- Message Input → InputArea/MessageInput
- Send Button → InputArea/SendButton
- Message Item Prefab → Prefabs/UI/ChatMessageItem

在 `AgentListManager` 组件中连接：
- Agent Button Prefab → Prefabs/UI/AgentButton
- Agent List Content → AgentList/ScrollView/Viewport/AgentListContent
- Chat Window → PrivateChatWindow

### 3. 配置按钮事件

- `PrivateChatButton` → OnClick → PrivateChatWindow.SetActive(true)
- `CloseButton` → OnClick → PrivateChatWindow.SetActive(false)

完成后即可测试私聊功能！
