import { useCallback, useMemo, useState } from 'react';
import { ToastContext } from './toastCore';

export const ToastProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  const remove = useCallback((id) => {
    setMessages((prev) => prev.filter((message) => message.id !== id));
  }, []);

  const show = useCallback(
    (text, type = 'info', timeout = 4000) => {
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);
      setMessages((prev) => [...prev, { id, text, type }]);
      if (timeout) {
        window.setTimeout(() => remove(id), timeout);
      }
    },
    [remove]
  );

  const contextValue = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        style={{
          position: 'fixed',
          right: 16,
          top: 16,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              background: message.type === 'error' ? '#fee2e2' : '#d1fae5',
              color: '#111827',
              border: '1px solid #fecaca',
              padding: '10px 14px',
              borderRadius: 8,
              minWidth: 240,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            {message.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
