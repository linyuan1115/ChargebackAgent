import React, { useState, useEffect } from 'react';
import { DisputeCase, ChatMessage } from './types';
import Dashboard from './components/Dashboard';
import DisputeAnalyzer from './components/DisputeAnalyzer';
import ChatInterface from './components/ChatInterface';
import WorkflowDesign from './components/WorkflowDesign';
import { demoDisputes } from './data/demoData';

// API configuration
const API_BASE_URL = 'http://localhost:5002/api';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'analyzer' | 'chat' | 'workflow'>('dashboard');
  const [disputes, setDisputes] = useState<DisputeCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<DisputeCase | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'agent',
      content: 'Hello! I\'m the intelligent dispute analysis assistant. I can help you analyze dispute cases, assess risks, and provide processing recommendations. How can I assist you today?',
      timestamp: new Date().toISOString()
    }
  ]);

  // API functions
  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/disputes`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('API Data received:', data.length, 'disputes');
      console.log('Sample status values:', data.slice(0, 3).map((d: any) => d.status));
      setDisputes(Array.isArray(data) ? data : data.disputes || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch disputes:', err);
      // Fallback to demo data if API fails
      setDisputes(demoDisputes);
      setError('Using demo data - backend connection failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorySummary = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/summary`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Failed to fetch category summary:', err);
      return null;
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleDisputeSelect = (dispute: DisputeCase) => {
    setSelectedDispute(dispute);
    setCurrentView('analyzer');
  };

  const handleUpdateDispute = (updatedDispute: DisputeCase) => {
    setDisputes(prev => prev.map(d => d.id === updatedDispute.id ? updatedDispute : d));
    setSelectedDispute(updatedDispute);
  };

  const handleNewMessage = (message: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);

    // Simulate AI reply
    setTimeout(() => {
      const agentResponse = generateAgentResponse(message, disputes);
      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: agentResponse.content,
        timestamp: new Date().toISOString(),
        data: agentResponse.data
      };
      setChatMessages(prev => [...prev, agentMessage]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Intelligent Dispute Management System</h1>
            </div>
            <div className="flex space-x-8">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  currentView === 'dashboard'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('analyzer')}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  currentView === 'analyzer'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Case Analysis
              </button>
              <button
                onClick={() => setCurrentView('workflow')}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  currentView === 'workflow'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Workflow Design
              </button>
              <button
                onClick={() => setCurrentView('chat')}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  currentView === 'chat'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                AI Assistant
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto py-2 sm:px-6 lg:px-8">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
            <div className="ml-4">
              <p className="text-lg font-medium text-gray-900">Loading dispute cases...</p>
              <p className="text-sm text-gray-500">Fetching data from backend</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-md bg-yellow-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Connection Notice</h3>
                <p className="text-sm text-yellow-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}



        {!loading && currentView === 'dashboard' && (
          <Dashboard 
            disputes={disputes} 
            onDisputeSelect={handleDisputeSelect}
          />
        )}
        {!loading && currentView === 'analyzer' && (
          <DisputeAnalyzer 
            dispute={selectedDispute}
            onUpdateDispute={handleUpdateDispute}
          />
        )}
        {!loading && currentView === 'chat' && (
          <ChatInterface 
            messages={chatMessages}
            onSendMessage={handleNewMessage}
            disputes={disputes}
          />
        )}
        {!loading && currentView === 'workflow' && (
          <WorkflowDesign />
        )}
      </main>
    </div>
  );
}

// Function to generate AI responses
function generateAgentResponse(message: string, disputes: DisputeCase[]) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('analyze') || lowerMessage.includes('case')) {
    const pendingDisputes = disputes.filter(d => d.status === 'pending' || d.status === 'analyzing');
    return {
      content: `I found ${pendingDisputes.length} pending dispute cases. Let me analyze them for you:\n\n` +
        pendingDisputes.slice(0, 5).map(d => 
          `📋 Case ${d.caseNumber}\n` +
          `💰 Amount: $${d.transaction.amount}\n` +
          `🎯 Risk Score: ${d.riskScore}/100\n` +
          `📊 Category: ${d.category?.replace('_', ' ') || 'N/A'}\n` +
          `💡 Recommendation: ${d.aiRecommendation === 'approve' ? 'Approve' : d.aiRecommendation === 'reject' ? 'Reject' : 'Manual Review'}\n`
        ).join('\n'),
      data: { disputes: pendingDisputes.slice(0, 5) }
    };
  }
  
  if (lowerMessage.includes('risk') || lowerMessage.includes('score')) {
    const highRiskDisputes = disputes.filter(d => d.riskScore > 70);
    return {
      content: `Currently there are ${highRiskDisputes.length} high-risk cases requiring attention. High-risk cases typically include the following characteristics:\n\n` +
        `🚨 Abnormal transaction amounts\n` +
        `🚨 Multiple customer dispute history\n` +
        `🚨 Insufficient or suspicious evidence\n` +
        `🚨 High merchant risk level\n\n` +
        `Recommend prioritizing these cases.`,
      data: { highRiskDisputes }
    };
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('function')) {
    return {
      content: `I can provide the following assistance:\n\n` +
        `🔍 **Intelligent Analysis**: Automatically analyze risk levels of dispute cases\n` +
        `📊 **Data Insights**: Provide dispute trend and pattern analysis\n` +
        `💡 **Decision Recommendations**: Give processing suggestions based on AI algorithms\n` +
        `⚡ **Quick Queries**: Rapidly find specific cases or statistical information\n` +
        `📋 **Workflow Guidance**: Guide you through standard processing procedures\n\n` +
        `You can ask me questions about specific cases or request analysis of the overall situation.`,
      data: null
    };
  }
  
  return {
    content: 'I understand your inquiry. Let me analyze the current dispute situation for you, please wait a moment...',
    data: null
  };
}

export default App;