import { useState, useEffect } from 'react';
import type { LoanPaymentSchedule } from '../types';
import { customerApi } from '../api/client';
import '../styles/PaymentSchedule.css';

interface PaymentScheduleProps {
  customerId: string;
  contractId: string;
  onPaymentComplete: () => void;
}

export default function PaymentSchedule({
  customerId,
  contractId,
  onPaymentComplete,
}: PaymentScheduleProps) {
  const [schedules, setSchedules] = useState<LoanPaymentSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paying, setPaying] = useState(false);
  const [showAllSchedules, setShowAllSchedules] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');

    const fetchData = async () => {
      try {
        const response = await customerApi.getPaymentSchedule(customerId, contractId);
        if (response.code === 200) {
          // Sắp xếp theo số kỳ tăng dần (Kỳ 2, 3, 4, ...)
          const sortedSchedules = response.data.sort((a, b) => a.termNo - b.termNo);
          setSchedules(sortedSchedules);
          if (sortedSchedules.length > 0) {
            setSelectedScheduleId(sortedSchedules[0].id);
          }
        } else {
          setError(response.message || 'Không thể tải lịch thanh toán');
        }
      } catch (err) {
        setError('Lỗi kết nối tới máy chủ');
  console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customerId, contractId]);

  const getPenaltyDue = (schedule: LoanPaymentSchedule) =>
    schedule.penaltyDue ?? schedule.penaltyFee ?? 0;

  const getOverduePrinciple = (schedule: LoanPaymentSchedule) =>
    schedule.overduePrinciple ?? 0;

  const handlePayment = async () => {
    if (!selectedScheduleId || !paymentAmount.trim()) {
      setError('Vui lòng chọn kỳ thanh toán và nhập số tiền');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Số tiền thanh toán phải lớn hơn 0');
      return;
    }

    // Tính tổng tiền còn phải trả
    const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId);
    if (!selectedSchedule) {
      setError('Không tìm thấy kỳ thanh toán');
      return;
    }

    const totalRemaining =
      (selectedSchedule.principalDue +
        selectedSchedule.interestDue +
        getPenaltyDue(selectedSchedule) +
        selectedSchedule.overdueInterest +
        getOverduePrinciple(selectedSchedule)) -
      (selectedSchedule.principlePaid + selectedSchedule.interestPaid);

    // Validate số tiền không được vượt quá tổng còn phải trả
    if (amount > totalRemaining) {
      setError(
        `Số tiền thanh toán không được vượt quá ${formatCurrency(totalRemaining)} VNĐ (tổng còn phải trả)`
      );
      return;
    }

    setPaying(true);
    setError('');

    try {
      const response = await customerApi.executePayment(customerId, {
        scheduleId: selectedScheduleId,
        amount,
      });

      if (response.code === 200) {
        setPaymentAmount('');
        setError('');
        alert('Thanh toán thành công!');
        // Reload schedules
        const updatedResponse = await customerApi.getPaymentSchedule(customerId, contractId);
        if (updatedResponse.code === 200) {
          setSchedules(updatedResponse.data);
        }
        onPaymentComplete();
      } else {
        setError(response.message || 'Thanh toán thất bại');
      }
    } catch (err) {
      setError('Lỗi kết nối tới máy chủ');
      console.error(err);
    } finally {
      setPaying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return '#28a745';
      case 'PARTIALLY_PAID':
        return '#ffc107';
      case 'PENDING':
        return '#dc3545';
      case 'OVERDUE':
        return '#e83e8c';
      default:
        return '#6c757d';
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  if (loading) return <div className="loading">Đang tải lịch thanh toán...</div>;

  return (
    <div className="payment-schedule-container">
      <h3>Thanh Toán</h3>

      {error && <div className="error-message">{error}</div>}

      {schedules.length === 0 ? (
        <div className="no-data">Không có lịch thanh toán</div>
      ) : (
        <>
          <div className="schedules-list">
            {(showAllSchedules ? schedules : schedules.slice(0, 1)).map((schedule) => (
              <div
                key={schedule.id}
                className={`schedule-card ${selectedScheduleId === schedule.id ? 'selected' : ''}`}
                onClick={() => setSelectedScheduleId(schedule.id)}
              >
                <div className="schedule-header">
                  <div>
                    <h4>Kỳ {schedule.termNo}</h4>
                    <p className="due-date">Hạn thanh toán: {schedule.dueDate}</p>
                  </div>
                  <div
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(schedule.status) }}
                  >
                    {schedule.status}
                  </div>
                </div>

                <div className="schedule-details">
                  <div className="detail-row">
                    <span className="label">Gốc còn phải trả:</span>
                    <span className="value">{formatCurrency(schedule.principalDue)} VNĐ</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Lãi còn phải trả:</span>
                    <span className="value">{formatCurrency(schedule.interestDue)} VNĐ</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Tiền phạt còn phải trả:</span>
                    <span className="value">{formatCurrency(getPenaltyDue(schedule))} VNĐ</span>
                  </div>
                  {(schedule.overdueInterest > 0 || getOverduePrinciple(schedule) > 0) && (
                    <>
                      <div className="detail-row overdue">
                        <span className="label">Lãi quá hạn:</span>
                        <span className="value">{formatCurrency(schedule.overdueInterest)} VNĐ</span>
                      </div>
                      <div className="detail-row overdue">
                        <span className="label">Gốc quá hạn:</span>
                        <span className="value">{formatCurrency(getOverduePrinciple(schedule))} VNĐ</span>
                      </div>
                    </>
                  )}
                  <div className="detail-row total">
                    <span className="label">Tổng cộng còn phải trả:</span>
                    <span className="value">
                      {formatCurrency(
                        schedule.principalDue +
                          schedule.interestDue +
                          getPenaltyDue(schedule) +
                          schedule.overdueInterest +
                          getOverduePrinciple(schedule)
                      )}{' '}
                      VNĐ
                    </span>
                  </div>

                  {schedule.status !== 'PAID' && (
                    <div className="paid-info">
                      <div className="detail-row">
                        <span className="label">Gốc đã trả:</span>
                        <span className="value">{formatCurrency(schedule.principlePaid)} VNĐ</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Lãi đã trả:</span>
                        <span className="value">{formatCurrency(schedule.interestPaid)} VNĐ</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!showAllSchedules && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                onClick={() => setShowAllSchedules(true)}
                className="view-all-btn"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Xem Tất Cả Lịch Thanh Toán
              </button>
            </div>
          )}

          {showAllSchedules && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                onClick={() => setShowAllSchedules(false)}
                className="hide-all-btn"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Ẩn Lịch Thanh Toán
              </button>
            </div>
          )}

          {selectedScheduleId && schedules.find((s) => s.id === selectedScheduleId)?.status !== 'PAID' && !showAllSchedules && (
            <div className="payment-form">
              <h4>Thực Hiện Thanh Toán</h4>
              {(() => {
                const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId);
                if (!selectedSchedule) return null;

                // Công thức: (Gốc còn + Lãi còn + Phí phạt + Lãi quá hạn + Gốc quá hạn) - (Gốc đã trả + Lãi đã trả)
                const totalRemaining =
                  (selectedSchedule.principalDue +
                    selectedSchedule.interestDue +
                    getPenaltyDue(selectedSchedule) +
                    selectedSchedule.overdueInterest +
                    getOverduePrinciple(selectedSchedule)) -
                  (selectedSchedule.principlePaid + selectedSchedule.interestPaid);

                return (
                  <>
                    <div className="payment-info">
                      <div className="info-section">
                        <div className="info-title">📊 Số Tiền Còn Phải Trả:</div>
                        {selectedSchedule.principalDue > 0 && (
                          <div className="info-row">
                            <span className="label">• Gốc còn:</span>
                            <span className="value">{formatCurrency(selectedSchedule.principalDue)} VNĐ</span>
                          </div>
                        )}
                        {selectedSchedule.interestDue > 0 && (
                          <div className="info-row">
                            <span className="label">• Lãi còn:</span>
                            <span className="value">{formatCurrency(selectedSchedule.interestDue)} VNĐ</span>
                          </div>
                        )}
                        {getPenaltyDue(selectedSchedule) >= 0 && (
                          <div className="info-row">
                            <span className="label">• Phí phạt:</span>
                            <span className="value">{formatCurrency(getPenaltyDue(selectedSchedule))} VNĐ</span>
                          </div>
                        )}
                        {selectedSchedule.overdueInterest >= 0 && (
                          <div className="info-row">
                            <span className="label">• Lãi quá hạn:</span>
                            <span className="value">{formatCurrency(selectedSchedule.overdueInterest)} VNĐ</span>
                          </div>
                        )}
                        {getOverduePrinciple(selectedSchedule) >= 0 && (
                          <div className="info-row">
                            <span className="label">• Gốc quá hạn:</span>
                            <span className="value">{formatCurrency(getOverduePrinciple(selectedSchedule))} VNĐ</span>
                          </div>
                        )}
                      </div>

                      <div className="info-section">
                        <div className="info-title">✅ Số Tiền Đã Trả:</div>
                        {selectedSchedule.principlePaid > 0 && (
                          <div className="info-row">
                            <span className="label">• Gốc đã trả:</span>
                            <span className="value">{formatCurrency(selectedSchedule.principlePaid)} VNĐ</span>
                          </div>
                        )}
                        {selectedSchedule.interestPaid > 0 && (
                          <div className="info-row">
                            <span className="label">• Lãi đã trả:</span>
                            <span className="value">{formatCurrency(selectedSchedule.interestPaid)} VNĐ</span>
                          </div>
                        )}
                        {selectedSchedule.principlePaid === 0 && selectedSchedule.interestPaid === 0 && (
                          <div className="info-row">
                            <span className="label" style={{ color: '#dc3545' }}>Chưa thanh toán</span>
                          </div>
                        )}
                      </div>

                      <div className="info-total">
                        <div className="info-row">
                          <span className="label">💰 Tổng Còn Phải Trả:</span>
                          <span className="value highlight">{formatCurrency(totalRemaining)} VNĐ</span>
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="amount">Số tiền thanh toán (VNĐ):</label>
                      <span className="helper-text">
                        Có thể thanh toán: 0 - {formatCurrency(totalRemaining)} VNĐ
                      </span>
                      <div className="input-group">
                        <input
                          id="amount"
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="Nhập số tiền thanh toán"
                          min="0"
                          max={totalRemaining}
                        />
                        <button
                          type="button"
                          className="max-btn"
                          onClick={() => setPaymentAmount(totalRemaining.toString())}
                          title="Thanh toán toàn bộ số tiền còn lại"
                        >
                          Max
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
              <button onClick={handlePayment} disabled={paying} className="payment-btn">
                {paying ? 'Đang xử lý...' : 'Thanh Toán'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
