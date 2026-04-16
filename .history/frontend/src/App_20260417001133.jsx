import { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import './App.css';

const FILTERS = ['all', 'active', 'done', 'high'];

const PRIORITY_COLORS = { high: '#E24B4A', medium: '#EF9F27', low: '#639922' };

function PriorityDot({ priority }) {
  if (!priority || priority === 'none') return null;
  return (
    <span style={{
      width: 7, height: 7, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
      background: PRIORITY_COLORS[priority] || 'transparent',
    }} title={`${priority} priority`} />
  );
}

function TaskItem({ task, onToggle, onDelete }) {
  return (
    <div className={`task-item${task.done ? ' done' : ''}`}>
      <div
        className={`checkbox${task.done ? ' checked' : ''}`}
        onClick={() => onToggle(task)}
        role="checkbox"
        aria-checked={task.done}
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onToggle(task)}
      >
        {task.done && (
          <svg width="10" height="7" viewBox="0 0 10 7">
            <path d="M1 3.5L3.5 6L9 1" stroke="currentColor" strokeWidth="1.8"
              fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <PriorityDot priority={task.priority} />
      <span className="task-text">{task.text}</span>
      <button className="delete-btn" onClick={() => onDelete(task.id)} title="Delete">✕</button>
    </div>
  );
}

export default function App() {
  const [tasks,    setTasks]   = useState([]);
  const [filter,   setFilter]  = useState('all');
  const [input,    setInput]   = useState('');
  const [priority, setPriority]= useState('none');
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState(null);

  const loadTasks = useCallback(async (f = filter) => {
    try {
      setError(null);
      const data = await api.list(f);
      setTasks(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadTasks(filter); }, [filter]);

  async function addTask() {
    const text = input.trim();
    if (!text) return;
    try {
      const task = await api.create(text, priority);
      setInput('');
      setPriority('none');
      // Prepend immediately, reload to get server state
      setTasks(prev => [task, ...prev]);
    } catch (e) {
      setError(e.message);
    }
  }

  async function toggleTask(task) {
    try {
      const updated = await api.update(task.id, { done: !task.done });
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      if (filter !== 'all') loadTasks(filter);
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteTask(id) {
    try {
      await api.remove(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  async function clearCompleted() {
    try {
      await api.clearCompleted();
      setTasks(prev => prev.filter(t => !t.done));
    } catch (e) {
      setError(e.message);
    }
  }

  const activeCount = tasks.filter(t => !t.done).length;
  const doneCount   = tasks.filter(t =>  t.done).length;

  return (
    <div className="app-card">
      <div className="header">
        <span className="title">My tasks by JAY</span>
        <span className="count-badge">{activeCount === 1 ? '1 left' : `${activeCount} left`}</span>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="input-row">
        <input
          className="task-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="Add a new task..."
          maxLength={500}
        />
        <select className="priority-select" value={priority} onChange={e => setPriority(e.target.value)}>
          <option value="none">No priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button className="add-btn" onClick={addTask}>Add</button>
      </div>

      <div className="filters">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`filter-btn${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'high' ? 'High priority' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="task-list">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">✓</span>
            {filter === 'done'   ? 'No completed tasks yet.' :
             filter === 'high'   ? 'No high-priority tasks.' :
             filter === 'active' ? 'Nothing active — great job!' :
             'Nothing here — add a task above!'}
          </div>
        ) : tasks.map(task => (
          <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
        ))}
      </div>

      <div className="footer">
        <span className="footer-text">{doneCount} completed</span>
        {doneCount > 0 && (
          <button className="clear-btn" onClick={clearCompleted}>Clear completed</button>
        )}
      </div>
    </div>
  );
}
