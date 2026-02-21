import { useAuth } from '../context/AuthContext';
import Dashboard from '../pages/Dashboard';
import MentorDashboard from '../pages/MentorDashboard';

const RoleDashboard = () => {
    const { user } = useAuth();
    return user?.role === 'mentor' ? <MentorDashboard /> : <Dashboard />;
};

export default RoleDashboard;
