import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './components/Login'
import Signup from './components/Signup'
import FriendsPage from './components/FriendsPage'
import ChatPage from './components/ChatPage'
import LandingPage from './components/LandingPage'
import Feed from './components/Feed'
import CreatePost from './components/CreatePost'
import ProfilePage from './components/ProfilePage'
import DiscoveryPage from './components/DiscoveryPage'
import ContactPage from './components/ContactPage'
import Home from './components/Home'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><AppLayout><FriendsPage /></AppLayout></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><AppLayout><ChatPage /></AppLayout></ProtectedRoute>} />
          <Route path="/chat/:friendId" element={<ProtectedRoute><AppLayout><ChatPage /></AppLayout></ProtectedRoute>} />
          <Route path="/feed" element={<ProtectedRoute><AppLayout><Feed /></AppLayout></ProtectedRoute>} />
          <Route path="/discover" element={<ProtectedRoute><AppLayout><DiscoveryPage /></AppLayout></ProtectedRoute>} />
          <Route path="/create-post" element={<ProtectedRoute><AppLayout><CreatePost /></AppLayout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
