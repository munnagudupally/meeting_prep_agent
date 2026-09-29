import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-indigo-400">
        <AlertCircle className="w-10 h-10" />
      </div>
      <h1 className="text-2xl font-bold text-white">404 - Page Not Found</h1>
      <p className="text-sm text-slate-400 max-w-sm">
        The briefing dossier or meeting memory resource you requested could not be located.
      </p>
      <Link to="/">
        <Button variant="secondary" size="md" leftIcon={<Home className="w-4 h-4" />}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};
