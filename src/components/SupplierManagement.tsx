import { useEffect, useMemo, useState } from 'react';
import { supplierApi } from '../api/client';
import type {
  CreateSupplierRequest,
  ImportOrder,
  Supplier,
  SupplierProduct,
  UpdateSupplierRequest,
} from '../types';
import '../styles/SupplierManagement.css';

const defaultForm: UpdateSupplierRequest = {
  name: '',
  email: '',
  phone: '',
  taxCode: '',
  status: 'ACTIVE',
};

const defaultCreateForm: CreateSupplierRequest = {
  name: '',
  email: '',
  phone: '',
  taxCode: '',
};

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<UpdateSupplierRequest>(defaultForm);
  const [createFormData, setCreateFormData] = useState<CreateSupplierRequest>(defaultCreateForm);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [pendingOrders, setPendingOrders] = useState<ImportOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<ImportOrder[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    []
  );

  const loadSuppliers = async (shouldKeepSelection = true) => {
    setLoadingSuppliers(true);
    setError('');

    try {
      const response = await supplierApi.getAll();
      if (response.code !== 200) {
        setError(response.message || 'Không thể tải danh sách nhà cung cấp');
        return;
      }

      const mappedSuppliers = response.data;
      setSuppliers(mappedSuppliers);

      if (!shouldKeepSelection) {
        setSelectedSupplier(null);
        return;
      }

      setSelectedSupplier((current) => {
        if (!current) return mappedSuppliers[0] ?? null;
        return mappedSuppliers.find((item) => item.id === current.id) ?? mappedSuppliers[0] ?? null;
      });
    } catch (err) {
      setError('Lỗi kết nối tới máy chủ supplier');
      console.error(err);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const loadSupplierDetail = async (supplier: Supplier) => {
    setLoadingDetail(true);
    setError('');

    try {
      const [productsRes, pendingRes, completedRes] = await Promise.all([
        supplierApi.getProducts(supplier.id),
        supplierApi.getPendingImportOrders(supplier.name),
        supplierApi.getCompletedImportOrders(supplier.name),
      ]);

      if (productsRes.code === 200) {
        setProducts(productsRes.data);
      } else {
        setProducts([]);
      }

      if (pendingRes.code === 200) {
        setPendingOrders(pendingRes.data);
      } else {
        setPendingOrders([]);
      }

      if (completedRes.code === 200) {
        setCompletedOrders(completedRes.data);
      } else {
        setCompletedOrders([]);
      }
    } catch (err) {
      setError('Không tải được chi tiết nhà cung cấp');
      console.error(err);
      setProducts([]);
      setPendingOrders([]);
      setCompletedOrders([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    if (!selectedSupplier) {
      setFormData(defaultForm);
      setProducts([]);
      setPendingOrders([]);
      setCompletedOrders([]);
      return;
    }

    setFormData({
      name: selectedSupplier.name,
      email: selectedSupplier.email,
      phone: selectedSupplier.phone,
      taxCode: selectedSupplier.taxCode,
      status: selectedSupplier.status ?? 'INACTIVE',
    });

    loadSupplierDetail(selectedSupplier);
  }, [selectedSupplier]);

  const handleSupplierSelect = (supplier: Supplier) => {
    setSuccess('');
    setSelectedSupplier(supplier);
  };

  const handleFormChange = (key: keyof UpdateSupplierRequest, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCreateFormChange = (key: keyof CreateSupplierRequest, value: string) => {
    setCreateFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCreateSupplier = async () => {
    if (
      !createFormData.name.trim() ||
      !createFormData.email.trim() ||
      !createFormData.phone.trim() ||
      !createFormData.taxCode.trim()
    ) {
      setError('Vui lòng nhập đầy đủ thông tin để thêm mới nhà cung cấp');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await supplierApi.create({
        name: createFormData.name.trim(),
        email: createFormData.email.trim(),
        phone: createFormData.phone.trim(),
        taxCode: createFormData.taxCode.trim(),
      });

      if (response.code === 200) {
        setSuccess('Thêm mới nhà cung cấp thành công');
        setCreateFormData(defaultCreateForm);
        await loadSuppliers();
        setSelectedSupplier(response.data);
      } else {
        setError(response.message || 'Thêm mới nhà cung cấp thất bại');
      }
    } catch (err) {
      setError('Không thể thêm mới nhà cung cấp');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedSupplier) return;

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.taxCode.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin nhà cung cấp');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await supplierApi.update(selectedSupplier.id, {
        ...formData,
        status: formData.status || 'ACTIVE',
      });

      if (response.code === 200) {
        setSuccess('Cập nhật nhà cung cấp thành công');
        await loadSuppliers();
      } else {
        setError(response.message || 'Cập nhật nhà cung cấp thất bại');
      }
    } catch (err) {
      setError('Không thể cập nhật nhà cung cấp');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!selectedSupplier) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await supplierApi.delete(selectedSupplier.id);
      if (response.code === 200) {
        setSuccess('Đã xóa mềm nhà cung cấp. Bạn có thể khôi phục bằng status ACTIVE.');
        await loadSuppliers();
      } else {
        setError(response.message || 'Xóa mềm nhà cung cấp thất bại');
      }
    } catch (err) {
      setError('Không thể xóa mềm nhà cung cấp');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedSupplier) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await supplierApi.update(selectedSupplier.id, {
        ...formData,
        status: 'ACTIVE',
      });

      if (response.code === 200) {
        setSuccess('Khôi phục nhà cung cấp thành công (status = ACTIVE)');
        await loadSuppliers();
      } else {
        setError(response.message || 'Khôi phục nhà cung cấp thất bại');
      }
    } catch (err) {
      setError('Không thể khôi phục nhà cung cấp');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderOrderTable = (title: string, orders: ImportOrder[]) => (
    <div className="orders-section">
      <h4>{title} ({orders.length})</h4>
      {orders.length === 0 ? (
        <div className="empty-message">Không có đơn hàng</div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Nhà cung cấp</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Ngày nhập kho</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.supplierName}</td>
                  <td>{numberFormatter.format(order.totalAmount)} VNĐ</td>
                  <td>
                    <span className={`status-badge ${order.status.toLowerCase()}`}>{order.status}</span>
                  </td>
                  <td>{order.importDate ?? 'Chưa nhập kho'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="supplier-management-container">
      <h3>Quản Lý Nhà Cung Cấp</h3>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="supplier-layout">
        <section className="supplier-list-panel">
          <div className="create-supplier-box">
            <h4>Thêm nhà cung cấp mới</h4>
            <div className="create-form-grid">
              <label>
                Tên nhà cung cấp
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => handleCreateFormChange('name', e.target.value)}
                  placeholder="VD: Công ty B"
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => handleCreateFormChange('email', e.target.value)}
                  placeholder="VD: companyB@abc-tech.com"
                />
              </label>

              <label>
                Số điện thoại
                <input
                  type="text"
                  value={createFormData.phone}
                  onChange={(e) => handleCreateFormChange('phone', e.target.value)}
                  placeholder="VD: 0987651987"
                />
              </label>

              <label>
                Mã số thuế
                <input
                  type="text"
                  value={createFormData.taxCode}
                  onChange={(e) => handleCreateFormChange('taxCode', e.target.value)}
                  placeholder="VD: MS123459768"
                />
              </label>
            </div>
            <button onClick={handleCreateSupplier} disabled={submitting || loadingSuppliers}>
              Thêm mới nhà cung cấp
            </button>
          </div>

          <div className="panel-header">
            <h4>Danh sách nhà cung cấp</h4>
            <button onClick={() => loadSuppliers(false)} disabled={loadingSuppliers || submitting}>
              Làm mới
            </button>
          </div>

          {loadingSuppliers ? (
            <div className="loading">Đang tải nhà cung cấp...</div>
          ) : suppliers.length === 0 ? (
            <div className="empty-message">Chưa có nhà cung cấp</div>
          ) : (
            <div className="supplier-list">
              {suppliers.map((supplier) => (
                <button
                  key={supplier.id}
                  className={`supplier-item ${selectedSupplier?.id === supplier.id ? 'active' : ''}`}
                  onClick={() => handleSupplierSelect(supplier)}
                >
                  <div>
                    <strong>{supplier.name}</strong>
                    <p>{supplier.email}</p>
                  </div>
                  <span className={`status-tag ${(supplier.status ?? 'ACTIVE').toLowerCase()}`}>
                    {supplier.status ?? 'ACTIVE'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="supplier-detail-panel">
          {!selectedSupplier ? (
            <div className="empty-message">Chọn một nhà cung cấp để xem chi tiết</div>
          ) : (
            <>
              <h4>Thông tin nhà cung cấp</h4>
              <div className="form-grid">
                <label>
                  Tên nhà cung cấp
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                  />
                </label>

                <label>
                  Số điện thoại
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                  />
                </label>

                <label>
                  Mã số thuế
                  <input
                    type="text"
                    value={formData.taxCode}
                    onChange={(e) => handleFormChange('taxCode', e.target.value)}
                  />
                </label>

                <label>
                  Trạng thái
                  <select
                    value={formData.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </label>
              </div>

              <div className="action-row">
                <button onClick={handleUpdate} disabled={submitting}>Cập nhật nhà cung cấp</button>
                <button className="danger" onClick={handleSoftDelete} disabled={submitting}>
                  Xóa mềm
                </button>
                <button className="success" onClick={handleRestore} disabled={submitting}>
                  Khôi phục (ACTIVE)
                </button>
              </div>

              {loadingDetail ? (
                <div className="loading">Đang tải chi tiết...</div>
              ) : (
                <>
                  <div className="products-section">
                    <h4>Sản phẩm theo nhà cung cấp ({products.length})</h4>
                    {products.length === 0 ? (
                      <div className="empty-message">Không có sản phẩm</div>
                    ) : (
                      <ul>
                        {products.map((product) => (
                          <li key={product.id}>
                            <span>{product.name}</span>
                            <span className={`status-badge ${product.status.toLowerCase()}`}>{product.status}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {renderOrderTable('Đơn hàng chưa nhập kho', pendingOrders)}
                  {renderOrderTable('Đơn hàng đã nhập kho', completedOrders)}
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
