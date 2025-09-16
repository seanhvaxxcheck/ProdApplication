import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { AuthError } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

interface AuthFormProps {
  mode: 'signin' | 'signup' | 'reset';
  onModeChange: (mode: 'signin' | 'signup' | 'reset') => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode, onModeChange }) => {
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Update page title based on mode
  React.useEffect(() => {
    const titles = {
      signin: 'Sign In - MyGlassCase',
      signup: 'Create Account - MyGlassCase', 
      reset: 'Reset Password - MyGlassCase'
    };
    document.title = titles[mode];
  }, [mode]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage('');
    setLoading(true);

    // Debug email input - check for invisible characters
    console.log('=== EMAIL DEBUG START ===');
    console.log('Raw email value:', email);
    console.log('Email JSON stringify:', JSON.stringify(email));
    console.log('Email length:', email.length);
    console.log('Email char codes:', Array.from(email).map(char => char.charCodeAt(0)));
    console.log('Email trimmed:', email.trim());
    console.log('Email trimmed length:', email.trim().length);
    console.log('Email toLowerCase:', email.toLowerCase());
    console.log('=== EMAIL DEBUG END ===');

    // Normalize email - trim whitespace and convert to lowercase
    const normalizedEmail = email.trim().toLowerCase();
    console.log('Normalized email:', normalizedEmail);
    console.log('Original vs normalized match:', email === normalizedEmail);

    console.log(`Starting ${mode} process for email:`, email);

    try {
      let result;
      if (mode === 'signin') {
        console.log('Attempting sign in...');
        result = await signIn(normalizedEmail, password);
      } else if (mode === 'signup') {
        console.log('Attempting sign up with full name:', fullName);
        result = await signUp(normalizedEmail, password, fullName);
      } else if (mode === 'reset') {
        console.log('Attempting password reset...');
        result = await resetPassword(normalizedEmail);
        if (!result?.error) {
          setMessage('Check your email for the password reset link');
          setLoading(false);
          return;
        }
      }

      console.log('Auth result:', result);

      if (result?.error) {
        console.error('Auth error:', result.error);
        throw result.error;
      }

      // Handle successful sign-up
      if (mode === 'signup' && result?.data?.user) {
        console.log('Sign-up successful, user created:', result.data.user.id);
       if (result.data.user.email_confirmed_at) {
  // Already confirmed somehow (rare, e.g., if using magic link)
  setMessage('Account created successfully! Redirecting to subscription plans...');
  setTimeout(() => navigate('/subscription'), 2000);
} else {
  // Normal case: must confirm email before logging in
  setMessage('Account created! Please check your email to confirm your account before signing in.');
  // No redirect yet
}

      }

    } catch (error: any) {
      console.error('Authentication error:', error);
      
      // Handle specific Supabase auth errors
      if (error?.message) {
        switch (error.message) {
          case 'Invalid login credentials':
            setError('Invalid email or password. Please check your credentials and try again.');
            break;
          case 'Email not confirmed':
            setError('Please check your email and click the confirmation link before signing in.');
            break;
          case 'User already registered':
            setError('An account with this email already exists. Please sign in instead.');
            break;
          case 'Password should be at least 6 characters':
            setError('Password must be at least 6 characters long.');
            break;
          case 'Invalid email':
            setError('Please enter a valid email address.');
            break;
          case 'Signup is disabled':
            setError('New user registration is currently disabled. Please contact support.');
            break;
          default:
            setError(error.message);
        }
      } else {
        setError(error?.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {mode === 'signin' && 'Welcome Back'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'reset' && 'Reset Password'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {mode === 'signin' && 'Sign in to access your collection'}
              {mode === 'signup' && 'Join thousands of collectors'}
              {mode === 'reset' && 'Enter your email to reset your password'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'signup' && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="Enter your password (min 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>
            )}

            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.includes('Check your email') 
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : message.includes('created successfully') || message.includes('Account created')
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {message}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              {loading ? 'Loading...' : (
                mode === 'signin' ? 'Sign In' :
                mode === 'signup' ? 'Create Account' :
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            {mode === 'signin' && (
              <>
                <button
                  onClick={() => onModeChange('reset')}
                  className="text-green-600 hover:text-green-500 text-sm font-medium transition-colors"
                >
                  Forgot your password?
                </button>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{' '}
                  <button
                    onClick={() => onModeChange('signup')}
                    className="text-green-600 hover:text-green-500 font-medium transition-colors"
                  >
                    Sign up
                  </button>
                </p>
              </>
            )}
            {mode === 'signup' && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <button
                  onClick={() => onModeChange('signin')}
                  className="text-green-600 hover:text-green-500 font-medium transition-colors"
                >
                  Sign in
                </button>
              </p>
            )}
            {mode === 'reset' && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Remember your password?{' '}
                <button
                  onClick={() => onModeChange('signin')}
                  className="text-green-600 hover:text-green-500 font-medium transition-colors"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};