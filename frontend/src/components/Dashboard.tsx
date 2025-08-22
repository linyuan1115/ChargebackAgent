import React, { useState, useMemo } from 'react';
import { DisputeCase } from '../types';
import { AlertTriangle, Clock, TrendingUp, DollarSign, Filter, Calendar, Users, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface DashboardProps {
  disputes: DisputeCase[];
  onDisputeSelect: (dispute: DisputeCase) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ disputes, onDisputeSelect }) => {
  console.log('Dashboard received disputes:', disputes.length);
  console.log('Dashboard sample statuses:', disputes.slice(0, 5).map(d => d.status));
  
  // Time filter state
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'quarter'>('quarter');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  // Filter disputes based on time selection and sort by Created date (newest first)
  const filteredDisputes = useMemo(() => {
    const now = new Date();
    let startDate = new Date();

    switch (timeFilter) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setFullYear(now.getFullYear() - 1); // Show last year of data
        break;
    }

    // Apply all filters
    const filtered = disputes.filter(dispute => {
      const disputeDate = new Date(dispute.createdAt);
      
      // Time filter
      const passesTimeFilter = disputeDate >= startDate;
      
      // Category filter
      const passesCategoryFilter = categoryFilter === 'all' || dispute.category === categoryFilter;
      
      // Pending filter
      const passesPendingFilter = !showOnlyPending || dispute.status === 'pending' || dispute.status === 'review';
      
      return passesTimeFilter && passesCategoryFilter && passesPendingFilter;
    });

    console.log(`Time filter: ${timeFilter}, Category filter: ${categoryFilter}, Showing: ${filtered.length} of ${disputes.length} disputes`);
    
    return filtered.sort((a, b) => {
      // Sort by Created date in descending order (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [disputes, timeFilter, categoryFilter, showOnlyPending]);

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    console.log('Calculating stats for disputes:', filteredDisputes.length);
    console.log('Sample dispute structure:', filteredDisputes[0]);
    const totalAmount = filteredDisputes.reduce((sum, d) => {
      const amount = d.transaction?.amount || 0;
      return sum + amount;
    }, 0);
    const avgRiskScore = filteredDisputes.length > 0 
      ? Math.round(filteredDisputes.reduce((sum, d) => sum + d.riskScore, 0) / filteredDisputes.length)
      : 0;

    const result = {
      total: filteredDisputes.length,
      totalAmount,
      avgRiskScore,
      highRisk: filteredDisputes.filter(d => d.riskScore > 70).length,
      // Status breakdown - mapped to actual data status values
      pendingRiskReview: filteredDisputes.filter(d => d.status === 'pending').length,
      internalAnalyzing: filteredDisputes.filter(d => d.status === 'analyzing').length,
      merchantInvestigation: filteredDisputes.filter(d => d.status === 'review').length,
      representmentRaised: filteredDisputes.filter(d => d.aiRecommendation === 'reject' && d.riskScore > 70).length,
      admittedClosed: filteredDisputes.filter(d => d.aiRecommendation === 'approve' && d.riskScore < 40).length,
      representmentWinBack: filteredDisputes.filter(d => d.aiRecommendation === 'reject' && d.riskScore > 80).length,
      representmentLost: filteredDisputes.filter(d => d.aiRecommendation === 'approve' && d.riskScore < 30).length,
      // Category breakdown
      fraudCases: filteredDisputes.filter(d => d.category === 'FRAUD_UNAUTHORIZED').length,
      processingCases: filteredDisputes.filter(d => d.category === 'PROCESSING_ISSUES').length,
      merchantCases: filteredDisputes.filter(d => d.category === 'MERCHANT_MERCHANDISE').length,
    };
    
    console.log('Stats calculated:', result);
    return result;
  }, [filteredDisputes]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredDisputes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageDisputes = filteredDisputes.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [timeFilter, categoryFilter, showOnlyPending]);

  // Helper function to format category names for display
  const formatCategoryName = (category: string | undefined) => {
    if (!category) return 'N/A';
    switch (category) {
      case 'FRAUD_UNAUTHORIZED':
        return 'Fraud & Unauthorized';
      case 'PROCESSING_ISSUES':
        return 'Processing Issues';
      case 'MERCHANT_MERCHANDISE':
        return 'Merchandise Issues';
      default:
        return category.replace('_', ' ');
    }
  };

  // Chart data preparation
  const chartData = useMemo(() => {


    // Category breakdown for pie chart
    const categoryData = [
      { name: 'Fraud & Unauthorized', value: stats.fraudCases, color: '#ef4444', amount: filteredDisputes.filter(d => d.category === 'FRAUD_UNAUTHORIZED').reduce((sum, d) => sum + (d.transaction?.amount || 0), 0) },
      { name: 'Processing Issues', value: stats.processingCases, color: '#f59e0b', amount: filteredDisputes.filter(d => d.category === 'PROCESSING_ISSUES').reduce((sum, d) => sum + (d.transaction?.amount || 0), 0) },
      { name: 'Merchandise Issues', value: stats.merchantCases, color: '#10b981', amount: filteredDisputes.filter(d => d.category === 'MERCHANT_MERCHANDISE').reduce((sum, d) => sum + (d.transaction?.amount || 0), 0) }
    ];

    // Status breakdown for bar chart - New 7-phase timeline
    const statusData = [
      { name: 'Pending Risk Review', value: stats.pendingRiskReview, color: '#ef4444', timeline: '0-3 days' },
      { name: 'Internal Analyzing', value: stats.internalAnalyzing, color: '#f97316', timeline: '0-3 days' },
      { name: 'Merchant Investigation', value: stats.merchantInvestigation, color: '#eab308', timeline: '0-14 days' },
      { name: 'Representment Raised', value: stats.representmentRaised, color: '#3b82f6', timeline: '0-3 days' },
      { name: 'Admitted & Closed', value: stats.admittedClosed, color: '#6b7280', timeline: 'Final' },
      { name: 'Representment Win Back', value: stats.representmentWinBack, color: '#10b981', timeline: 'Final' },
      { name: 'Representment Lost', value: stats.representmentLost, color: '#dc2626', timeline: 'Final' }
    ];



    // Subcategory breakdown
    const subcategoryStats = filteredDisputes.reduce((acc, dispute) => {
      if (dispute.subcategory) {
        console.log('Found subcategory in dispute:', dispute.subcategory); // Debug log
        if (!acc[dispute.subcategory]) {
          acc[dispute.subcategory] = { count: 0, amount: 0, category: dispute.category };
        }
        acc[dispute.subcategory].count += 1;
        acc[dispute.subcategory].amount += dispute.transaction?.amount || 0;
      }
      return acc;
    }, {} as Record<string, { count: number; amount: number; category?: string }>);
    
    console.log('Subcategory stats:', subcategoryStats); // Debug log

    // Format subcategory data with enhanced display names and alphabetical sorting
    const subcategoryData = Object.entries(subcategoryStats).map(([name, data]) => {
      // Extract code and description from subcategory name
      const extractCodeAndDescription = (subcategory: string) => {
        console.log('Processing subcategory:', subcategory); // Debug log
        
        // Try different patterns to match subcategory codes
        const patterns = [
          /^(\d[A-Z])_(.+)$/,           // 1A_Card_Fraud
          /^(\d[A-Z])\s*-\s*(.+)$/,     // 1A - Card Fraud  
          /^(\d[A-Z])\s+(.+)$/,         // 1A Card Fraud
          /^(\d[A-Z])(.+)$/             // 1ACard_Fraud
        ];
        
        for (const pattern of patterns) {
          const match = subcategory.match(pattern);
          if (match) {
            const code = match[1];
            const description = match[2].replace(/_/g, ' ').trim();
            console.log(`Matched: ${code} - ${description}`); // Debug log
            return `${code} - ${description}`;
          }
        }
        
        // If no pattern matches, just clean up underscores and return as-is
        console.log('No pattern matched, returning:', subcategory.replace(/_/g, ' '));
        return subcategory.replace(/_/g, ' ');
      };

      const displayName = extractCodeAndDescription(name);
      return {
        name: displayName,
        cases: data.count,
        amount: data.amount,
        category: data.category,
        sortKey: displayName
      };
    }).sort((a, b) => {
      // Sort alphabetically by the full display name
      return a.sortKey.localeCompare(b.sortKey);
    });

    // Time series data
    const timeSeriesData = filteredDisputes.reduce((acc, dispute) => {
      const date = new Date(dispute.createdAt).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, cases: 0, amount: 0 };
      }
      acc[date].cases += 1;
      acc[date].amount += dispute.transaction?.amount || 0;
      return acc;
    }, {} as Record<string, { date: string; cases: number; amount: number }>);

    const timeSeriesArray = Object.values(timeSeriesData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      categoryData,
      statusData,
      subcategoryData,
      timeSeriesData: timeSeriesArray
    };
  }, [filteredDisputes, stats]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_risk_review': return 'bg-red-100 text-red-800';
      case 'internal_analyzing': return 'bg-orange-100 text-orange-800';
      case 'merchant_investigation': return 'bg-yellow-100 text-yellow-800';
      case 'representment_raised': return 'bg-blue-100 text-blue-800';
      case 'admitted_closed': return 'bg-gray-100 text-gray-800';
      case 'representment_win_back': return 'bg-green-100 text-green-800';
      case 'representment_lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_risk_review': return 'Pending Risk Review';
      case 'internal_analyzing': return 'Internal Analyzing';
      case 'merchant_investigation': return 'Merchant Investigation';
      case 'representment_raised': return 'Representment Raised';
      case 'admitted_closed': return 'Admitted & Closed';
      case 'representment_win_back': return 'Representment Win Back';
      case 'representment_lost': return 'Representment Lost';
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-10">
        {/* Title Section - Centered */}
        <div className="py-12 mb-16 border-b border-gray-100" style={{textAlign: 'center', marginTop: '2rem'}}>
          <h2 className="text-4xl font-bold text-gray-900 mb-6" style={{textAlign: 'center', margin: '0 auto'}}>
            Chargeback Analytics Dashboard
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed mb-4" style={{textAlign: 'center', margin: '0 auto'}}>
            Real-time monitoring and analysis of dispute cases
          </p>
          <br />
        </div>
        
        {/* Key Metrics Overview */}
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-8 text-center" style={{lineHeight: '1.5cm'}}>Key Metrics Overview</h3>
          
          {/* All Elements in One Line */}
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {/* Total Chargeback Cases */}
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stats.total}</div>
              <div className="text-sm font-semibold text-gray-700">Total Chargeback Cases</div>
            </div>
            
            {/* 1.5cm Wide Blank Space */}
            <div style={{width: '1.5cm'}}></div>
            
            {/* Total Chargeback Amount */}
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">${stats.totalAmount.toLocaleString()}</div>
              <div className="text-sm font-semibold text-gray-700">Total Chargeback Amount</div>
            </div>
            
            {/* 1.5cm Wide Blank Space */}
            <div style={{width: '1.5cm'}}></div>
            
            {/* Time Period Filter */}
            <div className="flex items-center gap-3" style={{minWidth: '300px', width: '300px'}}>
              <Calendar className="h-5 w-5 text-gray-500 flex-shrink-0" />
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap flex-shrink-0" style={{whiteSpace: 'nowrap'}}>Time&nbsp;Period:</label>
              <select 
                value={timeFilter} 
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-shrink-0"
                style={{minWidth: '140px'}}
              >
                <option value="today">Today</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
              </select>
            </div>
            
            {/* 1.5cm Wide Blank Space */}
            <div style={{width: '1.5cm'}}></div>
            
            {/* Category Filter */}
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Category:</label>
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="FRAUD_UNAUTHORIZED">Fraud & Unauthorized</option>
                <option value="PROCESSING_ISSUES">Processing Issues</option>
                <option value="MERCHANT_MERCHANDISE">Merchandise Issues</option>
              </select>
            </div>
            
            {/* 1.5cm Wide Blank Space */}
            <div style={{width: '1.5cm'}}></div>
            
            {/* Pending Review Toggle */}
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Show Only:</label>
              <button
                onClick={() => setShowOnlyPending(!showOnlyPending)}
                className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                  showOnlyPending
                    ? 'bg-orange-100 border-orange-300 text-orange-700'
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showOnlyPending ? 'Pending Review Only' : 'All Cases'}
              </button>
            </div>
          </div>
          
          {/* 1cm Blank Line */}
          <div style={{height: '1cm'}}></div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="space-y-6">
        
        <div style={{height: '1cm'}}></div>
        
        {/* Top Row: Cases by Category and Time Trends */}
        <div className="grid grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cases by Category</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData.categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name.split(' & ')[0]} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                >
                  {chartData.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [
                  `${value} cases`, 
                  props.payload.name,
                  `$${props.payload.amount.toLocaleString()}`
                ]} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Category Details */}
            <div className="mt-4 space-y-2">
              {chartData.categoryData.map((category, index) => (
                <div key={index} className="flex items-center text-sm" style={{height: 'calc(1em + 0.2cm)', minHeight: 'calc(1em + 0.2cm)'}}>
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                  <div className="font-medium" style={{width: '200px'}}>{category.name}:</div>
                  <div style={{width: '0.5cm'}}></div>
                  <div className="font-semibold" style={{width: '80px'}}>{category.value} cases</div>
                  <div style={{width: '0.5cm'}}></div>
                  <div className="text-gray-500" style={{width: '100px'}}>${category.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Received Chargeback Amount */}
          <div className="card">
            <div style={{height: '1cm'}}></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Daily Received Chargeback Amount</h3>
            <div className="flex justify-center items-center" style={{minHeight: '300px'}}>
              <div style={{width: '90%'}}>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={10} />
                    <YAxis tickFormatter={(value) => '$' + value.toLocaleString()} />
                    <Tooltip formatter={(value, name) => [
                      '$' + Number(value).toLocaleString(),
                      'Daily Amount'
                    ]} />
                    <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{height: '1cm'}}></div>

        {/* Second Row: Subcategory Analysis (Full Width) */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subcategory Analysis</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart 
              data={chartData.subcategoryData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.toString()}
              />
              <Tooltip 
                formatter={(value) => [`${value} cases`, 'Cases']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #d1d5db' }}
              />
              <Bar 
                dataKey="cases" 
                fill="#3b82f6"
                stroke="#1e40af"
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{height: '1cm'}}></div>

      {/* Processing Pipeline */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Pipeline</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart 
            data={chartData.statusData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            barCategoryGap="30%"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toString()}
            />
            <Tooltip 
              formatter={(value) => [`${value} cases`, 'Cases']}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #d1d5db' }}
            />
            <Bar 
              dataKey="value" 
              fill="#3b82f6"
              stroke="#1e40af"
              strokeWidth={1}
            />
          </BarChart>
        </ResponsiveContainer>
        </div>

      <div style={{height: '1cm'}}></div>

      {/* Recent Cases Table */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Dispute Cases</h3>
          <div className="text-sm text-gray-500">
            Showing {Math.min(filteredDisputes.length, 10)} of {filteredDisputes.length} filtered cases
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-1/8 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Case</th>
                <th className="w-1/8 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="w-1/8 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sub Category</th>
                <th className="w-1/8 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="w-1/8 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                <th className="w-1/8 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="w-1/8 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="w-1/8 px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPageDisputes.map((dispute) => (
                <tr key={dispute.id} className="hover:bg-gray-50">
                  <td className="w-1/8 px-4 py-4 whitespace-nowrap text-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{dispute.caseNumber}</div>
                      <div className="text-xs text-gray-500">{dispute.customer.name}</div>
                    </div>
                  </td>
                  <td className="w-1/8 px-4 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">{formatCategoryName(dispute.category)}</div>
                  </td>
                  <td className="w-1/8 px-4 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-500">{dispute.subcategory?.replace('_', ' ') || 'N/A'}</div>
                  </td>
                  <td className="w-1/8 px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    ${dispute.transaction.amount.toLocaleString()}
                  </td>
                  <td className="w-1/8 px-4 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center mx-auto">
                      <span className="text-sm text-gray-900 mr-2">{dispute.riskScore}</span>
                      <div className="w-12 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            dispute.riskScore > 70 ? 'bg-red-500' : 
                            dispute.riskScore > 30 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${dispute.riskScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="w-1/8 px-4 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(dispute.status)}`}>
                                                       {getStatusLabel(dispute.status)}
                    </span>
                  </td>
                  <td className="w-1/8 px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    {new Date(dispute.createdAt).toLocaleDateString()}
                  </td>
                  <td className="w-1/8 px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    <button
                      onClick={() => onDisputeSelect(dispute)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Analyze →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Debug Info */}
        <div className="bg-gray-100 px-4 py-2 text-sm text-gray-600">
          Debug: {filteredDisputes.length} total disputes, {totalPages} pages, current page {currentPage}
        </div>
        
        {/* Simple Pagination Controls - Always Visible */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, filteredDisputes.length)}</span> of{' '}
              <span className="font-medium">{filteredDisputes.length}</span> results
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium text-gray-700">Page</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= totalPages) {
                    setCurrentPage(page);
                  }
                }}
                className="w-16 px-2 py-1 text-center text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">of {totalPages}</span>
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
