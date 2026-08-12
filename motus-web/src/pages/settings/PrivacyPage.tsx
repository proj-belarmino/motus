import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <header className="sticky top-0 z-50 flex items-center border-b border-border bg-surface/90 px-6 py-4 backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 rounded-full p-2 hover:bg-surface-hover"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold">Privacy & Data</h1>
      </header>
      <main className="mx-auto max-w-3xl p-6 md:p-10">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm flex flex-col items-center justify-center text-center py-20">
          <Shield className="h-16 w-16 text-primary mb-4" />
          <h2 className="mb-2 text-2xl font-semibold">Nyco ama dados</h2>
          <p className="text-muted max-w-md">
            Mas Nyco sabe que dados não devem ser consumidos indiscriminadamente.
          </p>
        </div>
      </main>
    </div>
  );
}
