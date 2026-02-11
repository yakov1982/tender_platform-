import { useState, useEffect } from 'react';
import { usersApi, User } from '../../api';
import styles from './AdminUsers.module.css';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.list().then(({ data }) => {
      setUsers(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleToggleActive = async (user: User) => {
    try {
      await usersApi.update(user.id, { is_active: !user.is_active });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_active: !u.is_active } : u
        )
      );
    } catch {}
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div>
      <h1 className={styles.title}>Пользователи</h1>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Email</th>
              <th>Компания</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Дата регистрации</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name}</td>
                <td>{u.email}</td>
                <td>{u.company || '—'}</td>
                <td>
                  <span className={u.role === 'admin' ? styles.adminBadge : ''}>
                    {u.role === 'admin' ? 'Админ' : 'Пользователь'}
                  </span>
                </td>
                <td>
                  <span className={u.is_active ? styles.active : styles.inactive}>
                    {u.is_active ? 'Активен' : 'Заблокирован'}
                  </span>
                </td>
                <td>{formatDate(u.created_at)}</td>
                <td>
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={u.is_active ? styles.blockBtn : styles.unblockBtn}
                    >
                      {u.is_active ? 'Заблокировать' : 'Разблокировать'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
