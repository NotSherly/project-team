using MonarchSim.AI.Sessions;
using MonarchSim.Domain.Enums;

namespace MonarchSim.Application.UseCases
{
    /// <summary>
    /// 召见某部用例
    /// </summary>
    public sealed class SummonDepartmentUseCase
    {
        private readonly DepartmentSessionManager _manager;

        public SummonDepartmentUseCase(DepartmentSessionManager manager)
        {
            _manager = manager;
        }

        /// <summary>
        /// 召见
        /// </summary>
        /// <param name="departmentId"></param>
        /// <returns></returns>
        public string Execute(DepartmentId departmentId)
        {
            return _manager.OpenAudience(departmentId);
        }
    }
}
