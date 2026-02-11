import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import styles from './Layout.module.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          Тендеры
        </Link>
        <nav className={styles.nav}>
          <Link to="/" className={styles.navLink}>Каталог тендеров</Link>
          <Link to="/my-bids" className={styles.navLink}>Мои заявки</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className={styles.adminLink}>Панель администратора</Link>
          )}
        </nav>
        <div className={styles.userBlock}>
          <span className={styles.userName}>{user?.full_name}</span>
          <button onClick={handleLogout} className={styles.logoutBtn}>Выйти</button>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
