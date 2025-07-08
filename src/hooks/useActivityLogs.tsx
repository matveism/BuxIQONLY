
import { useState, useEffect } from 'react';

interface ActivityLog {
  username: string;
  amount: string;
}

export const useActivityLogs = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3p3daAnCETfJtrUUvaiNqoUreYkn9FIHus6rEyq-e8E8oLaV51L_NrVWjHp1CyTv3UqBqryq3aH-0/pub?gid=0&single=true&output=csv');
      const data = await response.text();
      const rows = data.trim().split('\n').slice(1); // skip header

      const activityLogs: ActivityLog[] = [];
      rows.forEach(row => {
        const cols = row.split(',').map(c => c.trim());
        if (cols.length >= 7 && cols[2] && cols[6]) {
          activityLogs.push({
            username: cols[2],
            amount: parseFloat(cols[6]).toFixed(2)
          });
        }
      });

      setLogs(activityLogs.reverse()); // Show newest first
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return { logs, loading, refetchLogs: fetchLogs };
};
