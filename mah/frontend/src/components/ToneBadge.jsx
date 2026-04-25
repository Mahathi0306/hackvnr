import React from 'react';

const ToneBadge = ({ tone }) => {
  if (!tone) return null;

  let styles = "bg-gray-100 text-gray-800";
  let icon = "💬";

  const lowerTone = tone.toLowerCase();
  
  if (lowerTone.includes('casual')) {
    styles = "bg-blue-100 text-blue-800";
    icon = "😊";
  } else if (lowerTone.includes('formal')) {
    styles = "bg-purple-100 text-purple-800";
    icon = "🤝";
  } else if (lowerTone.includes('technical')) {
    styles = "bg-gray-700 text-white";
    icon = "💻";
  } else if (lowerTone.includes('empath')) {
    styles = "bg-pink-100 text-pink-800";
    icon = "💙";
  } else if (lowerTone.includes('budget')) {
    styles = "bg-green-100 text-green-800";
    icon = "💰";
  } else if (lowerTone.includes('linkedin')) {
    styles = "bg-indigo-100 text-indigo-800";
    icon = "🔵";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${styles}`}>
      <span className="mr-1">{icon}</span>
      {tone}
    </span>
  );
};

export default ToneBadge;
