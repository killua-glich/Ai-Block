import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Catalog from './pages/Catalog.jsx'
import DeviceDetail from './pages/DeviceDetail.jsx'

export default function App() {
  return (
    <>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/devices/:id" element={<DeviceDetail />} />
        </Routes>
      </main>
    </>
  )
}
