import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Student pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Matches from './pages/Matches';
import Requests from './pages/Requests';
import Chat from './pages/Chat';
import Sessions from './pages/Sessions';

// Mentor pages
import MentorDashboard from './pages/MentorDashboard';
import MyMentees from './pages/MyMentees';
import SessionRequests from './pages/SessionRequests';
import PublicProfile from './pages/PublicProfile';

// Shared pages
import Forum from './pages/Forum';
import Calendar from './pages/Calendar';
import SearchUsers from './pages/SearchUsers';
import AdminDashboard from './pages/AdminDashboard';

// Smart Dashboard that routes by role
import RoleDashboard from './components/RoleDashboard';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                {/* Dashboard routes by role */}
                <Route path="/" element={<RoleDashboard />} />

                {/* Student routes */}
                <Route path="/matches" element={<Matches />} />
                <Route path="/requests" element={<Requests />} />
                <Route path="/sessions" element={<Sessions />} />
                <Route path="/profile" element={<Profile />} />

                {/* Mentor routes */}
                <Route path="/mentees" element={<MyMentees />} />
                <Route path="/session-requests" element={<SessionRequests />} />
                <Route path="/public-profile" element={<PublicProfile />} />

                {/* Shared routes */}
                <Route path="/chat" element={<Chat />} />
                <Route path="/forum" element={<Forum />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/search" element={<SearchUsers />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/profile/:id" element={<PublicProfile />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
