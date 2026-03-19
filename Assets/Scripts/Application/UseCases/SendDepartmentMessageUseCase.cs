using System.Threading.Tasks;
using MonarchSim.AI.Models;
using MonarchSim.AI.Sessions;
using MonarchSim.Domain.Enums;

namespace MonarchSim.Application.UseCases
{
    /// <summary>
    /// 向某部提问用例
    /// </summary>
    public sealed class SendDepartmentMessageUseCase
    {
        private readonly DepartmentSessionManager _manager;

        public SendDepartmentMessageUseCase(DepartmentSessionManager manager)
        {
            _manager = manager;
        }

        /// <summary>
        /// 提问
        /// </summary>
        /// <param name="departmentId"></param>
        /// <param name="playerMessage"></param>
        /// <returns></returns>
        public Task<DepartmentDialogueResponse> ExecuteAsync(DepartmentId departmentId, string playerMessage)
        {
            return _manager.SendMessageAsync(departmentId, playerMessage);
        }
    }
}
