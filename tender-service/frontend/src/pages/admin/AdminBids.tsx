import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bidsApi, tendersApi, Bid, Tender } from '../../api';
import styles from './AdminBids.module.css';

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

export default function AdminBids() {
  const { id } = useParams<{ id: string }>();
  const [tender, setTender] = useState<Tender | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      Promise.all([
        tendersApi.get(Number(id)),
        bidsApi.getByTender(Number(id)),
      ]).then(([tRes, bRes]) => {
        setTender(tRes.data);
        setBids(bRes.data);
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const handleStatus = async (bidId: number, status: string) => {
    try {
      await bidsApi.updateStatus(bidId, status);
      setBids((prev) =>
        prev.map((b) => (b.id === bidId ? { ...b, status } : b))
      );
    } catch {}
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div>
      <div className={styles.header}>
        <Link to="/admin/tenders" className={styles.back}>← К тендерам</Link>
        <h1 className={styles.title}>
          Заявки: {tender?.title || 'Тендер'}
        </h1>
      </div>
      <div className={styles.list}>
        {bids.map((bid) => (
          <div key={bid.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <strong>{bid.bidder?.full_name || bid.bidder_id}</strong>
                <span className={styles.email}>{bid.bidder?.email}</span>
              </div>
              <span className={`${styles.status} ${styles[`status_${bid.status}`]}`}>
                {BID_STATUS_LABELS[bid.status] || bid.status}
              </span>
            </div>
            <p className={styles.amount}>{formatAmount(bid.amount)}</p>
            <p className={styles.proposal}>{bid.proposal}</p>
            <p className={styles.date}>{formatDate(bid.created_at)}</p>
            {bid.status === 'pending' && (
              <div className={styles.actions}>
                <button
                  onClick={() => handleStatus(bid.id, 'accepted')}
                  className={styles.acceptBtn}
                >
                  Принять
                </button>
                <button
                  onClick={() => handleStatus(bid.id, 'rejected')}
                  className={styles.rejectBtn}
                >
                  Отклонить
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {bids.length === 0 && (
        <p className={styles.empty}>Заявок пока нет</p>
      )}
    </div>
  );
}
