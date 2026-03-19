using System;

namespace MonarchSim.Data.Json
{
    [Serializable]
    public sealed class RemoteAIConfig
    {
        public bool UseRemoteDepartmentAI = false;
        public string BaseUrl = "http://localhost:3000";
        public float TimeoutSeconds = 15f;

        // demo 当前没有回合总结接口，建议先保留本地 MockSummary
        public bool UseRemoteSummaryAI = false;
    }
}
