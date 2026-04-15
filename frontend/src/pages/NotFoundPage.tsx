import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-7xl font-bold text-indigo-600 font-mono mb-4">404</p>
        <h1 className="text-2xl text-slate-900 mb-2">Page not found</h1>
        <p className="text-slate-500 text-sm mb-8">
          The page you were looking for doesn't exist.
        </p>
        <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
      </div>
    </div>
  );
}
