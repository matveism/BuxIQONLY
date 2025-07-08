
import { useActivityLogs } from '@/hooks/useActivityLogs';

const ActivityLogs = () => {
  const { logs, loading } = useActivityLogs();

  if (loading) {
    return (
      <div className="card mb-6 h-48 overflow-hidden bg-card rounded-xl shadow-lg">
        <div className="p-4 h-full overflow-y-auto">
          <div className="text-center h-full flex items-center justify-center opacity-70 font-medium">
            <p>Loading activity logs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-6 h-48 overflow-hidden bg-card rounded-xl shadow-lg">
      <div className="p-4 h-full overflow-y-auto scrollbar-hide">
        {logs.length === 0 ? (
          <div className="text-center h-full flex items-center justify-center opacity-70 font-medium">
            <p>Your activity log will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 mb-2 bg-white/10 rounded-lg text-sm animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-red-600 rounded-full text-white">
                    <span className="text-sm font-bold">
                      {log.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{log.username}</div>
                  </div>
                </div>
                <div className="text-green-400 font-semibold">+${log.amount}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
