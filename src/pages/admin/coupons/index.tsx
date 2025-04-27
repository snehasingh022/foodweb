import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Input, Button, Table, Modal, Form, message, Switch, Space } from 'antd';
import { PageHeaders } from '../../../components/page-headers/index';
import { SearchOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { collection, getDocs, doc, query, orderBy, setDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import { Buttons } from '../../../components/buttons';
import Protected from '../../../components/Protected/Protected';

// Define Coupon interface
interface Coupon {
  id: string;
  key: string;
  minimumPrice: string | number;
  percentageDiscount: string | number;
  status: 'active' | 'inactive';
  createdAt: {
    toDate: () => Date;
  } | null;
  updatedAt: {
    toDate: () => Date;
  } | null;
}

// Form values interface
interface CouponFormValues {
  minimumPrice: string;
  percentageDiscount: string;
}

function Coupons() {
  const [form] = Form.useForm();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const [currentCoupon, setCurrentCoupon] = useState<Coupon | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);

  const PageRoutes = [
    {
      path: '/admin',
      breadcrumbName: 'Dashboard',
    },
    {
      path: '',
      breadcrumbName: 'Coupons',
    },
  ];

  // Fetch coupons from Firestore
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      console.log("Querying Firestore for coupons...");
      
      // Create a query against the collection
      const couponsCollection = collection(db, "coupons");
      const couponsQuery = query(couponsCollection, orderBy("updatedAt", "desc"));
      
      // Get the snapshot
      const snapshot = await getDocs(couponsQuery);
      
      if (snapshot.empty) {
        console.log("No coupons found in collection");
        setCoupons([]);
        setLoading(false);
        return;
      }
      
      // Log the raw data for debugging
      snapshot.docs.forEach(doc => {
        console.log(`Document ${doc.id}:`, doc.data());
      });
      
      // Map the documents to our Coupon interface
      const data = snapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          key: doc.id,
          minimumPrice: docData.minimumPrice || 0,
          percentageDiscount: docData.percentageDiscount || 0,
          status: (docData.status as 'active' | 'inactive') || 'active',
          createdAt: docData.createdAt || null,
          updatedAt: docData.updatedAt || null,
        };
      });
      
      console.log("Processed coupons:", data);
      setCoupons(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      message.error("Failed to fetch coupons");
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Fetching coupons on component mount...");
    fetchCoupons();
  }, []);

  // Filter data based on active status and search text
  const filteredData = coupons.filter((coupon) => {
    const matchesStatus = activeFilter === 'all' || coupon.status === activeFilter;
    const matchesSearch = coupon.id.toLowerCase().includes(searchText.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Generate CID format - CID followed by 6 digits from timestamp
  const generateCouponId = () => {
    return `CID${Math.floor(Date.now() / 1000).toString().slice(-6)}`;
  };

  // Add new coupon
  const handleAddCoupon = async (values: CouponFormValues) => {
    try {
      // Generate the coupon ID with CID + 6 digits
      const couponId = generateCouponId();
      console.log("Creating coupon with ID:", couponId);
      
      await setDoc(doc(db, "coupons", couponId), {
        minimumPrice: values.minimumPrice,
        percentageDiscount: values.percentageDiscount,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        status: "active",
      });

      message.success("Coupon added successfully");
      fetchCoupons();
      form.resetFields();
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error adding coupon:", error);
      message.error("Failed to add coupon");
    }
  };

  // Update existing coupon
  const handleEditCoupon = async (values: CouponFormValues) => {
    try {
      const ref = doc(db, "coupons", editId);
      await updateDoc(ref, {
        minimumPrice: values.minimumPrice,
        percentageDiscount: values.percentageDiscount,
        updatedAt: serverTimestamp(),
      });

      message.success("Coupon updated successfully");
      fetchCoupons();
      form.resetFields();
      setIsModalVisible(false);
      setIsEdit(false);
    } catch (error) {
      console.error("Error updating coupon:", error);
      message.error("Failed to update coupon");
    }
  };

  // Toggle coupon status (active/inactive)
  const handleToggleStatus = async (record: Coupon) => {
    try {
      const newStatus = record.status === 'active' ? 'inactive' : 'active';
      const ref = doc(db, "coupons", record.id);
      await updateDoc(ref, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      message.success(`Coupon ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      fetchCoupons();
    } catch (error) {
      console.error("Error updating coupon status:", error);
      message.error("Failed to update coupon status");
    }
  };

  // Open modal for adding/editing coupon
  const showModal = (record: Coupon | null = null) => {
    if (record) {
      setIsEdit(true);
      setEditId(record.id);
      form.setFieldsValue({
        minimumPrice: record.minimumPrice,
        percentageDiscount: record.percentageDiscount,
      });
    } else {
      setIsEdit(false);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  // Table columns
  const columns = [
    {
      title: 'Coupon ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: 'Discount (%)',
      dataIndex: 'percentageDiscount',
      key: 'percentageDiscount',
    },
    {
      title: 'Minimum Price',
      dataIndex: 'minimumPrice',
      key: 'minimumPrice',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span className={`px-3 py-1 rounded-full text-xs ${status === 'active' ? 'bg-success-transparent text-success' : 'bg-danger-transparent text-danger'}`}>
          {status}
        </span>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: Coupon['createdAt']) => 
        createdAt && typeof createdAt.toDate === 'function' 
          ? new Date(createdAt.toDate()).toLocaleString() 
          : '',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Coupon) => (
        <div className="flex gap-2">
          <Buttons 
            type="primary" 
            size="small" 
            onClick={() => showModal(record)}
            className="bg-primary hover:bg-primary-hbr"
          >
            <EditOutlined /> Edit
          </Buttons>
          <Switch
            checked={record.status === 'active'}
            onChange={() => handleToggleStatus(record)}
            className={record.status === 'active' ? 'bg-success' : 'bg-danger'}
          />
        </div>
      ),
    },
  ];

  const handleSubmit = async (values: CouponFormValues) => {
    try {
      setSubmitLoading(true);
      if (currentCoupon) {
        await handleEditCoupon(values);
      } else {
        await handleAddCoupon(values);
      }
      setSubmitLoading(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      message.error("Failed to submit form");
      setSubmitLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setSubmitLoading(true);
      if (couponToDelete) {
        const ref = doc(db, "coupons", couponToDelete.id);
        await deleteDoc(ref);
        message.success("Coupon deleted successfully");
        fetchCoupons();
        setDeleteModalVisible(false);
      }
      setSubmitLoading(false);
    } catch (error) {
      console.error("Error deleting coupon:", error);
      message.error("Failed to delete coupon");
      setSubmitLoading(false);
    }
  };

  return (
    <>
      <PageHeaders
        className="flex items-center justify-between px-4 sm:px-8 xl:px-[15px] pt-2 pb-4 sm:pb-6 bg-transparent sm:flex-row flex-col gap-4"
        title="Coupons"
        routes={PageRoutes}
      />
      <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] bg-transparent">
        <Row gutter={25}>
          <Col sm={24} xs={24}>
            <Card className="h-full">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="p-4 sm:p-[25px]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-dark dark:text-white/[.87] text-[16px] font-semibold">Coupon Management</h2>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <Input
                        placeholder="Search coupons..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full sm:w-64"
                      />
                      <Button
                        type="primary"
                        onClick={() => {
                          setCurrentCoupon(null);
                          setIsModalVisible(true);
                        }}
                        icon={<PlusOutlined />}
                        className="w-full sm:w-auto"
                      >
                        Add Coupon
                      </Button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table
                      dataSource={filteredData}
                      columns={columns.map(col => ({
                        ...col,
                        responsive: col.dataIndex === 'id' || col.key === 'actions' 
                          ? ['xs', 'sm', 'md', 'lg', 'xl'] as any
                          : ['sm', 'md', 'lg', 'xl'] as any,
                      }))}
                      loading={loading}
                      pagination={{ 
                        pageSize: 10,
                        showSizeChanger: false,
                        responsive: true,
                      }}
                      className="responsive-table"
                      scroll={{ x: 'max-content' }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </main>

      {/* Add/Edit Coupon Modal */}
      <Modal
        title={currentCoupon ? "Edit Coupon" : "Add New Coupon"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width="95%"
        style={{ maxWidth: '600px' }}
        className="responsive-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={currentCoupon || {
            type: 'percentage',
            status: 'active',
            usageLimit: 1
          }}
          className="p-2"
        >
          {isEdit && (
            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
              <span className="font-medium">Coupon ID: </span>
              <span>{editId}</span>
            </div>
          )}
          <Form.Item
            name="percentageDiscount"
            label="Discount Percentage"
            rules={[
              { required: true, message: 'Please input the discount percentage' },
              { 
                pattern: /^[0-9]+$/, 
                message: 'Please enter numbers only' 
              },
              { 
                validator: (_: any, value: string) => {
                  if (value && parseInt(value) > 100) {
                    return Promise.reject('Discount cannot be more than 100%');
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input placeholder="e.g. 20" addonAfter="%" />
          </Form.Item>
          <Form.Item
            name="minimumPrice"
            label="Minimum Price"
            rules={[
              { required: true, message: 'Please input the minimum price' },
              { 
                pattern: /^[0-9]+$/, 
                message: 'Please enter numbers only' 
              }
            ]}
          >
            <Input placeholder="e.g. 1000" />
          </Form.Item>
          <Form.Item className="mb-0 flex justify-end mt-4">
            <Space>
              <Button onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitLoading}
              >
                {currentCoupon ? "Update" : "Add"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Confirm Delete"
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setDeleteModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" danger loading={submitLoading} onClick={confirmDelete}>
            Delete
          </Button>,
        ]}
        width="95%"
        style={{ maxWidth: '500px' }}
        className="responsive-modal"
      >
        <p>Are you sure you want to delete the coupon code <strong>{couponToDelete?.id}</strong>?</p>
        <p>This action cannot be undone.</p>
      </Modal>
    </>
  );
}

export default Protected(Coupons, ["admin"]); 