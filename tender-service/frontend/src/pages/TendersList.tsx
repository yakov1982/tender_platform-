import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tendersApi, Tender } from '../api';
import styles from './TendersList.module.css';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  published: 'Опубликован',
  bidding: 'Приём заявок',
  review: 'На рассмотрении',
  awarded: 'Завершён',
  cancelled: 'Отменён',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
}

export default function TendersList() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    tendersApi.list().then(({ data }) => {
      setTenders(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = filter
    ? tenders.filter(
        (t) =>
          t.title.toLowerCase().includes(filter.toLowerCase()) ||
          t.category.toLowerCase().includes(filter.toLowerCase())
      )
    : tenders;

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>Каталог тендеров</h1>
      <input
        type="text"
        placeholder="Поиск по названию или категории..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className={styles.search}
      />
      <div className={styles.grid}>
        {filtered.map((tender) => (
          <Link to={`/tenders/${tender.id}`} key={tender.id} className={styles.card}>
            <span className={`${styles.status} ${styles[`status_${tender.status}`]}`}>
              {STATUS_LABELS[tender.status] || tender.status}
            </span>
            <h2 className={styles.cardTitle}>{tender.title}</h2>
            <p className={styles.category}>{tender.category}</p>
            <p className={styles.budget}>{formatAmount(tender.budget)}</p>
            <p className={styles.deadline}>До: {formatDate(tender.deadline)}</p>
            {tender.bids_count !== undefined && tender.bids_count > 0 && (
              <span className={styles.bidsCount}>{tender.bids_count} заявок</span>
            )}
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className={styles.empty}>Тендеров не найдено</p>
      )}
    </div>
  );
}
