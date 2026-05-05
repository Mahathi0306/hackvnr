import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api';
import moment from 'moment';
import { ArrowLeft, ExternalLink, Mail, Send, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import ActivityTimeline from '../../components/ActivityTimeline';
import ToneBadge from '../../components/ToneBadge';

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [genSteps, setGenSteps] = useState('');
  
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const fetchLead = async () => {
    try {
      const token = localStorage.getItem('token');
      // In a real app we might fetch just one lead, but here we can just reuse the leads list API or create a route
      // Wait, there's no GET /leads/:id route specified in the prompt!
      // But we can just fetch all and filter by ID
      const res = await api.get('/crm/leads', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const foundLead = res.data.find(l => l._id === id);
      if (foundLead) {
        setLead(foundLead);
        if (foundLead.generated_email) {
          const lines = foundLead.generated_email.split('\n');
          if (lines[0].startsWith('Subject:')) {
            setEmailSubject(lines[0].replace('Subject:', '').trim());
            setEmailBody(lines.slice(1).join('\n').trim());
          } else {
             setEmailSubject(foundLead.detected_tone ? `Re: Your post on ${foundLead.platform}` : 'About your post');
             setEmailBody(foundLead.generated_email);
          }
        }
      } else {
        navigate('/crm/dashboard');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
  }, [id]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenSteps('Analyzing writing style...');
    
    // Simulate steps for UI
    const steps = [
      'Detecting communication tone...',
      'Crafting personalized email...',
      'Finalizing...'
    ];
    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setGenSteps(steps[stepIdx]);
        stepIdx++;
      } else {
        clearInterval(interval);
      }
    }, 1500);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`http://localhost:5000/api/crm/leads/${id}/generate-email`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      clearInterval(interval);
      setEmailSubject(res.data.subject);
      setEmailBody(res.data.body);
      
      // Refresh lead to get new status/activity
      await fetchLead();
    } catch (err) {
      clearInterval(interval);
      alert(err.response?.data?.message || 'Error generating email');
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/crm/leads/${id}/send`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchLead();
    } catch (err) {
      alert('Error sending email');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><RefreshCw className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (!lead) return null;

  const isNew = lead.status === 'New';
  const isDrafted = lead.status === 'Drafted';
  const isContacted = lead.status === 'Contacted';

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-[1200px] mx-auto">
        
        <button 
          onClick={() => navigate('/crm/dashboard')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* LEFT COLUMN - LEAD INFO (60%) */}
          <div className="lg:col-span-3 space-y-6">
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {lead.platform === 'Reddit' ? 
                      <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide flex items-center gap-1">🟠 Reddit</span> : 
                      <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide flex items-center gap-1">🔵 LinkedIn</span>
                    }
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                      {lead.platform === 'LinkedIn' ? lead.full_name || lead.username : lead.username}
                    </h2>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm mt-3">
                    <span className="text-slate-500">{moment(lead.post_date).format('MMM D, YYYY')}</span>
                    <span className="flex items-center gap-1.5 font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      Intent Score: 
                      <span className={lead.intent_score >= 8 ? 'text-emerald-600' : lead.intent_score >= 5 ? 'text-amber-500' : 'text-red-500'}>
                        {lead.intent_score}/10 {lead.intent_score >= 8 ? '🟢' : lead.intent_score >= 5 ? '🟡' : '🔴'}
                      </span>
                    </span>
                  </div>
                  {lead.intent_reason && (
                    <div className="mt-2 text-sm text-slate-600 italic bg-slate-50 p-2 rounded-md border border-slate-100">
                      "{lead.intent_reason}"
                    </div>
                  )}
                </div>
                
                {lead.post_url && (
                  <a 
                    href={lead.post_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline text-sm font-semibold bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    View Original <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="p-6 bg-slate-50">
                <div className="uppercase tracking-wider text-xs font-bold text-slate-400 mb-3">Post Content</div>
                <div className="bg-white p-5 rounded-lg shadow-inner border border-slate-200 text-slate-800 leading-relaxed font-serif whitespace-pre-wrap">
                  "{lead.post_content}"
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <ActivityTimeline logs={lead.activity_log} />
            </div>

          </div>

          {/* RIGHT COLUMN - EMAIL GENERATOR (40%) */}
          <div className="lg:col-span-2">
            
            {isNew && !generating && (
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white h-full flex flex-col justify-center items-center text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">AI Email Generator</h3>
                <p className="text-indigo-100 mb-8 max-w-sm">
                  Let AI analyze this {lead.platform} post and draft a perfectly personalized cold outreach email.
                </p>
                <button 
                  onClick={handleGenerate}
                  className="bg-white text-indigo-600 hover:bg-slate-50 font-bold px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all flex items-center gap-2 w-full justify-center group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">✨</span> Generate Personalized Email
                </button>
              </div>
            )}

            {generating && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 h-full flex flex-col justify-center items-center text-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-indigo-100 rounded-full"></div>
                  <div className="w-20 h-20 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute inset-0"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">✨</div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-800 text-lg">AI is writing...</h3>
                  <p className="text-indigo-600 font-medium animate-pulse">{genSteps}</p>
                </div>
              </div>
            )}

            {(isDrafted || isContacted) && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                
                {isContacted && (
                  <div className="bg-emerald-50 border-b border-emerald-100 p-4 flex items-center gap-3">
                    <div className="bg-emerald-500 rounded-full p-1.5 text-white">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-emerald-800">Email dispatched successfully!</div>
                      <div className="text-xs text-emerald-600 mt-0.5">Status changed to Contacted</div>
                    </div>
                  </div>
                )}
                
                <div className="p-5 border-b border-slate-100 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700">Detected Tone:</span>
                    <ToneBadge tone={lead.detected_tone} />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subject</label>
                    <input 
                      type="text" 
                      value={emailSubject}
                      onChange={e => setEmailSubject(e.target.value)}
                      disabled={isContacted}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500 transition-shadow"
                    />
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Body</label>
                  <textarea 
                    value={emailBody}
                    onChange={e => setEmailBody(e.target.value)}
                    disabled={isContacted}
                    className="w-full h-full min-h-[300px] p-4 border border-slate-300 rounded-xl text-slate-800 leading-relaxed resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-600"
                  />
                </div>

                {!isContacted && (
                  <div className="p-5 border-t border-slate-100 bg-slate-50">
                    <button 
                      onClick={handleSend}
                      disabled={sending}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      {sending ? 'Sending...' : 'Send Email'}
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};

export default LeadDetail;
