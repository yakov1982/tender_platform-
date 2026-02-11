import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bidsApi, tendersApi, Bid, Tender } from '../api';
import styles from './MyBids.module.css';

const BID_STATUS_LABELS: Record<string, string> = {
  pending: 'На рассмотрении',
  accepted: 'Принята',
  rejected: 'Отклонена',
};

function formatAmount(amount: number) {
  return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function MyBids() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [tenders, setTenders] = useState<Record<number, Tender>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bidsApi.getMy().then(({ data }) => {
      setBids(data);
      const ids = [...new Set(data.map((b) => b.tender_id))];
      Promise.all(ids.map((id) => tendersApi.get(id))).then((responses) => {
        const map: Record<number, Tender> = {};
        responses.forEach((r) => {
          map[r.data.id] = r.data;
        });
        setTenders(map);
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>Мои заявки</h1>
      <div className={styles.list}>
        {bids.map((bid) => (
          <div key={bid.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <Link to={`/tenders/${bid.tender_id}`} className={styles.tenderTitle}>
                {tenders[bid.tender_id]?.title || `Тендер #${bid.tender_id}`}
              </Link>
              <span className={`${styles.status} ${styles[`status_${bid.status}`]}`}>
                {BID_STATUS_LABELS[bid.status] || bid.status}
              </span>
            </div>
            <p className={styles.amount}>{formatAmount(bid.amount)}</p>
            <p className={styles.proposal}>{bid.proposal}</p>
            <p className={styles.date}>{formatDate(bid.created_at)}</p>
          </div>
        ))}
      </div>
      {bids.length === 0 && (
        <p className={styles.empty}>У вас пока нет заявок</p>
      )}
    </div>
  );
}
