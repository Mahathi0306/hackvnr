import React from 'react';
import moment from 'moment';

const ActivityTimeline = ({ logs }) => {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Activity Timeline</h3>
      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
        {logs.map((log, index) => (
          <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-blue-500 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
            </div>
            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between space-x-2 mb-1">
                <div className="font-bold text-slate-900 text-sm">{log.action}</div>
                <time className="font-caveat font-medium text-xs text-indigo-500">{moment(log.timestamp).format('MMM D, YYYY h:mm A')}</time>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityTimeline;
