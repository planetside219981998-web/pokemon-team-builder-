interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
      {message && <p className="text-sm text-slate-400">{message}</p>}
    </div>
  );
}
