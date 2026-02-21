import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';

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

// Smart Dashboard that routes by role
import RoleDashboard from './components/RoleDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
