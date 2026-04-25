import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Download, Star, MessageSquare, ArrowUpRight } from 'lucide-react';

const API_URL = 'http://localhost:5001/api';

export default function App() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, positive: 0, avgScore: 0 });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/leads`);
      setLeads(data);
      
      const positiveCount = data.filter(l => l.sentiment === 'Positive').length;
      const avg = data.reduce((acc, curr) => acc + curr.lead_score, 0) / (data.length || 1);
      
      setStats({
        total: data.length,
        positive: positiveCount,
        avgScore: avg.toFixed(1)
      });
    } catch (error) {
      console.error("Failed to fetch leads", error);
    }
    setLoading(false);
  };

  const handleScrape = async () => {
    setLoading(true);
    try {
      await axios.get(`${API_URL}/scrape`);
      await fetchLeads();
    } catch (error) {
      console.error("Scrape failed", error);
    }
    setLoading(false);
  };

  const exportCSV = () => {
    const headers = ["Title", "Subreddit", "Author", "Sentiment", "Lead Score", "Category", "URL"];
    const rows = leads.map(l => [
      `"${l.title.replace(/"/g, '""')}"`, l.subreddit, l.author, l.sentiment, l.lead_score, l.category, l.url
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reddit_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => { fetchLeads(); }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reddit Lead Intelligence</h1>
            <p className="text-gray-500 mt-1">Live dynamic scraping & sentiment analysis</p>
          </div>
          <div className="flex gap-3">
            <button onClick={exportCSV} className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all font-medium text-sm text-gray-700 cursor-pointer">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </button>
            <button onClick={handleScrape} disabled={loading} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all font-medium text-sm disabled:opacity-50 cursor-pointer">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> 
              {loading ? 'Scraping...' : 'Run Live Scraper'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center transform transition-all hover:scale-105 duration-300">
            <p className="text-sm font-medium text-gray-500">High-Quality Leads</p>
            <p className="text-4xl font-bold text-gray-900 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center transform transition-all hover:scale-105 duration-300">
            <p className="text-sm font-medium text-gray-500">Avg Lead Score</p>
            <p className="text-4xl font-bold text-blue-600 mt-2">{stats.avgScore} <span className="text-lg text-gray-400 font-normal">/ 10</span></p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center transform transition-all hover:scale-105 duration-300">
            <p className="text-sm font-medium text-gray-500">Positive Sentiment</p>
            <p className="text-4xl font-bold text-green-500 mt-2">{stats.positive} <span className="text-lg text-gray-400 font-normal">posts</span></p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead Score</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Post Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category & Sentiment</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Engagement</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map((lead) => (
                <tr key={lead.lead_id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1 text-orange-600 font-bold bg-orange-50 px-3 py-1.5 rounded-full w-fit border border-orange-100">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{lead.lead_score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 max-w-md truncate">{lead.title}</div>
                    <div className="text-xs text-gray-500 mt-1">r/{lead.subreddit} • u/{lead.author}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{lead.category}</div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold mt-2
                      ${lead.sentiment === 'Positive' ? 'bg-green-100 text-green-800 border border-green-200' : 
                        lead.sentiment === 'Negative' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
                      {lead.sentiment}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded"><ArrowUpRight className="w-3 h-3 mr-1"/>{lead.upvotes}</span>
                      <span className="flex items-center text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded"><MessageSquare className="w-3 h-3 mr-1"/>{lead.comments_count}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href={lead.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors inline-flex items-center font-semibold">
                      View Post
                    </a>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && !loading && (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500 font-medium text-lg">No leads found. Run the scraper to fetch live data!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
