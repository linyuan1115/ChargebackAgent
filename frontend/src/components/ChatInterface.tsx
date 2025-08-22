import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, DisputeCase } from '../types';
import { Send, Bot, User, AlertTriangle } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  disputes: DisputeCase[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, disputes }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Extract case details from the latest AI message that contains dispute data
  const getLatestCaseDetails = () => {
    const latestMessageWithData = [...messages].reverse().find(msg => 
      msg.type === 'agent' && msg.data && (msg.data.disputes || msg.data.highRiskDisputes)
    );
    
    if (!latestMessageWithData?.data) return null;
    
    return {
      disputes: latestMessageWithData.data.disputes || [],
      highRiskDisputes: latestMessageWithData.data.highRiskDisputes || []
    };
  };

  const caseDetails = getLatestCaseDetails();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: 'Analyze All Pending Cases', message: 'Please analyze all pending dispute cases' },
    { label: 'Show High Risk Cases', message: 'Show all high-risk dispute cases' },
    { label: 'Today\'s Dispute Statistics', message: 'Show today\'s dispute statistics' },
    { label: 'System Features Overview', message: 'Introduce the main features of the system' }
  ];

  const formatMessage = (content: string) => {
    // Simple markdown formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
  };

  const renderMessageContent = (message: ChatMessage) => {
    const formattedContent = formatMessage(message.content);
    
    return (
      <div className="space-y-3">
        <div 
          dangerouslySetInnerHTML={{ __html: formattedContent }}
          className="text-sm leading-relaxed"
        />
        {/* Case details are now moved to a separate section below the buttons */}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Simplified Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Bot className="h-8 w-8 text-primary-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Smart Assistant</h2>
            <p className="text-gray-600 mt-1">Professional dispute analysis and decision support</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-green-600">Online</span>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Pending Cases</div>
            <div className="text-xl font-bold text-primary-600">
              {disputes.filter(d => d.status === 'pending_risk_review').length}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">High Risk Cases</div>
            <div className="text-xl font-bold text-red-600">
              {disputes.filter(d => d.riskScore > 70).length}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Today's Processed</div>
            <div className="text-xl font-bold text-green-600">
              {disputes.filter(d => 
                new Date(d.updatedAt).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </div>
        </div>
      </div>

      {/* Compact Quick Actions */}
      <div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => onSendMessage(action.message)}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-primary-100 hover:text-primary-700 rounded-lg transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Case Details Section */}
      {caseDetails && (
        <div className="space-y-4">
          {/* Regular dispute cases */}
          {caseDetails.disputes && caseDetails.disputes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900">Case Analysis Results</h3>
              {caseDetails.disputes.slice(0, 3).map((dispute: DisputeCase) => (
                <div key={dispute.id} className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-sm text-gray-900">{dispute.caseNumber}</h4>
                      <p className="text-xs text-gray-600">${dispute.transaction.amount} - {dispute.customer.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Risk Score</div>
                      <div className={`text-sm font-medium ${
                        dispute.riskScore > 70 ? 'text-red-600' :
                        dispute.riskScore > 30 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {dispute.riskScore}/100
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      dispute.aiRecommendation === 'approve' ? 'bg-green-100 text-green-800' :
                      dispute.aiRecommendation === 'reject' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {dispute.aiRecommendation === 'approve' ? 'Recommend Approve' :
                       dispute.aiRecommendation === 'reject' ? 'Recommend Reject' : 'Needs Review'}
                    </span>
                    <button className="text-xs text-primary-600 hover:text-primary-800">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* High risk disputes */}
          {caseDetails.highRiskDisputes && caseDetails.highRiskDisputes.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                <span className="text-sm font-medium text-red-900">High Risk Case Alert</span>
              </div>
              <div className="space-y-2">
                {caseDetails.highRiskDisputes.slice(0, 3).map((dispute: DisputeCase) => (
                  <div key={dispute.id} className="text-xs text-red-700 bg-white rounded p-2">
                    <strong>{dispute.caseNumber}</strong>: ${dispute.transaction.amount} (Risk Score: {dispute.riskScore})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message Area */}
      <div className="h-96 card overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-3xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-3' : 'mr-3'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' ? 'bg-primary-600' : 'bg-gray-600'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>
                </div>

                {/* Message Content */}
                <div className={`rounded-lg px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {message.type === 'user' ? (
                    <p className="text-sm">{message.content}</p>
                  ) : (
                    renderMessageContent(message)
                  )}
                  <div className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-primary-200' : 'text-gray-500'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex mr-3">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t bg-gray-50 p-6">
          <div className="flex space-x-3">
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your question..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={1}
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!inputMessage.trim()}
              className="btn-primary flex items-center justify-center px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Press Enter to send message, Shift + Enter for new line
          </div>
        </div>
      </div>


    </div>
  );
};

export default ChatInterface;
