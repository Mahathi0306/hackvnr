import React from 'react';
import LeadCard from './LeadCard';

const KanbanColumn = ({ title, leads, bgClass }) => {
  return (
    <div className={`flex flex-col bg-gray-50/50 rounded-xl border border-gray-200 overflow-hidden`}>
      <div className={`px-4 py-3 font-bold text-gray-700 flex justify-between items-center ${bgClass}`}>
        <span className="uppercase tracking-wider text-sm">{title}</span>
        <span className="bg-white/50 text-gray-800 rounded-full px-2 py-0.5 text-xs">{leads.length}</span>
      </div>
      <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[500px]">
        {leads.map(lead => (
          <LeadCard key={lead._id} lead={lead} />
        ))}
        {leads.length === 0 && (
          <div className="text-center text-gray-400 py-8 text-sm italic">
            No leads in this column
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
