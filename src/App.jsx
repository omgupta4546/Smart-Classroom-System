import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Classroom from './pages/Classroom';
import Attendance from './pages/Attendance';
import AdminPanel from './pages/AdminPanel';
import FaceRegister from './pages/FaceRegister';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
    return (
        <div className="app-container">
            <Routes>
                <Route path="/classroom/:classCode/attendance" element={
                    <ProtectedRoute>
                        <Layout>
                            <Attendance />
                        </Layout>
                    </ProtectedRoute>
                } />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Layout>
                            <Dashboard />
                        </Layout>
                    </ProtectedRoute>
                } />
                <Route path="/classroom/:classCode" element={
                    <ProtectedRoute>
                        <Layout>
                            <Classroom />
                        </Layout>
                    </ProtectedRoute>
                } />
                {/* Attendance Route Moved Up */}
                {/* Add more routes here */}
                <Route path="/admin" element={
                    <ProtectedRoute>
                        <Layout>
                            <AdminPanel />
                        </Layout>
                    </ProtectedRoute>
                } />
                <Route path="/face-register" element={
                    <ProtectedRoute>
                        <Layout>
                            <FaceRegister />
                        </Layout>
                    </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </div>
    );
}

export default App;
