interface AlertProps {
  type: 'success' | 'error' | 'warning';
  message: string;
}

const styles: Record<AlertProps['type'], string> = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
};

const Alert = ({ type, message }: AlertProps) => {
  return (
    <div className={`rounded-md border px-4 py-3 text-sm ${styles[type]}`}>{message}</div>
  );
};

export default Alert;
