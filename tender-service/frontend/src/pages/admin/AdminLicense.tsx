import { useState, useEffect } from 'react';
import { licenseApi, LicenseStatus } from '../../api';
import styles from './AdminLicense.module.css';

export default function AdminLicense() {
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    licenseApi.getStatus().then(({ data }) => {
      setStatus(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleConfigure = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      const { data } = await licenseApi.configure(licenseKey);
      setStatus(data);
      if (data.valid) {
        setMessage('Лицензия успешно активирована');
        setLicenseKey('');
      } else {
        setMessage(data.message);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setMessage(axiosErr.response?.data?.detail || 'Ошибка при активации лицензии');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div>
      <h1 className={styles.title}>Лицензия</h1>
      <p className={styles.description}>
        Система интегрирована с сервером лицензий ({' '}
        <a href="https://github.com/yakov1982/License_key_server" target="_blank" rel="noreferrer">
          License_key_server
        </a>
        ). Укажите лицензионный ключ для активации.
      </p>

      <div className={styles.statusCard}>
        <h2>Текущий статус</h2>
        <div className={styles.statusRow}>
          <span className={styles.label}>Статус:</span>
          <span className={status?.valid ? styles.valid : styles.invalid}>
            {status?.configured
              ? status.valid
                ? 'Активна'
                : 'Недействительна'
              : 'Не настроена'}
          </span>
        </div>
        {status?.message && (
          <div className={styles.statusRow}>
            <span className={styles.label}>Сообщение:</span>
            <span>{status.message}</span>
          </div>
        )}
        {status?.product_name && (
          <div className={styles.statusRow}>
            <span className={styles.label}>Продукт:</span>
            <span>{status.product_name}</span>
          </div>
        )}
        {status?.expires_at && (
          <div className={styles.statusRow}>
            <span className={styles.label}>Действует до:</span>
            <span>{new Date(status.expires_at).toLocaleDateString('ru-RU')}</span>
          </div>
        )}
      </div>

      <div className={styles.formCard}>
        <h2>Активировать лицензию</h2>
        <form onSubmit={handleConfigure}>
          {message && (
            <div className={message.includes('успешно') ? styles.success : styles.error}>
              {message}
            </div>
          )}
          <label>
            Лицензионный ключ
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="LIC-XXXXX-XXXXX-XXXXX-XXXXX"
              className={styles.input}
            />
          </label>
          <button type="submit" disabled={saving || !licenseKey.trim()} className={styles.submit}>
            {saving ? 'Проверка...' : 'Активировать'}
          </button>
        </form>
      </div>

      <div className={styles.note}>
        <strong>Настройка:</strong> Задайте переменные окружения <code>LICENSE_SERVER_URL</code> (URL
        сервера лицензий, например http://localhost:8001) и <code>LICENSE_PRODUCT_NAME</code> (имя
        продукта, по умолчанию TenderSystem). Без этих настроек проверка лицензии отключена.
      </div>
    </div>
  );
}
