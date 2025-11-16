import React, { useEffect, useState } from 'react';
import ws from '../ws';
import '../App.css';

export default function QueueDisplay() {
  const [snapshot, setSnapshot] = useState({ total: 0, next: null, queue: [] });

  useEffect(() => {
    const onMessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'queue_update') {
          setSnapshot({
            total: data.total ?? 0,
            next: data.next ?? null,
            queue: Array.isArray(data.queue) ? data.queue : [],
          });
        }
      } catch (e) {
        // ignore non-JSON or other messages
      }
    };
    ws.addEventListener('message', onMessage);
    return () => ws.removeEventListener('message', onMessage);
  }, []);

  return (
    <div className="queue-panel">
      <header className="queue-header">
        <h2>Clinic Queue</h2>
        <div className="queue-total">Total: {snapshot.total}</div>
      </header>

      <section className="queue-next">
        <h3>Now Serving</h3>
        {snapshot.next ? (
          <div className="next-card">
            <div className="big-number">{snapshot.next.queueNumber}</div>
            <div className="meta">
              <div>Patient: {snapshot.next.patientName ?? snapshot.next.patientId ?? '—'}</div>
              <div>Doctor: {snapshot.next.doctorName ?? snapshot.next.doctorId ?? '—'}</div>
              <div>Status: {snapshot.next.status ?? '—'}</div>
            </div>
          </div>
        ) : (
          <div className="next-empty">No one is being served</div>
        )}
      </section>

      <section className="queue-list">
        <h3>Waiting Queue</h3>
        <ul>
          {snapshot.queue.length === 0 && <li className="empty">No patients waiting</li>}
          {(() => {
            const filtered = snapshot.queue.filter(q => !(snapshot.next && q.queueNumber === snapshot.next.queueNumber));
            return filtered.map((q) => (
              <li key={String(q.queueNumber)} className="queue-item">
                <div className="qnum">{q.queueNumber}</div>
                <div className="qmeta">
                  <div>Patient: {q.patientName ?? q.patientId ?? '—'}</div>
                  <div>Doctor: {q.doctorName ?? q.doctorId ?? '—'}</div>
                  <div className="qstatus">{q.status ?? '—'}</div>
                </div>
              </li>
            ));
          })()}
        </ul>
      </section>
    </div>
  );
}