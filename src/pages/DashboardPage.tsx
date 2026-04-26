import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  Calendar, 
  ChevronDown, 
  ArrowUpRight, 
  ArrowDownRight,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Coffee
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';

const DashboardPage = () => {
  const [filter, setFilter] = useState('today');
  const [dateRange, setDateRange] = useState({
    start: startOfDay(new Date()),
    end: endOfDay(new Date())
  });
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async (start: Date, end: Date) => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/orders/reports', {
        params: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let start = new Date();
    let end = new Date();

    switch (filter) {
      case 'today':
        start = startOfDay(new Date());
        end = endOfDay(new Date());
        break;
      case 'yesterday':
        start = startOfDay(subDays(new Date(), 1));
        end = endOfDay(subDays(new Date(), 1));
        break;
      case 'last7days':
        start = startOfDay(subDays(new Date(), 6));
        end = endOfDay(new Date());
        break;
      case 'thisMonth':
        start = startOfMonth(new Date());
        end = endOfMonth(new Date());
        break;
      case 'lastMonth':
        start = startOfMonth(subMonths(new Date(), 1));
        end = endOfMonth(subMonths(new Date(), 1));
        break;
    }

    setDateRange({ start, end });
    fetchReports(start, end);
  }, [filter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (isLoading && !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 overflow-y-auto h-full no-scrollbar pb-24 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1">Thống kê</h1>
          <p className="text-slate-500 font-medium tracking-wide text-xs">
            {format(dateRange.start, 'dd/MM/yyyy')} - {format(dateRange.end, 'dd/MM/yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative group">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            >
              <option value="today">Hôm nay</option>
              <option value="yesterday">Hôm qua</option>
              <option value="last7days">7 ngày qua</option>
              <option value="thisMonth">Tháng này</option>
              <option value="lastMonth">Tháng trước</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <DollarSign size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Doanh thu</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mb-1">{formatCurrency(data?.summary?.total || 0)}</p>
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
            <ArrowUpRight size={12} />
            <span>+12.5% so với kỳ trước</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <ShoppingBag size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <ShoppingBag size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đơn hàng</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mb-1">{data?.summary?.count || 0}</p>
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
            <ArrowUpRight size={12} />
            <span>+8.2% so với kỳ trước</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Users size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Khách hàng</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mb-1">{data?.summary?.count || 0}</p>
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
            <ArrowUpRight size={12} />
            <span>Đang tăng trưởng</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <DollarSign size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tb. Đơn</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mb-1">
            {formatCurrency(data?.summary?.count > 0 ? (data.summary.total / data.summary.count) : 0)}
          </p>
          <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600">
            <ArrowDownRight size={12} />
            <span>-2.1% so với kỳ trước</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tighter uppercase italic">Biểu đồ doanh thu</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hiệu suất kinh doanh theo thời gian</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Doanh thu</span>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.daily || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="_id" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  tickFormatter={(val) => format(new Date(val), 'dd/MM')}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 800 }}
                  formatter={(val: number) => [formatCurrency(val), 'Doanh thu']}
                  labelFormatter={(label) => format(new Date(label), 'EEEE, dd/MM/yyyy', { locale: vi })}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Payment Methods */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-900 border border-slate-100">
               <PieChartIcon size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tighter uppercase italic line-none">Phương thức</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phân bổ nguồn thu</p>
            </div>
          </div>

          <div className="h-[200px] w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.paymentMethods || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="revenue"
                  nameKey="_id"
                >
                  {(data?.paymentMethods || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 800 }}
                  formatter={(val: number) => [formatCurrency(val), 'Doanh thu']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            {(data?.paymentMethods || []).map((method: any, index: number) => (
              <div key={method._id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-sm font-bold text-slate-700">{method._id === 'TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">{formatCurrency(method.revenue)}</p>
                  <p className="text-[10px] font-bold text-slate-400">{((method.revenue / data.summary.total) * 100).toFixed(1)}%</p>
                </div>
              </div>
            ))}
            {(!data?.paymentMethods || data.paymentMethods.length === 0) && (
              <p className="text-center text-slate-400 text-sm italic py-4">Chưa có dữ liệu thanh toán</p>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
                 <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tighter uppercase italic">Sản phẩm bán chạy</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top 5 mặt hàng phổ biến nhất</p>
              </div>
            </div>
            <BarChartIcon className="text-slate-200" size={24} />
          </div>

          <div className="space-y-6">
            {(data?.topProducts || []).map((product: any, index: number) => (
              <div key={product._id} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-sm font-black text-slate-400 border border-slate-100 italic">
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-black text-slate-800">{product._id}</span>
                    <span className="text-xs font-bold text-slate-500">{product.quantity} món</span>
                  </div>
                  <div className="w-full bg-slate-50 h-2.5 rounded-full overflow-hidden border border-slate-100">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(product.revenue / data?.topProducts[0]?.revenue) * 100}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-slate-900">{formatCurrency(product.revenue)}</p>
                </div>
              </div>
            ))}
            {(!data?.topProducts || data.topProducts.length === 0) && (
              <p className="text-center text-slate-400 text-sm italic py-10">Chưa có dữ liệu sản phẩm</p>
            )}
          </div>
        </motion.div>

        {/* Statistical summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 p-8 rounded-[32px] shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <Coffee size={120} className="text-white" />
          </div>

          <div className="relative z-10">
            <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic mb-6">Tổng kết báo cáo</h3>
            
            <div className="grid grid-cols-2 gap-10">
              <div className="space-y-8">
                <div>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Hiệu suất tổng</p>
                  <p className="text-white font-medium text-sm leading-relaxed">
                    Hệ thống ghi nhận <span className="font-black text-white px-1 bg-emerald-600 rounded">+{data?.summary?.count}</span> giao dịch thành công. 
                    Doanh thu bình quân mỗi đơn hàng đạt <span className="font-black underline decoration-emerald-500 underline-offset-4">{formatCurrency(data?.summary?.count > 0 ? (data.summary.total / data.summary.count) : 0)}</span>.
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Kênh thanh toán</p>
                  <p className="text-white font-medium text-sm leading-relaxed">
                    {data?.paymentMethods?.length > 0 ? (
                      `Phương thức phổ biến nhất là ${data.paymentMethods[0]?._id === 'TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}, chiếm ${(data.paymentMethods[0]?.count / data.summary.count * 100).toFixed(0)}% tổng số lượng đơn.`
                    ) : 'Chưa có thông tin thanh toán cho kỳ này.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
                <Calendar className="text-emerald-500 mb-2" size={32} />
                <p className="text-white font-black text-3xl tracking-tighter">{data?.summary?.count}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Đơn hoàn tất</p>
                <div className="mt-6 w-full h-1 bg-emerald-500/20 rounded-full overflow-hidden">
                   <div className="w-[75%] h-full bg-emerald-500"></div>
                </div>
                <p className="text-[9px] font-bold text-slate-400 mt-2">75% chỉ tiêu tuần</p>
              </div>
            </div>

            <button className="mt-10 w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/50 flex items-center justify-center gap-2 group">
              Xuất báo cáo PDF
              <ArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
