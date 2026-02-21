import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, MessageSquare, Users, Calendar, Home, Search, BookOpen } from 'lucide-react';

const Navbar = () => {
    const { logout, user } = useAuth();
    const location = useLocation();

    const linkClass = (path) => `nav-link ${location.pathname === path ? 'active' : ''}`;

    const isMentor = user?.role === 'mentor';

    return (
        <nav className="navbar">
            <div className="container">
                <Link to="/" className="navbar-brand">
                    <span className="navbar-brand-icon">M</span>
                    MentorMatch
                </Link>

                <div className="navbar-links">
                    {isMentor ? (
                        /* ===== MENTOR NAV ===== */
                        <>
                            <Link to="/" className={linkClass('/')}>
                                <Home size={20} />
                                <span>Dashboard</span>
                            </Link>
                            <Link to="/mentees" className={linkClass('/mentees')}>
                                <Users size={20} />
                                <span>My Mentees</span>
                            </Link>
                            <Link to="/chat" className={linkClass('/chat')}>
                                <MessageSquare size={20} />
                                <span>Chat</span>
                            </Link>
                            <Link to="/session-requests" className={linkClass('/session-requests')}>
                                <Calendar size={20} />
                                <span>Sessions</span>
                            </Link>
                            <Link to="/forum" className={linkClass('/forum')}>
                                <BookOpen size={20} />
                                <span>Forum</span>
                            </Link>
                            <Link to="/public-profile" className={linkClass('/public-profile')}>
                                <User size={20} />
                                <span>Profile</span>
                            </Link>
                        </>
                    ) : (
                        /* ===== STUDENT NAV ===== */
                        <>
                            <Link to="/" className={linkClass('/')}>
                                <Home size={20} />
                                <span>Dashboard</span>
                            </Link>
                            <Link to="/matches" className={linkClass('/matches')}>
                                <Search size={20} />
                                <span>Matches</span>
                            </Link>
                            <Link to="/sessions" className={linkClass('/sessions')}>
                                <Calendar size={20} />
                                <span>Sessions</span>
                            </Link>
                            <Link to="/chat" className={linkClass('/chat')}>
                                <MessageSquare size={20} />
                                <span>Chat</span>
                            </Link>
                            <Link to="/forum" className={linkClass('/forum')}>
                                <BookOpen size={20} />
                                <span>Forum</span>
                            </Link>
                            <Link to="/profile" className={linkClass('/profile')}>
                                <User size={20} />
                                <span>Profile</span>
                            </Link>
                        </>
                    )}
                    <button onClick={logout} className="nav-link-logout" title="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
