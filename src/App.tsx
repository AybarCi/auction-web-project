import { Routes, Route } from 'react-router-dom'
import { AuctionProvider } from './context/AuctionContext'
import HomePage from './pages/HomePage'
import AuctionEndedPage from './pages/AuctionEndedPage'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminAuctions from './pages/admin/AdminAuctions'
import NewAuction from './pages/admin/NewAuction'
import EditAuction from './pages/admin/EditAuction'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
    return (
        <AuctionProvider>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/bitti" element={<AuctionEndedPage />} />

                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={
                    <ProtectedRoute>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/admin/auctions" element={
                    <ProtectedRoute>
                        <AdminAuctions />
                    </ProtectedRoute>
                } />
                <Route path="/admin/auctions/new" element={
                    <ProtectedRoute>
                        <NewAuction />
                    </ProtectedRoute>
                } />
                <Route path="/admin/auctions/:id" element={
                    <ProtectedRoute>
                        <EditAuction />
                    </ProtectedRoute>
                } />
            </Routes>
        </AuctionProvider>
    )
}

export default App
