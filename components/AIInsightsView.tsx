import React, { useState } from 'react';
import { BrainCircuit, Send, Loader2, Lock } from 'lucide-react';
import { generateBusinessReport } from '../services/geminiService';
import { Subscription } from '../types';

// Mock data context to send to Gemini
const businessContext = JSON.stringify({
  revenue: 54230,
  expenses: 32000,
  activeCustomers: 1245,
  topSellingProduct: "Ergonomic Office Chair",
  lowStockItems: ["Wireless Mechanical Keyboard", "Noise Cancelling Headphones"],
  recentIssues: "Shipping delays in East Coast region"
});

interface AIInsightsViewProps {
  subscription?: Subscription;
}

const AIInsightsView: React.FC<AIInsightsViewProps> = ({ subscription }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Feature Gate Logic
  const isAccessDenied = subscription && subscription.tier !== 'Enterprise';

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isAccessDenied) return;

    setLoading(true);
    const result = await generateBusinessReport(businessContext, query);
    setResponse(result);
    setLoading(false);
  };

  if (isAccessDenied) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative">
        {/* Blurred Content Preview */}
        <div className="absolute inset-0 filter blur-sm bg-white/50 z-0 pointer-events-none">
           <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
             <div className="p-2 bg-indigo-600 text-white rounded-lg"><BrainCircuit size={24} /></div>
             <div><h2 className="text-xl font-bold text-slate-800">Nexus AI Assistant</h2></div>
           </div>
           <div className="p-6">
             <div className="h-32 bg-slate-100 rounded-xl mb-4 w-3/4"></div>
             <div className="h-32 bg-slate-100 rounded-xl w-1/2"></div>
           </div>
        </div>

        {/* Lock Overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
           <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-md text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Unlock AI Insights</h2>
              <p className="text-slate-600 mb-6">
                Upgrade to the <strong>Enterprise</strong> plan to access our powerful AI assistant for predictive analytics and automated reporting.
              </p>
              <button className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-lg transition-all transform hover:scale-105">
                Upgrade Plan
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
        <div className="p-2 bg-indigo-600 text-white rounded-lg">
          <BrainCircuit size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Nexus AI Assistant</h2>
          <p className="text-sm text-slate-500">Ask questions about your business data, generate reports, or get strategic advice.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/50">
        {/* Welcome State */}
        {!response && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
            <BrainCircuit size={64} className="opacity-20" />
            <p className="text-lg font-medium">Ready to analyze your ERP data.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
              <button onClick={() => setQuery("Generate a monthly revenue summary.")} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all text-left text-sm text-slate-600">
                "Generate a monthly revenue summary."
              </button>
              <button onClick={() => setQuery("Which products are low in stock?")} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all text-left text-sm text-slate-600">
                 "Which products are low in stock?"
              </button>
              <button onClick={() => setQuery("Draft an email to customers about shipping delays.")} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all text-left text-sm text-slate-600">
                "Draft an email about shipping delays."
              </button>
              <button onClick={() => setQuery("Analyze my profit margins.")} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all text-left text-sm text-slate-600">
                "Analyze my profit margins."
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-full space-y-4 animate-pulse">
            <Loader2 size={48} className="text-indigo-500 animate-spin" />
            <p className="text-slate-500 font-medium">Nexus AI is thinking...</p>
          </div>
        )}

        {/* Response State */}
        {response && !loading && (
          <div className="max-w-4xl mx-auto">
             <div className="bg-white p-8 rounded-2xl shadow-sm border border-indigo-100">
               <div className="prose prose-slate max-w-none">
                 <div dangerouslySetInnerHTML={{ __html: response }} />
               </div>
             </div>
             <div className="flex justify-end mt-4">
               <button 
                 onClick={() => setResponse(null)} 
                 className="text-slate-500 hover:text-slate-800 text-sm font-medium"
               >
                 Clear Chat
               </button>
             </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-slate-100 bg-white">
        <form onSubmit={handleAsk} className="relative max-w-4xl mx-auto">
          <input
            type="text"
            className="w-full pl-6 pr-16 py-4 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white shadow-sm transition-all"
            placeholder="Ask anything about your business..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!query.trim() || loading}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIInsightsView;