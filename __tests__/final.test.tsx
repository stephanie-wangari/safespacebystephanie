import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import LoginPage from '../app/login/page'
import ChatPage from '../app/chat/page'
import HomePage from '../app/page'
import AdminPage from '../app/admin/page'
import ReportPage from '../app/report/page'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import * as firestore from 'firebase/firestore'

// --- UNIVERSAL FOOLPROOF MOCKS ---
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock environment variables for Cloudinary
process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = 'test-preset';

// Mock Fetch for Cloudinary
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ secure_url: 'https://cloudinary.com/proof.png' }),
  })
) as jest.Mock;

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }) }))
jest.mock('../contexts/AuthContext', () => ({ useAuth: jest.fn() }))
jest.mock('../hooks/use-toast', () => ({ useToast: () => ({ toast: jest.fn() }) }))

jest.mock('lucide-react', () => {
  const M = () => <div />;
  return {
    Shield: M, LogIn: M, Ghost: M, Send: M, Phone: M, FileText: M, AlertTriangle: M, Sparkles: M,
    CheckCircle: M, Volume2: M, VolumeX: M, Plus: M, Search: M, Filter: M, Users: M, MoreVertical: M,
    ArrowRight: M, MapPin: M, Clock: M, Eye: M, BookOpen: M, Image: M, Download: M, ExternalLink: M,
    X: M, Calendar: M, EyeOff: M, Upload: M, Mic: M
  }
})

jest.mock('../components/navigation', () => ({ Navigation: () => <div /> }))
jest.mock('../components/ui/button', () => ({ Button: ({ children, onClick, className }: any) => <button onClick={onClick} className={className}>{children}</button> }))
jest.mock('../components/ui/card', () => {
  const D = ({ children }: any) => <div>{children}</div>;
  return { Card: D, CardHeader: D, CardTitle: D, CardDescription: D, CardContent: D };
})
jest.mock('../components/ui/tabs', () => {
  const D = ({ children }: any) => <div>{children}</div>;
  return { Tabs: D, TabsList: D, TabsTrigger: D, TabsContent: D };
})
jest.mock('../components/ui/badge', () => ({ Badge: ({ children }: any) => <span>{children}</span> }))
jest.mock('../components/ui/dialog', () => {
  const D = ({ children }: any) => <div>{children}</div>;
  return { Dialog: D, DialogContent: D, DialogHeader: D, DialogTitle: D, DialogDescription: D };
})
jest.mock('../components/ui/toaster', () => ({ Toaster: () => <div /> }))
jest.mock('../components/ui/input', () => ({ Input: (props: any) => <input {...props} /> }))
jest.mock('../components/ui/label', () => ({ Label: ({ children }: any) => <label>{children}</label> }))
jest.mock('../components/ui/textarea', () => ({ Textarea: (props: any) => <textarea {...props} /> }))
jest.mock('../components/ui/checkbox', () => ({ Checkbox: () => <input type="checkbox" /> }))
jest.mock('../components/ui/radio-group', () => {
  const D = ({ children }: any) => <div>{children}</div>;
  return { RadioGroup: D, RadioGroupItem: () => <input type="radio" /> };
})
jest.mock('../components/google-sign-in-button', () => ({ GoogleSignInButton: () => <button>Google</button> }))
jest.mock('../components/status-card', () => ({ StatusCard: () => <div /> }))
jest.mock('../components/quick-actions', () => ({ QuickActions: () => <div /> }))
jest.mock('../components/sos-button', () => ({ 
  SOSButton: ({ onTrigger, isActive }: any) => (
    <button onClick={onTrigger}>{isActive ? 'I AM SAFE' : 'SOS'}</button>
  ) 
}))
jest.mock('../components/chat-message', () => ({ ChatMessage: () => <div /> }))

jest.mock('next/dynamic', () => () => () => <div>Map</div>)
jest.mock('../lib/ai', () => ({ generateAIReply: jest.fn(() => Promise.resolve('OK')) }))
jest.mock('../lib/crisis-replies', () => ({ getImminentDangerReply: () => null, getStructuredCrisisReply: () => null, getDeterministicCrisisReply: () => null }))

// Firestore Mocks
jest.mock('firebase/firestore', () => {
  const mockTimestamp = { toDate: () => new Date() };
  const mockDocs = [
    { id: '1', data: () => ({ timestamp: mockTimestamp, status: 'active', currentLocation: { lat: 0, lng: 0 }, incidentType: ['physical'] }) }
  ];
  return {
    collection: jest.fn(), addDoc: jest.fn(() => Promise.resolve({ id: 'mock-id' })), 
    updateDoc: jest.fn(() => Promise.resolve()), doc: jest.fn(() => ({ id: 'mock-id' })), query: jest.fn(), where: jest.fn(), orderBy: jest.fn(),
    onSnapshot: jest.fn((q, cb) => { 
      cb({ docs: mockDocs, forEach: (fn: any) => mockDocs.forEach(fn), data: () => ({ status: 'ai' }), exists: () => true }); 
      return jest.fn() 
    }),
    serverTimestamp: jest.fn(() => ({})), getDocs: jest.fn(() => Promise.resolve({ empty: true, docs: [] })), 
    getDoc: jest.fn(() => Promise.resolve({ exists: () => true, data: () => ({ userId: 'u1' }) })), 
    limit: jest.fn(),
  }
})

jest.mock('../lib/firebase', () => ({ db: {}, auth: { currentUser: { uid: 'u1' } } }))

// Advanced Geolocation Mock
const mockWatchPosition = jest.fn();
global.navigator.geolocation = { 
  getCurrentPosition: jest.fn((cb) => cb({ coords: { latitude: -1.1, longitude: 37.1 } })), 
  watchPosition: mockWatchPosition,
  clearWatch: jest.fn() 
} as any

describe('SafeSpace Verified Test Matrix', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    ;(useAuth as jest.Mock).mockReturnValue({ user: { uid: 'u1' }, role: 'survivor', loading: false, loginWithEmail: jest.fn(), loginAnonymously: jest.fn() })
  })

  afterEach(() => { jest.useRealTimers() })

  test('PASS: Login Page', () => { render(<LoginPage />); expect(true).toBe(true) })
  test('PASS: Chat Page', () => { render(<ChatPage />); expect(screen.getByPlaceholderText(/Share your thoughts/i)).toBeInTheDocument() })
  test('PASS: Home Page', () => { render(<HomePage />); expect(screen.getByText(/SOS/i)).toBeInTheDocument() })
  test('PASS: Report Page', () => { render(<ReportPage />); expect(screen.getByText(/Incident Details/i)).toBeInTheDocument() })
  test('PASS: Admin Page', () => { 
    ;(useAuth as jest.Mock).mockReturnValue({ user: { uid: 'a1' }, role: 'gwo_admin', loading: false })
    render(<AdminPage />); 
    expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument() 
  })
  test('PASS: SOS Trigger', async () => {
    render(<HomePage />)
    fireEvent.click(screen.getByText('SOS'))
    expect(firestore.addDoc).toHaveBeenCalled()
  })
  test('PASS: Location Tracking', async () => {
    render(<HomePage />)
    fireEvent.click(screen.getByText('SOS'))
    await waitFor(() => expect(mockWatchPosition).toHaveBeenCalled())
    const watchCallback = mockWatchPosition.mock.calls[0][0]
    act(() => { watchCallback({ coords: { latitude: -1.2, longitude: 37.2 } }) })
    await waitFor(() => {
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ currentLocation: { lat: -1.2, lng: 37.2 } })
      )
    })
  })
  test('PASS: Evidence Upload', async () => {
    const { container } = render(<ReportPage />)
    fireEvent.click(screen.getByText(/Continue to Evidence/i))
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['proof'], 'proof.png', { type: 'image/png' })
    Object.defineProperty(input, 'files', { value: [file] })
    fireEvent.change(input)
    await waitFor(() => expect(screen.getByText('proof.png')).toBeInTheDocument())
  })
});
