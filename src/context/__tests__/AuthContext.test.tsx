import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock Firebase Auth
const mockOnAuthStateChanged = jest.fn();
const mockSignInWithPopup = jest.fn();
const mockSignOut = jest.fn();
const mockSetDoc = jest.fn();
const mockGetDoc = jest.fn();

jest.mock('../../lib/firebase', () => ({
  auth: {},
  signInWithGooglePopup: mockSignInWithPopup,
  signOutFirebase: mockSignOut,
  db: {},
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: mockOnAuthStateChanged,
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: mockSetDoc,
  getDoc: mockGetDoc,
  serverTimestamp: jest.fn(),
}));

const TestComponent = () => {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <div data-testid="user">{user ? user.displayName : 'No user'}</div>
      <button onClick={signInWithGoogle}>Sign In</button>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDoc.mockResolvedValue({ exists: () => false });
  });

  it('should provide loading state initially', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should handle user authentication state', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Simulate auth state change
    const unsubscribe = mockOnAuthStateChanged.mock.calls[0][0];
    await unsubscribe(mockUser);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });
  });

  it('should handle sign out', async () => {
    mockSignOut.mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const signOutButton = screen.getByText('Sign Out');
    signOutButton.click();

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});

