import { useState } from 'react';
import type { Customer } from '../types';
import { customerApi } from '../api/client';
import '../styles/SearchCustomer.css';

interface SearchCustomerProps {
  onCustomerSelect: (customer: Customer) => void;
}

export default function SearchCustomer({ onCustomerSelect }: SearchCustomerProps) {
  const [searchType, setSearchType] = useState<'name' | 'cccd'>('name');
  const [searchValue, setSearchValue] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setError('Vui lòng nhập từ khóa tìm kiếm');
      return;
    }

    setLoading(true);
    setError('');
    setCustomers([]);

    try {
      const params = searchType === 'name' ? { name: searchValue } : { cccd: searchValue };
      const response = await customerApi.search(params);

      if (response.code === 200) {
        setCustomers(response.data);
        if (response.data.length === 0) {
          setError('Không tìm thấy khách hàng');
        }
      } else {
        setError(response.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setError('Lỗi kết nối tới máy chủ');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-customer-container">
      <h2>Tìm Kiếm Khách Hàng</h2>

      <div className="search-form">
        <div className="form-group">
          <label htmlFor="search-type-select">Loại tìm kiếm:</label>
          <select
            id="search-type-select"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as 'name' | 'cccd')}
          >
            <option value="name">Tìm theo tên</option>
            <option value="cccd">Tìm theo CCCD</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            {searchType === 'name' ? 'Nhập tên khách hàng:' : 'Nhập số CCCD:'}
          </label>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={searchType === 'name' ? 'VD: Nguyen Van A' : 'VD: 036204015333'}
          />
        </div>

        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Đang tìm...' : 'Tìm Kiếm'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {customers.length > 0 && (
        <div className="customers-list">
          <h3>Kết quả tìm kiếm ({customers.length})</h3>
          {customers.map((customer) => (
            <div key={customer.id} className="customer-card">
              <div className="customer-info">
                <p>
                  <strong>Tên:</strong> {customer.fullName}
                </p>
                <p>
                  <strong>Điện thoại:</strong> {customer.phoneNumber}
                </p>
                {customer.cccd && (
                  <p>
                    <strong>CCCD:</strong> {customer.cccd}
                  </p>
                )}
                {customer.creditScore !== undefined && (
                  <p>
                    <strong>Điểm tín dụng:</strong> {customer.creditScore}
                  </p>
                )}
                <p>
                  <strong>Trạng thái:</strong> <span className="status">{customer.status}</span>
                </p>
              </div>
              <button onClick={() => onCustomerSelect(customer)} className="select-btn">
                Chọn Khách Hàng
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
