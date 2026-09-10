import { useState, useEffect } from 'react';
import { Search, Eye } from 'lucide-react';
import { Button, Badge, Input, Modal, Select, Card } from '../components/ui';

import * as adminApi from '../api/admin';
import { toast } from 'react-hot-toast';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    date_from: '',
    date_to: '',
    search: ''
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);
  const [shippingModal, setShippingModal] = useState({ isOpen: false, orderId: null, tracking: '', courier: '' });

  useEffect(() => {
    if (selectedOrder) {
      setAdminNotes(selectedOrder.admin_notes || '');
    }
  }, [selectedOrder]);

  const fetchOrders = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.search) params.search = filters.search;
      const res = await adminApi.getAllOrders(params);
      if (res.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      toast.error('Unable to load orders. Please refresh the page.');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const res = await adminApi.getOrderDetails(orderId);
      if (res.success) {
        setSelectedOrder(res.data.order);
      }
    } catch (err) {
      console.error('Failed to reload order details:', err);
    }
  };

  useEffect(() => {
    fetchOrders(true);

    const handleSocketUpdate = (event) => {
      fetchOrders(false);
      const { orderId } = event.detail || {};
      if (orderId) {
        setSelectedOrder(prev => {
          if (prev && prev.id === orderId) {
            fetchOrderDetails(orderId);
          }
          return prev;
        });
      }
    };

    window.addEventListener('socket:order_update', handleSocketUpdate);
    return () => {
      window.removeEventListener('socket:order_update', handleSocketUpdate);
    };
  }, []);

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (newStatus === 'shipped') {
      setShippingModal({ isOpen: true, orderId, tracking: '', courier: '' });
      return;
    }

    try {
      await adminApi.updateOrderStatus(orderId, { status: newStatus });
      toast.success('Order status updated');
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.error?.message || err?.message || 'Failed to update status';
      toast.error(errorMsg);
    }
  };

  const confirmShipping = async () => {
    const { orderId, tracking, courier } = shippingModal;
    if (!tracking.trim() || !courier.trim()) {
      toast.error('Tracking and courier are required for shipping');
      return;
    }

    try {
      const payload = { status: 'shipped', tracking_number: tracking.trim(), courier: courier.trim() };
      await adminApi.updateOrderStatus(orderId, payload);
      toast.success('Order marked as shipped');
      setShippingModal({ isOpen: false, orderId: null, tracking: '', courier: '' });
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: 'shipped' }));
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.error?.message || err?.message || 'Failed to ship order';
      toast.error(errorMsg);
    }
  };

  const handleViewOrder = async (orderId) => {
    try {
      const res = await adminApi.getOrderDetails(orderId);
      if (res.success) {
        setSelectedOrder(res.data.order);
      }
    } catch (err) {
      toast.error('Unable to load order details. Please try again.');
    }
  };

  const handleUpdateNotes = async () => {
    try {
      setNotesLoading(true);
      const res = await adminApi.updateOrderNotes(selectedOrder.id, adminNotes);
      if (res.success) {
        toast.success('Notes updated');
        setSelectedOrder(res.data.order);
      }
    } catch (err) {
      toast.error('Failed to update notes');
    } finally {
      setNotesLoading(false);
    }
  };

  return (
    <div className="admin-orders">
      <div className="page-header">
        <div>
          <h1>Order Management</h1>
          <p>View and manage customer orders, update shipping status, and track deliveries.</p>
        </div>
      </div>

      <div className="admin-toolbar flex-wrap">
        <Input
          placeholder="Search orders..."
          value={filters.search}
          onChange={e => setFilters(p => ({...p, search: e.target.value}))}
          icon={Search}
          containerClassName="mb-0 flex-1 min-w-[200px]"
        />
        <Select
          label="Status"
          value={filters.status}
          onChange={e => setFilters(p => ({...p, status: e.target.value}))}
          options={[
            { value: '', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'processing', label: 'Processing' },
            { value: 'shipped', label: 'Shipped' },
            { value: 'delivered', label: 'Delivered' },
            { value: 'cancelled', label: 'Cancelled' }
          ]}
          containerClassName="mb-0"
        />
        <Input
          label="From"
          type="date"
          value={filters.date_from}
          onChange={e => setFilters(p => ({...p, date_from: e.target.value}))}
          containerClassName="mb-0"
        />
        <Input
          label="To"
          type="date"
          value={filters.date_to}
          onChange={e => setFilters(p => ({...p, date_to: e.target.value}))}
          containerClassName="mb-0"
        />
        <Button variant="admin-primary" onClick={fetchOrders} className="mt-auto">
          Filter Orders
        </Button>
      </div>

      <div className="table-container">
        {loading ? (
          <p style={{ padding: '2rem' }}>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center' }}>No orders found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td>#{o.id.substring(0, 8)}</td>
                  <td>{o.user_name}</td>
                  <td>{new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>{o.items_count || 0} items</td>
                  <td>PKR {Number(o.total).toLocaleString()}</td>
                  <td>
                    <Badge variant={
                      o.status === 'delivered' ? 'success' : 
                      o.status === 'cancelled' ? 'error' : 
                      o.status === 'pending' ? 'warning' : 'info'
                    }>
                      {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="admin-ghost"
                        size="sm"
                        icon={Eye}
                        onClick={() => handleViewOrder(o.id)}
                        title="View Order"
                      />
                      <Select
                        value={o.status}
                        onChange={(e) => handleStatusUpdate(o.id, e.target.value)}
                        options={[
                          { value: 'pending', label: 'Pending' },
                          { value: 'processing', label: 'Processing' },
                          { value: 'shipped', label: 'Shipped' },
                          { value: 'delivered', label: 'Delivered' },
                          { value: 'cancelled', label: 'Cancelled' }
                        ]}
                        containerClassName="mb-0 min-w-[130px]"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order #${selectedOrder?.id.substring(0, 8)}`}
        size="2xl"
      >
        <div className="space-y-6">
          <Card className="bg-slate-50 border-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Customer</p>
                <p className="font-bold">{selectedOrder?.user_name}</p>
                <p className="text-slate-600">{selectedOrder?.user_email}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Status</p>
                <Badge variant={
                  selectedOrder?.status === 'delivered' ? 'success' : 
                  selectedOrder?.status === 'cancelled' ? 'error' : 'info'
                }>
                  {selectedOrder?.status}
                </Badge>
              </div>
              <div className="md:col-span-2">
                <p className="text-slate-500 mb-1">Shipping Address</p>
                <p className="font-medium text-slate-700 leading-relaxed">
                  {typeof selectedOrder?.shipping_address === 'object' 
                    ? `${selectedOrder.shipping_address.address}, ${selectedOrder.shipping_address.city}, ${selectedOrder.shipping_address.zip_code}, ${selectedOrder.shipping_address.country}`
                    : selectedOrder?.shipping_address}
                </p>
              </div>
            </div>
          </Card>

          <div>
            <h3 className="text-lg font-bold mb-3">Order Items</h3>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
              {selectedOrder?.items?.map(item => (
                <div key={item.id} className="flex justify-between p-3 bg-white">
                  <div>
                    <p className="font-semibold">{item.product_name}</p>
                    <p className="text-xs text-slate-500">{item.variant_label} x {item.quantity}</p>
                  </div>
                  <span className="font-bold text-slate-700">PKR {Number(item.subtotal).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>PKR {Number(selectedOrder?.subtotal).toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span>Shipping</span><span>PKR {Number(selectedOrder?.shipping_fee).toLocaleString()}</span></div>
            <div className="flex justify-between text-sm text-red-600"><span>Discount</span><span>- PKR {Number(selectedOrder?.discount).toLocaleString()}</span></div>
            <div className="flex justify-between font-bold text-xl mt-4 pt-4 border-t border-slate-200 text-primary">
              <span>Total</span>
              <span>PKR {Number(selectedOrder?.total).toLocaleString()}</span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-2">Admin Notes</h3>
            <textarea 
              value={adminNotes} 
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Internal notes..."
              className="admin-input w-full h-24 font-sans resize-none mb-2"
            />
            <Button 
              variant="admin-primary" 
              onClick={handleUpdateNotes} 
              loading={notesLoading}
            >
              Save Notes
            </Button>
          </div>

          {selectedOrder?.history && selectedOrder.history.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3">Order History</h3>
              <div className="space-y-3">
                {selectedOrder.history.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <Badge variant="info" pill={false} className="text-[10px]">
                        {log.status_from ? `${log.status_from} → ` : ''}{log.status_to}
                      </Badge>
                      <span className="text-slate-400 text-xs font-medium">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600">Changed by: <span className="font-semibold text-slate-800">{log.changed_by_name || 'System'}</span></p>
                    {log.notes && <p className="mt-2 text-xs italic text-slate-500 bg-white p-2 rounded border border-slate-100">Note: {log.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={shippingModal.isOpen}
        onClose={() => setShippingModal({ isOpen: false, orderId: null, tracking: '', courier: '' })}
        title="Ship Order"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 mb-4">Please provide the shipping details to mark this order as shipped.</p>
          <Input
            label="Tracking Number"
            placeholder="e.g. TRK-123456789"
            value={shippingModal.tracking}
            onChange={(e) => setShippingModal(p => ({ ...p, tracking: e.target.value }))}
          />
          <Input
            label="Courier Name"
            placeholder="e.g. TCS, Leopards, DHL"
            value={shippingModal.courier}
            onChange={(e) => setShippingModal(p => ({ ...p, courier: e.target.value }))}
          />
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <Button 
              variant="admin-ghost" 
              onClick={() => setShippingModal({ isOpen: false, orderId: null, tracking: '', courier: '' })}
            >
              Cancel
            </Button>
            <Button 
              variant="admin-primary" 
              onClick={confirmShipping}
            >
              Confirm Shipment
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default AdminOrders;
