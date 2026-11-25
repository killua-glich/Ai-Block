import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import RequireLogin from './components/RequireLogin.jsx'
import { AuthProvider } from './data/AuthContext.jsx'
import Catalog from './pages/Catalog.jsx'
import DeviceDetail from './pages/DeviceDetail.jsx'
import MyRentals from './pages/MyRentals.jsx'
import NotFound from './pages/NotFound.jsx'
import Login from './pages/Login.jsx'
import Admin from './pages/Admin.jsx'
import Register from './pages/Register.jsx'

export default function App() {
  return (
    <AuthProvider>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/devices/:id" element={<DeviceDetail />} />
          <Route path="/rentals" element={<RequireLogin><MyRentals /></RequireLogin>} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </AuthProvider>
  )
}
