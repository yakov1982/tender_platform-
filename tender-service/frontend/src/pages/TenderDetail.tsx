import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { tendersApi, bidsApi, Tender } from '../api';
import styles from './TenderDetail.module.css';

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
    month: 'long',
    year: 'numeric',
  });
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
}

export default function TenderDetail() {
  const { id } = useParams<{ id: string }>();
  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [proposal, setProposal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (id) {
      tendersApi.get(Number(id)).then(({ data }) => {
        setTender(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id]);

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tender || !amount || !proposal) return;
    setSubmitting(true);
    setMessage('');
    try {
      await bidsApi.create({
        tender_id: tender.id,
        amount: parseFloat(amount),
        proposal,
      });
      setMessage('Заявка успешно подана!');
      setAmount('');
      setProposal('');
      setTender({ ...tender, bids_count: (tender.bids_count || 0) + 1 });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setMessage(axiosErr.response?.data?.detail || 'Ошибка при подаче заявки');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !tender) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <span className={`${styles.status} ${styles[`status_${tender.status}`]}`}>
          {STATUS_LABELS[tender.status] || tender.status}
        </span>
        <h1 className={styles.title}>{tender.title}</h1>
        <p className={styles.meta}>
          {tender.category} • Бюджет: {formatAmount(tender.budget)} • До {formatDate(tender.deadline)}
        </p>
      </header>
      <div className={styles.description}>
        <h2>Описание</h2>
        <p>{tender.description}</p>
      </div>
      {tender.status === 'bidding' && (
        <div className={styles.bidForm}>
          <h2>Подать заявку</h2>
          <form onSubmit={handleSubmitBid}>
            {message && <div className={message.includes('успешно') ? styles.success : styles.error}>{message}</div>}
            <label>
              Сумма (₽)
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className={styles.input}
              />
            </label>
            <label>
              Сопроводительное письмо
              <textarea
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                required
                rows={4}
                className={styles.textarea}
                placeholder="Опишите ваше предложение..."
              />
            </label>
            <button type="submit" disabled={submitting} className={styles.submit}>
              {submitting ? 'Отправка...' : 'Подать заявку'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
