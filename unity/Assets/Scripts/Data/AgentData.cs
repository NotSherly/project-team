using System;

namespace TXAI.Game.Data
{
    [Serializable]
    public class AgentData
    {
        public string id;
        public string name;
        public string avatarPath;
        public string department;
        
        public AgentData(string id, string name, string avatarPath, string department)
        {
            this.id = id;
            this.name = name;
            this.avatarPath = avatarPath;
            this.department = department;
        }
    }
}
