import React from 'react';
import moment from 'moment';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LeadCard = ({ lead }) => {
  const navigate = useNavigate();

  const getPlatformBadge = () => {
    if (lead.platform === 'Reddit') return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">🟠 Reddit</span>;
    return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">🔵 LinkedIn</span>;
  };

  const getIntentBadge = () => {
    const score = lead.intent_score;
    if (score >= 8) return <span className="text-green-600 font-bold ml-auto text-xs flex items-center gap-1">Intent: {score} 🟢</span>;
    if (score >= 5) return <span className="text-yellow-600 font-bold ml-auto text-xs flex items-center gap-1">Intent: {score} 🟡</span>;
    return <span className="text-red-600 font-bold ml-auto text-xs flex items-center gap-1">Intent: {score} 🔴</span>;
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-2 mb-3" onClick={() => navigate(`/crm/lead/${lead._id}`)}>
      <div className="flex items-center justify-between">
        {getPlatformBadge()}
        {getIntentBadge()}
      </div>
      <div className="font-semibold text-gray-800 text-sm truncate">
        {lead.platform === 'LinkedIn' ? lead.full_name || lead.username : lead.username}
      </div>
      <div className="text-xs text-gray-500">
        {moment(lead.post_date).format('MMM D, YYYY')}
      </div>
      <div className="text-gray-600 text-sm line-clamp-2 italic border-l-2 border-gray-200 pl-2">
        "{lead.post_content}"
      </div>
      <div className="text-right text-blue-600 text-xs font-semibold mt-1 flex items-center justify-end gap-1 group">
        View <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};

export default LeadCard;
