import { Outlet, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  BarChart3, 
  User, 
  LogOut,
  Bell,
  Search,
  Brain,
  Sun,
  Moon
} from 'lucide-react';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    if (val.trim()) {
      setSearchParams({ search: val });
      if (window.location.pathname !== '/app/habits') {
        navigate(`/app/habits?search=${encodeURIComponent(val)}`);
      }
    } else {
      setSearchParams({});
      if (window.location.pathname !== '/app/habits') {
        navigate('/app/habits');
      }
    }
  };

  const menuItems = [
    { title: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/app' },
    { title: 'My Habits', icon: <CheckSquare size={20} />, path: '/app/habits' },
    { title: 'Analytics', icon: <BarChart3 size={20} />, path: '/app/analytics' },
    { title: 'AI Insights', icon: <Brain size={20} />, path: '/app/ai-insights' },
    { title: 'Profile', icon: <User size={20} />, path: '/app/profile' },
  ];

  return (
    <div className="flex h-screen bg-background text-text-primary">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col transition-colors duration-300">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary font-heading">HabitForge</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/app'}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                ${isActive 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-text-secondary hover:bg-background/50 hover:text-text-primary'}
              `}
            >
              {item.icon}
              {item.title}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-text-secondary hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 transition-colors duration-300">
          <form 
            onSubmit={(e) => e.preventDefault()}
            className="flex items-center bg-background rounded-full px-4 py-2 w-96 border border-border focus-within:border-primary transition-colors"
          >
            <Search size={18} className="text-text-secondary" />
            <input 
              type="text" 
              placeholder="Search habits..." 
              value={searchParams.get('search') || ''}
              onChange={handleSearch}
              className="bg-transparent border-none focus:outline-none ml-2 w-full text-sm placeholder:text-text-secondary"
            />
          </form>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleDarkMode}
              className="text-text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-background"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div 
              onClick={() => navigate('/app/profile')}
              className="flex items-center gap-3 pl-6 border-l border-border cursor-pointer group hover:opacity-80 transition-all"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold group-hover:text-primary transition-colors">{user?.name}</p>
                <p className="text-xs text-text-secondary">Habit Crusher</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-border group-hover:border-primary transition-colors shadow-sm">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary font-bold">{user?.name?.charAt(0)}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-background transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
