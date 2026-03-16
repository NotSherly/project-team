using UnityEngine;
using System.Collections;
using System.IO;
using System.Text;

namespace TXAI.Game.Network
{
    public class ApiClient
    {
        private string baseUrl;
        private int timeout;
        
        public ApiClient(string baseUrl, int timeout = 30000)
        {
            this.baseUrl = baseUrl;
            this.timeout = timeout;
        }
        
        public IEnumerator SendPrivateMessage(string agentId, string message, System.Action<string> onSuccess, System.Action<string> onError)
        {
            string endpoint = "/chat/private";
            string url = baseUrl + endpoint;
            
            WWWForm form = new WWWForm();
            form.AddField("agentId", agentId);
            form.AddField("message", message);
            
            using (UnityEngine.Networking.UnityWebRequest request = UnityEngine.Networking.UnityWebRequest.Post(url, form))
            {
                request.timeout = timeout;
                
                yield return request.SendWebRequest();
                
                if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                {
                    onSuccess?.Invoke(request.downloadHandler.text);
                }
                else
                {
                    onError?.Invoke(request.error);
                }
            }
        }
        
        public IEnumerator GetChatHistory(string agentId, System.Action<string> onSuccess, System.Action<string> onError)
        {
            string endpoint = $"/chat/history?agentId={agentId}";
            string url = baseUrl + endpoint;
            
            using (UnityEngine.Networking.UnityWebRequest request = UnityEngine.Networking.UnityWebRequest.Get(url))
            {
                request.timeout = timeout;
                
                yield return request.SendWebRequest();
                
                if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                {
                    onSuccess?.Invoke(request.downloadHandler.text);
                }
                else
                {
                    onError?.Invoke(request.error);
                }
            }
        }
        
        public IEnumerator GetAgents(System.Action<string> onSuccess, System.Action<string> onError)
        {
            string endpoint = "/agents";
            string url = baseUrl + endpoint;
            
            using (UnityEngine.Networking.UnityWebRequest request = UnityEngine.Networking.UnityWebRequest.Get(url))
            {
                request.timeout = timeout;
                
                yield return request.SendWebRequest();
                
                if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                {
                    onSuccess?.Invoke(request.downloadHandler.text);
                }
                else
                {
                    onError?.Invoke(request.error);
                }
            }
        }
    }
}
