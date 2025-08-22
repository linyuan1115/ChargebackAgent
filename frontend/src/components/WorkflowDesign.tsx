import React, { useState, Fragment } from 'react';
import { 
  Play, 
  Square, 
  Settings, 
  Plus, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Users,
  FileText,
  Mail,
  Database
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  name: string;
  type: 'start' | 'decision' | 'action' | 'end';
  description: string;
  status: 'active' | 'pending' | 'completed' | 'disabled';
  assignee?: string;
  timeLimit?: string;
  conditions?: string[];
}

interface WorkflowDesignProps {}

const WorkflowDesign: React.FC<WorkflowDesignProps> = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('chargeback-processing');
  const [isEditing, setIsEditing] = useState(false);

  // Sample workflow data
  const workflows = [
    {
      id: 'chargeback-processing',
      name: 'Chargeback Processing Workflow',
      description: 'Standard workflow for processing dispute cases',
      status: 'active',
      totalSteps: 7,
      avgProcessingTime: '3.2 days'
    },
    {
      id: 'fraud-investigation',
      name: 'Fraud Investigation Workflow',
      description: 'Specialized workflow for fraud and unauthorized transaction cases',
      status: 'active',
      totalSteps: 5,
      avgProcessingTime: '1.8 days'
    },
    {
      id: 'merchant-escalation',
      name: 'Merchant Escalation Workflow',
      description: 'Workflow for cases requiring merchant investigation',
      status: 'draft',
      totalSteps: 4,
      avgProcessingTime: '5.1 days'
    }
  ];

  const chargebackWorkflowSteps: WorkflowStep[] = [
    {
      id: 'start',
      name: 'Case Received',
      type: 'start',
      description: 'New chargeback case received from payment processor',
      status: 'completed',
      timeLimit: 'Immediate'
    },
    {
      id: 'ai-analysis',
      name: 'AI Analysis',
      type: 'action',
      description: 'Automated risk assessment using AI analysis engine',
      status: 'active',
      assignee: 'AI System',
      timeLimit: '< 1 minute'
    },
    {
      id: 'risk-decision',
      name: 'Risk Decision',
      type: 'decision',
      description: 'Classify case based on risk score and AI recommendation',
      status: 'pending',
      conditions: ['Risk Score > 70 → High Risk Path', 'Risk Score 30-70 → Manual Review', 'Risk Score < 30 → Auto Approve']
    },
    {
      id: 'manual-review',
      name: 'Manual Review',
      type: 'action',
      description: 'Human analyst reviews case details and evidence',
      status: 'pending',
      assignee: 'Dispute Analyst',
      timeLimit: '4 hours'
    },
    {
      id: 'final-decision',
      name: 'Final Decision',
      type: 'decision',
      description: 'Make final decision on dispute case',
      status: 'pending',
      conditions: ['Approve Refund', 'Reject Dispute', 'Send to Merchant', 'Escalate Investigation']
    },
    {
      id: 'notification',
      name: 'Notify Parties',
      type: 'action',
      description: 'Send notifications to customer, merchant, and internal teams',
      status: 'disabled',
      assignee: 'System',
      timeLimit: '5 minutes'
    },
    {
      id: 'end',
      name: 'Case Closed',
      type: 'end',
      description: 'Case processing completed and archived',
      status: 'disabled'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'disabled': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStepIcon = (type: string, status: string) => {
    if (status === 'completed') return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (status === 'active') return <Play className="h-5 w-5 text-blue-600" />;
    if (status === 'pending') return <Clock className="h-5 w-5 text-yellow-600" />;
    
    switch (type) {
      case 'start': return <Play className="h-5 w-5 text-gray-400" />;
      case 'decision': return <AlertTriangle className="h-5 w-5 text-gray-400" />;
      case 'action': return <Settings className="h-5 w-5 text-gray-400" />;
      case 'end': return <Square className="h-5 w-5 text-gray-400" />;
      default: return <Settings className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Workflow Design</h2>
            <p className="text-gray-600">Design and manage automated workflows for dispute processing</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Settings className="h-4 w-4 mr-2" />
              {isEditing ? 'Save Changes' : 'Edit Workflow'}
            </button>
            <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Plus className="h-4 w-4 mr-2" />
              New Workflow
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Workflow List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Workflows</h3>
            <div className="space-y-3">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  onClick={() => setSelectedWorkflow(workflow.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedWorkflow === workflow.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">{workflow.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      workflow.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {workflow.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">{workflow.description}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{workflow.totalSteps} steps</span>
                    <span>{workflow.avgProcessingTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Workflow Canvas */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Chargeback Processing Workflow</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Active</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Avg: 3.2 days</span>
                </div>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  <span>1,247 cases processed</span>
                </div>
              </div>
            </div>

            {/* Workflow Steps - Horizontal Layout */}
            <div className="overflow-x-auto">
              <div className="flex items-center space-x-4 pb-4" style={{ minWidth: 'max-content' }}>
                {chargebackWorkflowSteps.map((step, index) => (
                  <Fragment key={step.id}>
                    {/* Step Card */}
                    <div className={`flex-shrink-0 w-44 h-40 p-3 rounded-lg border ${getStatusColor(step.status)} ${
                      isEditing ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
                    } flex flex-col`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-shrink-0">
                          {getStepIcon(step.type, step.status)}
                        </div>
                        {isEditing && (
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <Settings className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      
                      <div className="mb-3">
                        <h4 className="font-medium text-gray-900 text-sm mb-1 h-6 flex items-center">{step.name}</h4>
                        <p className="text-xs text-gray-600 leading-tight">{step.description}</p>
                      </div>
                      
                      <div className="mt-auto space-y-1">
                        {step.assignee && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Users className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{step.assignee}</span>
                          </div>
                        )}
                        {step.timeLimit && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{step.timeLimit}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Connector Arrow */}
                    {index < chargebackWorkflowSteps.length - 1 && (
                      <div className="flex-shrink-0 flex items-center">
                        <ArrowRight className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>
            </div>



            {/* Workflow Statistics */}
            <div className="mt-8 grid grid-cols-1 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">1,247</div>
                <div className="text-sm text-blue-800">Cases Processed</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">94.2%</div>
                <div className="text-sm text-green-800">Success Rate</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">3.2</div>
                <div className="text-sm text-yellow-800">Avg Days</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">23</div>
                <div className="text-sm text-purple-800">Active Cases</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowDesign;
