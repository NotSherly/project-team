using System;
using System.Collections.Generic;

namespace MonarchSim.Core
{
    /// <summary>
    /// 事件总线
    /// </summary>
    public sealed class EventBus
    {
        private readonly Dictionary<Type, Delegate> _handlers = new Dictionary<Type, Delegate>(); // 事件订阅表，事件类型-处理函数 键值对的字典

        /// <summary>
        /// 订阅事件，注册一个“当T类型事件发生时要执行的处理函数”
        /// </summary>
        /// <typeparam name="T">事件类型</typeparam>
        /// <param name="handler">处理函数</param>
        public void Subscribe<T>(Action<T> handler)
        {
            var key = typeof(T);
            if (_handlers.TryGetValue(key, out var existing))
            {
                _handlers[key] = Delegate.Combine(existing, handler);
            }
            else
            {
                _handlers[key] = handler;
            }
        }

        /// <summary>
        /// 取消订阅，把某个处理函数从某个事件类型的监听列表里移除
        /// </summary>
        /// <typeparam name="T">事件类型</typeparam>
        /// <param name="handler">处理函数</param>
        public void Unsubscribe<T>(Action<T> handler)
        {
            var key = typeof(T);
            if (!_handlers.TryGetValue(key, out var existing))
            {
                return;
            }

            var updated = Delegate.Remove(existing, handler);
            if (updated == null)
            {
                _handlers.Remove(key);
            }
            else
            {
                _handlers[key] = updated;
            }
        }

        /// <summary>
        /// 发布事件，通知所有订阅T事件的部分：T事件发生
        /// </summary>
        /// <typeparam name="T">事件类型</typeparam>
        /// <param name="evt">具体事件对象</param>
        public void Publish<T>(T evt)
        {
            var key = typeof(T);
            if (_handlers.TryGetValue(key, out var existing))
            {
                (existing as Action<T>)?.Invoke(evt);
            }
        }
    }
}
