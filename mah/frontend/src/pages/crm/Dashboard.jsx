import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RefreshCw, Filter, LogOut, CheckCircle2 } from 'lucide-react';
import KanbanColumn from '../../components/KanbanColumn';

const Dashboard = () => {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState('');
  const [scrapeResult, setScrapeResult] = useState('');
  
  const [filterPlatform, setFilterPlatform] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [sortBy, setSortBy] = useState('Latest');

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const statsRes = await axios.get('http://localhost:5000/api/crm/leads/stats', { headers });
      setStats(statsRes.data);

      const params = new URLSearchParams();
      if (filterPlatform !== 'All') params.append('platform', filterPlatform);
      if (filterStatus !== 'All Status') params.append('status', filterStatus);
      if (sortBy !== 'Latest') params.append('sort', sortBy);

      const leadsRes = await axios.get(`http://localhost:5000/api/crm/leads?${params.toString()}`, { headers });
      setLeads(leadsRes.data);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterPlatform, filterStatus, sortBy]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const startScrape = async () => {
    setScraping(true);
    setScrapeStatus('Scraping Reddit & LinkedIn...');
    setScrapeResult('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/crm/scrape', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setScrapeResult(`✅ Reddit: +${res.data.reddit.added} new | LinkedIn: +${res.data.linkedin.added} new | ${res.data.reddit.skipped + res.data.linkedin.skipped} skipped`);
      fetchData();
    } catch (error) {
      setScrapeResult('❌ Error during scrape.');
      console.error(error);
    } finally {
      setScraping(false);
      setScrapeStatus('');
      // Hide toast after 5 seconds
      setTimeout(() => setScrapeResult(''), 5000);
    }
  };

  const filteredLeads = leads; // Already filtered by backend
  
  const newLeads = filteredLeads.filter(l => l.status === 'New');
  const draftedLeads = filteredLeads.filter(l => l.status === 'Drafted');
  const contactedLeads = filteredLeads.filter(l => l.status === 'Contacted');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* HEADER BAR */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 font-bold text-white p-2 rounded-lg leading-none">
            CRM
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Lead Gen Platform</h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <span>Logged in as <span className="text-blue-600">{user.username}</span></span>
          <button onClick={handleLogout} className="flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6">
        {/* STATS ROW */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
              <div className="text-slate-500 text-sm font-medium">Total Leads</div>
              <div className="text-3xl font-black text-slate-800 mt-2">{stats.total}</div>
              <div className="text-xs text-slate-400 mt-2">
                Reddit: {stats.reddit_count} &middot; LinkedIn: {stats.linkedin_count}
              </div>
            </div>
            <div className="bg-blue-50/50 rounded-xl p-5 shadow-sm border border-blue-100 flex flex-col justify-between">
              <div className="text-blue-600 text-sm font-medium uppercase tracking-wide">New</div>
              <div className="text-3xl font-black text-blue-700 mt-2">{stats.new}</div>
            </div>
            <div className="bg-purple-50/50 rounded-xl p-5 shadow-sm border border-purple-100 flex flex-col justify-between">
              <div className="text-purple-600 text-sm font-medium uppercase tracking-wide">Drafted</div>
              <div className="text-3xl font-black text-purple-700 mt-2">{stats.drafted}</div>
            </div>
            <div className="bg-emerald-50/50 rounded-xl p-5 shadow-sm border border-emerald-100 flex flex-col justify-between">
              <div className="text-emerald-600 text-sm font-medium uppercase tracking-wide">Contacted</div>
              <div className="text-3xl font-black text-emerald-700 mt-2">{stats.contacted}</div>
            </div>
          </div>
        )}

        {/* CONTROLS ROW */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {['All', 'Reddit', 'LinkedIn'].map(p => (
                <button
                  key={p}
                  onClick={() => setFilterPlatform(p)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterPlatform === p ? 'bg-white text-slate-800 shadow shadow-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {p}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-1.5 bg-white">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                className="text-sm border-none bg-transparent outline-none text-slate-700 font-medium"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All Status">All Status</option>
                <option value="New">New</option>
                <option value="Drafted">Drafted</option>
                <option value="Contacted">Contacted</option>
              </select>
            </div>

            <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-1.5 bg-white">
              <span className="text-sm text-slate-400 font-medium">Sort by:</span>
              <select 
                className="text-sm border-none bg-transparent outline-none text-slate-700 font-medium"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="Latest">Latest</option>
                <option value="Highest Intent">Highest Intent</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {scrapeResult && (
              <div className="animate-in fade-in slide-in-from-right-4 px-4 py-2 bg-slate-800 text-emerald-400 text-sm font-medium rounded-lg shadow-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {scrapeResult}
              </div>
            )}
            
            <button
              onClick={startScrape}
              disabled={scraping}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-75 disabled:cursor-wait shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${scraping ? 'animate-spin text-blue-400' : ''}`} />
              {scraping ? scrapeStatus : 'Scrape Reddit + LinkedIn'}
            </button>
          </div>
        </div>

        {/* KANBAN BOARD */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <KanbanColumn 
              title="New" 
              leads={newLeads} 
              bgClass="bg-blue-100/50 text-blue-800 border-b border-blue-200" 
            />
            <KanbanColumn 
              title="Drafted" 
              leads={draftedLeads} 
              bgClass="bg-purple-100/50 text-purple-800 border-b border-purple-200" 
            />
            <KanbanColumn 
              title="Contacted" 
              leads={contactedLeads} 
              bgClass="bg-emerald-100/50 text-emerald-800 border-b border-emerald-200" 
            />
          </div>
        )}
        
        {loading && (
          <div className="flex justify-center items-center py-20 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
