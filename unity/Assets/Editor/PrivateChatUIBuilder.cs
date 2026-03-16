using UnityEngine;
using UnityEngine.UI;
#if UNITY_EDITOR
using UnityEditor;
#endif

namespace TXAI.Game.Editor
{
    #if UNITY_EDITOR
    /// <summary>
    /// Unity Editor 工具：自动创建私聊 UI 界面
    /// 使用方法：在 Unity Editor 菜单栏选择 Tools → Build Private Chat UI
    /// </summary>
    public class PrivateChatUIBuilder : EditorWindow
    {
        [MenuItem("Tools/Build Private Chat UI")]
        static void BuildUI()
        {
            if (EditorUtility.DisplayDialog("创建私聊 UI",
                "这将在当前场景中创建完整的私聊 UI 结构。\n\n确定要继续吗？",
                "确定", "取消"))
            {
                CreatePrivateChatUI();
                EditorUtility.DisplayDialog("完成", "私聊 UI 创建完成！\n\n请查看 Hierarchy 中的 MainCanvas。", "确定");
            }
        }

        static void CreatePrivateChatUI()
        {
            // 1. 创建或获取 Canvas
            GameObject canvas = GetOrCreateCanvas();

            // 2. 创建私聊按钮
            GameObject privateChatButton = CreatePrivateChatButton(canvas.transform);

            // 3. 创建私聊窗口
            GameObject privateChatWindow = CreatePrivateChatWindow(canvas.transform);

            // 4. 创建管理器对象
            CreateManagers();

            // 5. 创建预制体文件夹
            CreatePrefabFolders();

            Debug.Log("✅ 私聊 UI 创建完成！");
            Debug.Log("📝 下一步：请按照 UNITY_PRIVATE_CHAT_SETUP.md 文档完成预制体创建和引用连接。");
        }

        static GameObject GetOrCreateCanvas()
        {
            Canvas canvas = FindObjectOfType<Canvas>();
            if (canvas != null)
            {
                Debug.Log("✅ 使用现有 Canvas: " + canvas.gameObject.name);
                return canvas.gameObject;
            }

            GameObject canvasObj = new GameObject("MainCanvas");
            Canvas c = canvasObj.AddComponent<Canvas>();
            c.renderMode = RenderMode.ScreenSpaceOverlay;

            CanvasScaler scaler = canvasObj.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;

            canvasObj.AddComponent<GraphicRaycaster>();

            Debug.Log("✅ 创建新 Canvas: MainCanvas");
            return canvasObj;
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
            rt.sizeDelta = new Vector2(150, 60);

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
            textComp.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            textComp.fontSize = 28;
            textComp.alignment = TextAnchor.MiddleCenter;
            textComp.color = Color.white;

            Debug.Log("✅ 创建私聊按钮");
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
            img.color = new Color(0, 0, 0, 0.85f);

            // 创建内容面板
            GameObject contentPanel = CreateContentPanel(window.transform);

            // 创建头部
            GameObject header = CreateHeader(contentPanel.transform);

            // 创建 Agent 列表
            GameObject agentList = CreateAgentList(contentPanel.transform);

            // 创建消息区域
            GameObject messageArea = CreateMessageArea(contentPanel.transform);

            // 创建输入区域
            GameObject inputArea = CreateInputArea(contentPanel.transform);

            window.SetActive(false);
            Debug.Log("✅ 创建私聊窗口");
            return window;
        }

        static GameObject CreateContentPanel(Transform parent)
        {
            GameObject contentPanel = new GameObject("ContentPanel");
            contentPanel.transform.SetParent(parent);
            RectTransform contentRt = contentPanel.AddComponent<RectTransform>();
            contentRt.anchorMin = new Vector2(0.5f, 0.5f);
            contentRt.anchorMax = new Vector2(0.5f, 0.5f);
            contentRt.pivot = new Vector2(0.5f, 0.5f);
            contentRt.anchoredPosition = Vector2.zero;
            contentRt.sizeDelta = new Vector2(1400, 900);

            Image contentImg = contentPanel.AddComponent<Image>();
            contentImg.color = new Color(0.15f, 0.15f, 0.15f);

            return contentPanel;
        }

        static GameObject CreateHeader(Transform parent)
        {
            GameObject header = new GameObject("Header");
            header.transform.SetParent(parent);

            RectTransform rt = header.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0, 1);
            rt.anchorMax = new Vector2(1, 1);
            rt.pivot = new Vector2(0.5f, 1);
            rt.anchoredPosition = Vector2.zero;
            rt.sizeDelta = new Vector2(0, 70);

            Image img = header.AddComponent<Image>();
            img.color = new Color(0.1f, 0.1f, 0.1f);

            // Agent 名称
            GameObject agentName = new GameObject("AgentName");
            agentName.transform.SetParent(header.transform);
            RectTransform nameRt = agentName.AddComponent<RectTransform>();
            nameRt.anchorMin = new Vector2(0, 0);
            nameRt.anchorMax = new Vector2(0.85f, 1);
            nameRt.sizeDelta = Vector2.zero;
            nameRt.offsetMin = new Vector2(20, 0);

            Text nameText = agentName.AddComponent<Text>();
            nameText.text = "选择一个尚书开始对话";
            nameText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            nameText.fontSize = 32;
            nameText.alignment = TextAnchor.MiddleLeft;
            nameText.color = Color.white;

            // 关闭按钮
            GameObject closeBtn = new GameObject("CloseButton");
            closeBtn.transform.SetParent(header.transform);
            RectTransform closeBtnRt = closeBtn.AddComponent<RectTransform>();
            closeBtnRt.anchorMin = new Vector2(1, 0.5f);
            closeBtnRt.anchorMax = new Vector2(1, 0.5f);
            closeBtnRt.pivot = new Vector2(1, 0.5f);
            closeBtnRt.anchoredPosition = new Vector2(-15, 0);
            closeBtnRt.sizeDelta = new Vector2(50, 50);

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
            closeBtnTextComp.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            closeBtnTextComp.fontSize = 40;
            closeBtnTextComp.alignment = TextAnchor.MiddleCenter;
            closeBtnTextComp.color = Color.white;

            return header;
        }

        static GameObject CreateAgentList(Transform parent)
        {
            GameObject agentList = new GameObject("AgentList");
            agentList.transform.SetParent(parent);

            RectTransform rt = agentList.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0, 0);
            rt.anchorMax = new Vector2(0.25f, 1);
            rt.pivot = new Vector2(0, 1);
            rt.anchoredPosition = new Vector2(0, -70);
            rt.sizeDelta = new Vector2(0, -70);

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
            Image viewportImg = viewport.AddComponent<Image>();
            viewportImg.color = Color.clear;

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

            return agentList;
        }

        static GameObject CreateMessageArea(Transform parent)
        {
            GameObject messageArea = new GameObject("MessageArea");
            messageArea.transform.SetParent(parent);

            RectTransform rt = messageArea.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.26f, 0.15f);
            rt.anchorMax = new Vector2(1, 1);
            rt.pivot = new Vector2(0.5f, 1);
            rt.anchoredPosition = new Vector2(0, -70);
            rt.sizeDelta = new Vector2(-10, -70);

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
            Image viewportImg = viewport.AddComponent<Image>();
            viewportImg.color = Color.clear;

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
            vlg.spacing = 15;
            vlg.padding = new RectOffset(15, 15, 15, 15);
            vlg.childControlHeight = false;
            vlg.childControlWidth = true;
            vlg.childForceExpandHeight = false;
            vlg.childForceExpandWidth = true;

            ContentSizeFitter csf = content.AddComponent<ContentSizeFitter>();
            csf.verticalFit = ContentSizeFitter.FitMode.PreferredSize;

            scrollRect.viewport = viewportRt;
            scrollRect.content = contentRt;

            return messageArea;
        }

        static GameObject CreateInputArea(Transform parent)
        {
            GameObject inputArea = new GameObject("InputArea");
            inputArea.transform.SetParent(parent);

            RectTransform rt = inputArea.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.26f, 0);
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
            inputRt.anchorMax = new Vector2(0.78f, 1);
            inputRt.sizeDelta = new Vector2(-15, -25);
            inputRt.anchoredPosition = new Vector2(10, 0);

            Image inputImg = inputField.AddComponent<Image>();
            inputImg.color = Color.white;

            InputField input = inputField.AddComponent<InputField>();

            GameObject placeholder = new GameObject("Placeholder");
            placeholder.transform.SetParent(inputField.transform);
            RectTransform placeholderRt = placeholder.AddComponent<RectTransform>();
            placeholderRt.anchorMin = Vector2.zero;
            placeholderRt.anchorMax = Vector2.one;
            placeholderRt.sizeDelta = new Vector2(-15, 0);

            Text placeholderText = placeholder.AddComponent<Text>();
            placeholderText.text = "输入消息...";
            placeholderText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            placeholderText.fontSize = 24;
            placeholderText.color = new Color(0.5f, 0.5f, 0.5f);

            GameObject textObj = new GameObject("Text");
            textObj.transform.SetParent(inputField.transform);
            RectTransform textRt = textObj.AddComponent<RectTransform>();
            textRt.anchorMin = Vector2.zero;
            textRt.anchorMax = Vector2.one;
            textRt.sizeDelta = new Vector2(-15, 0);

            Text text = textObj.AddComponent<Text>();
            text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            text.fontSize = 24;
            text.color = Color.black;
            text.supportRichText = false;

            input.textComponent = text;
            input.placeholder = placeholderText;

            // 发送按钮
            GameObject sendBtn = new GameObject("SendButton");
            sendBtn.transform.SetParent(inputArea.transform);
            RectTransform sendBtnRt = sendBtn.AddComponent<RectTransform>();
            sendBtnRt.anchorMin = new Vector2(0.8f, 0);
            sendBtnRt.anchorMax = new Vector2(1, 1);
            sendBtnRt.sizeDelta = new Vector2(-15, -25);
            sendBtnRt.anchoredPosition = new Vector2(-10, 0);

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
            sendBtnTextComp.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            sendBtnTextComp.fontSize = 28;
            sendBtnTextComp.alignment = TextAnchor.MiddleCenter;
            sendBtnTextComp.color = Color.white;

            return inputArea;
        }

        static void CreateManagers()
        {
            // NetworkManager
            GameObject networkManager = GameObject.Find("NetworkManager");
            if (networkManager == null)
            {
                networkManager = new GameObject("NetworkManager");
                Debug.Log("✅ 创建 NetworkManager（请手动添加 NetworkManager.cs 脚本）");
            }

            // ChatManager
            GameObject chatManager = GameObject.Find("ChatManager");
            if (chatManager == null)
            {
                chatManager = new GameObject("ChatManager");
                Debug.Log("✅ 创建 ChatManager（请手动添加 ChatManager.cs 脚本）");
            }
        }

        static void CreatePrefabFolders()
        {
            string[] folders = new string[]
            {
                "Assets/Prefabs",
                "Assets/Prefabs/UI",
                "Assets/Resources/AgentAvatars"
            };

            foreach (string folder in folders)
            {
                if (!AssetDatabase.IsValidFolder(folder))
                {
                    string parentFolder = System.IO.Path.GetDirectoryName(folder).Replace("\\", "/");
                    string newFolder = System.IO.Path.GetFileName(folder);
                    AssetDatabase.CreateFolder(parentFolder, newFolder);
                    Debug.Log("✅ 创建文件夹: " + folder);
                }
            }

            AssetDatabase.Refresh();
        }
    }
    #endif
}
