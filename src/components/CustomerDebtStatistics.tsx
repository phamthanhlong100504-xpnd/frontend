import { useEffect, useState } from 'react';
import { statisticsApi } from '../api/client';
import type { CustomerDebtStatistic, DebtStatisticContract } from '../types';
import '../styles/CustomerDebtStatistics.css';

export default function CustomerDebtStatistics() {
  const [items, setItems] = useState<CustomerDebtStatistic[]>([]);
  const [filteredItems, setFilteredItems] = useState<CustomerDebtStatistic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedContract, setExpandedContract] = useState<string | null>(null);

  // Search filters
  const [customerName, setCustomerName] = useState('');
  const [minDebt, setMinDebt] = useState('');
  const [maxDebt, setMaxDebt] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const formatCurrency = (value: number) =>
    value.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('vi-VN');
  };

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('vi-VN');
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await statisticsApi.getOutstandingDebtDetail({
          fromDate: null,
          endDate: null,
          minDebt: null,
          maxDebt: null,
        });
        if (response.code === 200) {
          setItems(response.data.customerStatistics || []);
          setFilteredItems(response.data.customerStatistics || []);
        } else {
          setError(response.message || 'Không thể tải dữ liệu thống kê dư nợ');
        }
      } catch (err) {
        setError('Lỗi kết nối tới máy chủ thống kê');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter function
  const handleFilter = () => {
    let filtered = items;

    // Filter by customer name
    if (customerName) {
      filtered = filtered.filter(item => 
        item.customerName.toLowerCase().includes(customerName.toLowerCase())
      );
    }

    // Filter by min debt
    if (minDebt) {
      filtered = filtered.filter(item => item.totalDebt >= parseFloat(minDebt));
    }

    // Filter by max debt
    if (maxDebt) {
      filtered = filtered.filter(item => item.totalDebt <= parseFloat(maxDebt));
    }

    // Filter by date range - filter contracts instead of removing customers
    if (fromDate || toDate) {
      filtered = filtered.map(item => {
        const filteredContracts = item.contracts.filter(contract => {
          const contractDate = new Date(contract.signDate);

          if (fromDate) {
            const from = new Date(fromDate);
            if (contractDate < from) return false;
          }

          if (toDate) {
            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);
            if (contractDate > to) return false;
          }

          return true;
        });

        return {
          ...item,
          contracts: filteredContracts,
        };
      });
    }

    setFilteredItems(filtered);
  };

  // Clear filters
  const handleClearFilters = () => {
    setCustomerName('');
    setMinDebt('');
    setMaxDebt('');
    setFromDate('');
    setToDate('');
    setFilteredItems(items);
  };

  const toggleContractDetails = (contractIndex: number, customerName: string) => {
    const key = `${customerName}-contract-${contractIndex}`;
    setExpandedContract(expandedContract === key ? null : key);
  };

  if (loading) return <div className="loading">Đang tải thống kê dư nợ...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="debt-statistics-container">
      <h3>Thống Kê Dư Nợ Khách Hàng</h3>

      {/* Search Filters */}
      <div className="debt-filter-section">
        <div className="filter-group">
          <label htmlFor="customerName">Tên khách hàng:</label>
          <input
            id="customerName"
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nhập tên khách hàng"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="minDebt">Tổng dư nợ từ (VNĐ):</label>
          <input
            id="minDebt"
            type="number"
            value={minDebt}
            onChange={(e) => setMinDebt(e.target.value)}
            placeholder="Nhập số tiền tối thiểu"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="maxDebt">Tổng dư nợ đến (VNĐ):</label>
          <input
            id="maxDebt"
            type="number"
            value={maxDebt}
            onChange={(e) => setMaxDebt(e.target.value)}
            placeholder="Nhập số tiền tối đa"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="fromDate">Từ ngày:</label>
          <input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="toDate">Đến ngày:</label>
          <input
            id="toDate"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <button className="btn-search" onClick={handleFilter}>
            Tìm kiếm
          </button>
          <button className="btn-clear" onClick={handleClearFilters}>
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="no-data">
          {items.length === 0 ? 'Chưa có dữ liệu thống kê dư nợ' : 'Không tìm thấy kết quả phù hợp'}
        </div>
      ) : (
        <div className="debt-statistics-list">
          <p className="result-count">Tìm thấy {filteredItems.length} khách hàng</p>
          {filteredItems.map((item, index) => (
            <div className="debt-customer-card" key={`${item.customerName}-${index}`}>
              <div className="debt-customer-header">
                <div>
                  <h4>{item.customerName}</h4>
                  <p>{item.customerPhone}</p>
                </div>
                <div className="debt-total-badge">
                  Tổng dư nợ: {formatCurrency(item.totalDebt)} VNĐ
                </div>
              </div>

              <div className="debt-summary-grid">
                <div className="summary-item">
                  <span>Gốc còn lại</span>
                  <strong>{formatCurrency(item.totalPrincipleRemaining)} VNĐ</strong>
                </div>
                <div className="summary-item">
                  <span>Lãi còn lại</span>
                  <strong>{formatCurrency(item.totalInterestRemaining)} VNĐ</strong>
                </div>
                <div className="summary-item">
                  <span>Phạt</span>
                  <strong>{formatCurrency(item.totalPenalty)} VNĐ</strong>
                </div>
                <div className="summary-item">
                  <span>Quá hạn</span>
                  <strong>{formatCurrency(item.totalOverdue)} VNĐ</strong>
                </div>
              </div>

              <div className="debt-contracts">
                <h5>Chi tiết theo hợp đồng ({item.contracts.length})</h5>
                {item.contracts.map((contract: DebtStatisticContract, contractIndex: number) => {
                  const contractKey = `${item.customerName}-contract-${contractIndex}`;
                  const isExpanded = expandedContract === contractKey;

                  return (
                    <div key={contractKey} className="debt-contract-item">
                      <div
                        className="contract-headline clickable"
                        onClick={() => toggleContractDetails(contractIndex, item.customerName)}
                      >
                        <div className="contract-title">
                          <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                            ▶
                          </span>
                          <span>HĐ #{contractIndex + 1}</span>
                          <span>Ký ngày: {formatDate(contract.signDate)}</span>
                        </div>
                      </div>
                      <div className="contract-stats">
                        <span>Dư nợ: {formatCurrency(contract.debt)} VNĐ</span>
                        <span>Gốc còn: {formatCurrency(contract.principleRemaining)} VNĐ</span>
                        <span>Lãi còn: {formatCurrency(contract.interestRemaining)} VNĐ</span>
                      </div>

                      {/* Expanded Payment Schedule Details */}
                      {isExpanded && (
                        <div className="contract-details-expanded">
                          <h6>Lịch thanh toán chi tiết</h6>
                          <div className="schedule-table">
                            <div className="table-header">
                              <div className="table-cell">Kỳ</div>
                              <div className="table-cell">Ngày đến hạn</div>
                              <div className="table-cell">Lãi phải trả</div>
                              <div className="table-cell">Gốc phải trả</div>
                              <div className="table-cell">Phạt</div>
                              <div className="table-cell">Quá hạn</div>
                              <div className="table-cell">Trạng thái</div>
                              <div className="table-cell">Lãi đã trả</div>
                              <div className="table-cell">Gốc đã trả</div>
                            </div>
                            {contract.loanPaymentSchedules.map((schedule, scheduleIndex) => (
                              <div key={scheduleIndex} className="table-row">
                                <div className="table-cell">{schedule.termNo}</div>
                                <div className="table-cell">
                                  {formatDateTime(schedule.dueDate)}
                                </div>
                                <div className="table-cell">
                                  {formatCurrency(schedule.interestDue)} VNĐ
                                </div>
                                <div className="table-cell">
                                  {formatCurrency(schedule.principalDue)} VNĐ
                                </div>
                                <div className="table-cell">
                                  {formatCurrency(schedule.penaltyFee)} VNĐ
                                </div>
                                <div className="table-cell">
                                  {formatCurrency(schedule.overdueInterest)} VNĐ
                                </div>
                                <div className={`table-cell status-${schedule.status.toLowerCase()}`}>
                                  {schedule.status}
                                </div>
                                <div className="table-cell">
                                  {formatCurrency(schedule.interestPaid)} VNĐ
                                </div>
                                <div className="table-cell">
                                  {formatCurrency(schedule.principlePaid)} VNĐ
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
