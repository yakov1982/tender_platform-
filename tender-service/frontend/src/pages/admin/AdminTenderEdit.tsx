import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tendersApi } from '../../api';
import styles from './AdminTenderEdit.module.css';

export default function AdminTenderEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      tendersApi.get(Number(id)).then(({ data }) => {
        setTitle(data.title);
        setDescription(data.description);
        setCategory(data.category);
        setBudget(String(data.budget));
        setDeadline(data.deadline.slice(0, 16));
        setLoading(false);
      });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        category,
        budget: parseFloat(budget),
        deadline: new Date(deadline).toISOString(),
      };
      if (isNew) {
        const { data } = await tendersApi.create(payload);
        navigate(`/admin/tenders/${data.id}/edit`, { replace: true });
      } else {
        await tendersApi.update(Number(id), payload);
      }
    } catch {}
    setSaving(false);
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div>
      <h1 className={styles.title}>{isNew ? 'Новый тендер' : 'Редактировать тендер'}</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label>
          Название
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={styles.input}
          />
        </label>
        <label>
          Описание
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={6}
            className={styles.textarea}
          />
        </label>
        <label>
          Категория
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className={styles.input}
          />
        </label>
        <label>
          Бюджет (₽)
          <input
            type="number"
            min="0"
            step="0.01"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            required
            className={styles.input}
          />
        </label>
        <label>
          Срок подачи заявок
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
            className={styles.input}
          />
        </label>
        <div className={styles.actions}>
          <button type="submit" disabled={saving} className={styles.submit}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button type="button" onClick={() => navigate('/admin/tenders')} className={styles.cancel}>
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
