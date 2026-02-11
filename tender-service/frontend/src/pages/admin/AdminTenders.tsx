import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tendersApi, Tender } from '../../api';
import styles from './AdminTenders.module.css';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  bidding: 'Приём заявок',
  review: 'На рассмотрении',
  awarded: 'Завершён',
  cancelled: 'Отменён',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
}

export default function AdminTenders() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tendersApi.list({ include_drafts: true }).then(({ data }) => {
      setTenders(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handlePublish = async (id: number) => {
    try {
      await tendersApi.publish(id);
      setTenders((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: 'bidding' } : t))
      );
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить тендер?')) return;
    try {
      await tendersApi.delete(id);
      setTenders((prev) => prev.filter((t) => t.id !== id));
    } catch {}
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Тендеры</h1>
        <Link to="/admin/tenders/new" className={styles.createBtn}>
          + Создать тендер
        </Link>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Название</th>
              <th>Категория</th>
              <th>Бюджет</th>
              <th>Статус</th>
              <th>Срок</th>
              <th>Заявок</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {tenders.map((t) => (
              <tr key={t.id}>
                <td>
                  <Link to={`/admin/tenders/${t.id}/edit`} className={styles.link}>
                    {t.title}
                  </Link>
                </td>
                <td>{t.category}</td>
                <td>{formatAmount(t.budget)}</td>
                <td>
                  <span className={`${styles.status} ${styles[`status_${t.status}`]}`}>
                    {STATUS_LABELS[t.status] || t.status}
                  </span>
                </td>
                <td>{formatDate(t.deadline)}</td>
                <td>{t.bids_count ?? 0}</td>
                <td>
                  <div className={styles.actions}>
                    {t.status === 'bidding' && (
                      <Link to={`/admin/tenders/${t.id}/bids`} className={styles.actionLink}>
                        Заявки
                      </Link>
                    )}
                    {t.status === 'draft' && (
                      <button
                        onClick={() => handlePublish(t.id)}
                        className={styles.actionBtn}
                      >
                        Опубликовать
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(t.id)}
                      className={styles.deleteBtn}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
