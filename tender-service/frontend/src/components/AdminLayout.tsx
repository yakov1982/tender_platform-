import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.logoIcon}>⚙</span>
          <span>Админ-панель</span>
        </div>
        <nav className={styles.nav}>
          <Link to="/admin/tenders" className={styles.navLink}>Тендеры</Link>
          <Link to="/admin/users" className={styles.navLink}>Пользователи</Link>
          <Link to="/admin/license" className={styles.navLink}>Лицензия</Link>
        </nav>
        <div className={styles.sidebarFooter}>
          <Link to="/" className={styles.backLink}>← На сайт</Link>
          <span className={styles.userName}>{user?.full_name}</span>
          <button onClick={() => logout()} className={styles.logoutBtn}>Выйти</button>
        </div>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
