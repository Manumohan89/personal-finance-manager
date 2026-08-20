import { Inbox } from 'lucide-react';

const EmptyState = ({ icon: Icon = Inbox, title, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
      <Icon size={26} className="text-gray-400" />
    </div>
    <p className="text-gray-500 dark:text-gray-400 mb-4">{title}</p>
    {action}
  </div>
);

export default EmptyState;
