import { useState } from 'react';
import { Bell, CheckCircle2, Info, Clock, Check } from 'lucide-react';

const InstituteERPNotifications = () => {
  // Mock data for notifications matching the Functional Spec events
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'Alert', event: 'Approval', title: 'Institute Approved', message: 'Your institute application has been approved by the Academic Board. You can now create courses.', time: '2 hours ago', read: false, icon: CheckCircle2, color: 'emerald' },
    { id: 2, type: 'Info', event: 'Payment', title: 'Payment Receipt Generated', message: 'Receipt for your recent remittance (UTR123456789) has been generated successfully.', time: '1 day ago', read: false, icon: Info, color: 'blue' },
    { id: 3, type: 'Alert', event: 'Exam', title: 'Exam Schedule Published', message: 'The Academic Board has published the exam schedule for MD Emergency Medicine 2023 batch.', time: '2 days ago', read: true, icon: Clock, color: 'amber' },
    { id: 4, type: 'Info', event: 'Results', title: 'Results Published', message: 'Examination results for the recent semester are now available to download.', time: '1 week ago', read: true, icon: Bell, color: 'slate' },
    { id: 5, type: 'Info', event: 'Revaluation', title: 'Revaluation Completed', message: 'Revaluation process for Dr. Vikram Singh has been completed.', time: '2 weeks ago', read: true, icon: CheckCircle2, color: 'slate' },
  ]);

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true, color: 'slate' } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true, color: 'slate' })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center relative">
            <Bell className="w-6 h-6 text-primary-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">System Notifications</h2>
            <p className="text-sm text-slate-500 mt-1">View alerts and updates from the Academic Board.</p>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors border border-slate-200"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
        {notifications.length > 0 ? (
          notifications.map((notification) => {
            const Icon = notification.icon;
            
            // Generate color classes based on notification type/read status
            const colorClasses = {
              emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
              blue: 'bg-blue-50 text-blue-600 border-blue-100',
              amber: 'bg-amber-50 text-amber-600 border-amber-100',
              slate: 'bg-slate-50 text-slate-500 border-slate-100'
            };

            return (
              <div 
                key={notification.id} 
                className={`p-5 sm:p-6 transition-colors duration-300 flex gap-4 ${notification.read ? 'bg-white' : 'bg-primary-50/30'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border flex-shrink-0 ${colorClasses[notification.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1">
                    <h4 className={`text-sm font-bold truncate ${notification.read ? 'text-slate-700' : 'text-slate-900'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider whitespace-nowrap">
                      {notification.time}
                    </span>
                  </div>
                  
                  <p className={`text-sm mt-1 ${notification.read ? 'text-slate-500' : 'text-slate-700 font-medium'}`}>
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center gap-3 mt-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500">
                      {notification.event}
                    </span>
                    {!notification.read && (
                      <button 
                        onClick={() => markAsRead(notification.id)}
                        className="text-[11px] font-bold text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="p-12 text-center text-slate-500">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm">You have no new notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstituteERPNotifications;
