import { useState, type FormEvent } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TextField from '../components/common/TextField';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import type { UserRole } from '../types/auth.types';
import { roleHome } from '../routes/roleHome';

const roleLabel: Record<UserRole, string> = {
  ADMIN: 'Father / Owner',
  STAFF: 'Staff',
  TRANSPORTATION: 'Transportation',
};

const highlights = [
  'Purchases to farmer payments',
  'Live warehouse stock',
  'Sales & buyer ledger',
  'Real profit & loss',
];

// A dot-grid accent, the same idea as a typical marketplace hero banner
// — built from CSS only (no external image), so it stays crisp at any
// size and needs no asset to load.
const DotGrid = ({ className = '' }: { className?: string }) => (
  <div
    className={`grid grid-cols-4 gap-3 ${className}`}
    aria-hidden="true"
  >
    {Array.from({ length: 20 }).map((_, i) => (
      <span
        key={i}
        className={`h-2 w-2 rounded-full ${
          i % 3 === 0 ? 'bg-amber-400' : i % 3 === 1 ? 'bg-green-400' : 'bg-orange-400'
        }`}
      />
    ))}
  </div>
);

// A flat-illustration farm/warehouse scene — deliberately an icon-style
// graphic rather than a photo, so there's no real (or fake-real) person
// depicted, just a friendly visual anchor for the panel.
const FarmIllustration = () => (
  <svg viewBox="0 0 320 220" className="w-full h-auto" aria-hidden="true">
    <circle cx="256" cy="46" r="30" fill="#fbbf24" opacity="0.9" />
    <rect x="20" y="150" width="280" height="8" rx="4" fill="#166534" opacity="0.6" />
    {/* warehouse */}
    <path d="M40 150V96l38-26 38 26v54Z" fill="#15803d" />
    <path d="M40 96 78 70l38 26" stroke="#052e16" strokeWidth="4" fill="none" strokeLinejoin="round" />
    <rect x="66" y="118" width="24" height="32" fill="#052e16" opacity="0.4" />
    {/* grain sacks */}
    <g>
      <ellipse cx="150" cy="152" rx="26" ry="10" fill="#78350f" opacity="0.3" />
      <path d="M130 150c0-22 8-38 20-38s20 16 20 38Z" fill="#f59e0b" />
      <path d="M130 150h40" stroke="#78350f" strokeWidth="3" />
      <path d="M144 112h12l-3 8h-6Z" fill="#78350f" />
    </g>
    <g>
      <path d="M185 150c0-18 6-30 16-30s16 12 16 30Z" fill="#fbbf24" />
      <path d="M185 150h32" stroke="#78350f" strokeWidth="3" />
    </g>
    {/* leaf accents */}
    <path
      d="M235 150c-14-4-22-16-20-30 14 2 24 12 26 26"
      fill="#4ade80"
      opacity="0.85"
    />
    <path
      d="M255 150c10-6 15-18 11-31-12 4-20 15-19 29"
      fill="#22c55e"
      opacity="0.85"
    />
  </svg>
);

interface LoginPageProps {
  role: UserRole;
}

const LoginPage = ({ role }: LoginPageProps) => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Already signed in — go straight to that account's home instead of
  // showing a login form again.
  if (user) {
    return <Navigate to={roleHome[user.role]} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const loggedInUser = await login(email, password);

      // Same login API for every role — but the account must actually
      // match the role the person selected on the "Who are you?" screen.
      if (loggedInUser.role !== role) {
        logout();
        setError(`This account does not belong to ${roleLabel[role]}.`);
        return;
      }

      navigate(roleHome[loggedInUser.role], { replace: true });
    } catch {
      setError('Invalid username or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Staff and Transportation get a deliberately plain, large-button form
  // — no branding panel, no marketing copy, nothing to read.
  if (role !== 'ADMIN') {
    return (
      <div className="max-w-sm mx-auto mt-10 sm:mt-16 px-2">
        <div className="rounded-xl shadow-md border border-gray-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-1 text-center">
            {roleLabel[role]} Login
          </h2>
          <p className="text-sm text-gray-500 mb-6 text-center">
            Enter the username and password given to you.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <Alert type="error" message={error} />}

            <TextField
              label="Username"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="username"
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <Button type="submit" isLoading={isSubmitting} className="w-full mt-2 py-3 text-base">
              Login
            </Button>
          </form>

          <Link
            to="/role"
            className="block text-center text-sm text-gray-500 mt-6 hover:text-gray-700"
          >
            ← Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-6 sm:mt-14">
      <div className="grid grid-cols-1 md:grid-cols-2 rounded-xl shadow-md border border-gray-200 overflow-hidden bg-white">
        {/* Branding panel — hidden on small screens to keep the form
            front and center on mobile. */}
        <div className="hidden md:flex relative flex-col justify-between bg-gradient-to-br from-green-800 via-green-900 to-black text-white p-8 overflow-hidden">
          <DotGrid className="absolute top-6 right-6 opacity-90" />

          <div className="relative z-10">
            <span className="inline-block text-xs font-semibold tracking-wide uppercase bg-white/10 rounded-full px-3 py-1 mb-6">
              Agri Business Platform
            </span>
            <h2 className="text-3xl font-extrabold leading-tight mb-3">
              Run your whole crop
              <br />
              trading business.
            </h2>
            <p className="text-green-100 text-sm mb-6 max-w-xs">
              From farmer purchase to buyer payment — every record, tracked
              accurately, in one place.
            </p>
            <div className="flex flex-wrap gap-2">
              {highlights.map((h) => (
                <span
                  key={h}
                  className="text-xs font-medium bg-white/10 border border-white/20 rounded-full px-3 py-1"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-8">
            <FarmIllustration />
          </div>
        </div>

        {/* Form panel */}
        <div className="p-6 sm:p-8 flex flex-col justify-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Father / Owner Sign in</h2>
          <p className="text-sm text-gray-500 mb-6">Enter your account details to continue.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <Alert type="error" message={error} />}

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="username"
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <Button type="submit" isLoading={isSubmitting} className="w-full mt-2">
              Sign in
            </Button>
          </form>

          <Link
            to="/role"
            className="block text-center text-sm text-gray-400 mt-6 hover:text-gray-600"
          >
            ← Back to role selection
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
