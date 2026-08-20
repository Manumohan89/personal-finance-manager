import { Loader2 } from 'lucide-react';

const Spinner = ({ size = 20, className = '' }) => (
  <Loader2 size={size} className={`animate-spin text-primary-600 ${className}`} />
);

export default Spinner;
