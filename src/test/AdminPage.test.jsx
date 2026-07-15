import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ShopProvider } from '../context/ShopContext'

vi.mock('lucide-react', () => ({
  LayoutDashboard: () => <span data-testid="dashboard">Dashboard</span>,
  Boxes: () => <span data-testid="boxes">Boxes</span>,
  Film: () => <span data-testid="film">Film</span>,
  Settings: () => <span data-testid="settings">Settings</span>,
  Search: () => <span data-testid="search">Search</span>,
  Bell: () => <span data-testid="bell">Bell</span>,
  LogOut: () => <span data-testid="logout">Logout</span>,
  BarChart3: () => <span data-testid="bar-chart">Chart</span>,
  FolderKanban: () => <span data-testid="folder">Folder</span>,
  Info: () => <span data-testid="info">Info</span>,
  Mail: () => <span data-testid="mail">Mail</span>,
  Sparkles: () => <span data-testid="sparkles">Sparkles</span>,
  ShoppingBag: () => <span data-testid="shopping-bag">Bag</span>,
  TrendingUp: () => <span data-testid="trending">Trending</span>,
  Users: () => <span data-testid="users">Users</span>,
  FileText: () => <span data-testid="file-text">File</span>,
  Grid: () => <span data-testid="grid">Grid</span>,
  List: () => <span data-testid="list">List</span>,
  Check: () => <span data-testid="check">Check</span>,
  Trash2: () => <span data-testid="trash">Trash</span>,
  Edit: () => <span data-testid="edit">Edit</span>,
  Eye: () => <span data-testid="eye">Eye</span>,
  ChevronLeft: () => <span data-testid="chevron-left">←</span>,
  ChevronRight: () => <span data-testid="chevron-right">→</span>,
  UploadCloud: () => <span data-testid="upload">Upload</span>,
  X: () => <span data-testid="x">X</span>,
  Plus: () => <span data-testid="plus">Plus</span>,
  Menu: () => <span data-testid="menu">Menu</span>,
  Activity: () => <span data-testid="activity">Activity</span>,
  DollarSign: () => <span data-testid="dollar">$</span>,
  Layers: () => <span data-testid="layers">Layers</span>,
  MessageSquare: () => <span data-testid="message">Message</span>,
  Send: () => <span data-testid="send">Send</span>,
  ImageIcon: () => <span data-testid="image-icon">Image</span>,
  Video: () => <span data-testid="video">Video</span>,
  LayoutGrid: () => <span data-testid="layout-grid">Grid</span>,
  Armchair: () => <span data-testid="armchair">Armchair</span>,
  ClipboardList: () => <span data-testid="clipboard">Clipboard</span>,
  User: () => <span data-testid="user">User</span>,
  Brush: () => <span data-testid="brush">Brush</span>,
  CalendarCheck: () => <span data-testid="calendar-check">Calendar</span>,
  Inbox: () => <span data-testid="inbox">Inbox</span>,
  SendHorizontal: () => <span data-testid="send-horizontal">Send</span>,
  UserCheck: () => <span data-testid="user-check">User</span>,
  Clock: () => <span data-testid="clock">Clock</span>,
  CheckCircle2: () => <span data-testid="check-circle">Check</span>,
  XCircle: () => <span data-testid="x-circle">X</span>,
  Images: () => <span data-testid="images">Images</span>,
  Newspaper: () => <span data-testid="newspaper">News</span>,
  Shield: () => <span data-testid="shield">Shield</span>,
  Settings2: () => <span data-testid="settings2">Settings</span>,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Link: ({ children }) => <span>{children}</span>,
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
    useLocation: () => ({ pathname: '/admin' }),
  }
})

import { AdminPage } from '../pages/admin/AdminPage'

const renderWithProviders = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test', route)
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ShopProvider>
          {ui}
        </ShopProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders admin page without crashing', async () => {
    localStorage.setItem('hok_access_token', 'token')
    
    const { container } = renderWithProviders(<AdminPage />, { route: '/admin' })
    
    await waitFor(() => {
      expect(container.innerHTML).toBeTruthy()
    }, { timeout: 3000 })
  })

  it('shows settings tab with maintenance mode toggle', async () => {
    localStorage.setItem('hok_access_token', 'token')
    
    renderWithProviders(<AdminPage />, { route: '/admin' })
    
    await waitFor(() => {
      expect(screen.getByTestId('settings')).toBeDefined()
    }, { timeout: 3000 })
    
    fireEvent.click(screen.getByTestId('settings'))
    
    await waitFor(() => {
      expect(screen.getByText('Maintenance Mode')).toBeDefined()
    }, { timeout: 3000 })
  })
})
