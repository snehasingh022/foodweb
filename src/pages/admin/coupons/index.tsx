import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Input, Button, Table, Modal, Form, message, Switch } from 'antd';
import { PageHeaders } from '../../../components/page-headers/index';
import { SearchOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { collection, getDocs, doc, query, orderBy, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import { Buttons } from '../../../components/buttons';

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

  return (
    <>
      <PageHeaders
        className="flex items-center justify-between px-8 xl:px-[15px] pt-2 pb-6 sm:pb-[30px] bg-transparent sm:flex-col"
        title="Coupons"
        routes={PageRoutes}
      />
      <main className="min-h-[715px] lg:min-h-[580px] px-8 xl:px-[15px] pb-[30px] bg-transparent">
        <Row gutter={25}>
          <Col sm={24} xs={24}>
            <Card className="h-full">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="p-[25px]">
                  <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
                    <h2 className="text-dark dark:text-white/[.87] text-[16px] font-semibold">Coupons Management</h2>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Input 
                        prefix={<SearchOutlined />} 
                        placeholder="Search by Coupon ID" 
                        onChange={(e) => setSearchText(e.target.value)}
                        className="min-w-[200px]"
                      />
                      <div className="flex border rounded">
                        <Button 
                          type={activeFilter === 'active' ? 'primary' : 'default'} 
                          onClick={() => setActiveFilter('active')}
                          className={activeFilter === 'active' ? 'bg-primary border-primary' : ''}
                        >
                          Active
                        </Button>
                        <Button 
                          type={activeFilter === 'inactive' ? 'primary' : 'default'} 
                          onClick={() => setActiveFilter('inactive')}
                          className={activeFilter === 'inactive' ? 'bg-primary border-primary' : ''}
                        >
                          Inactive
                        </Button>
                        <Button 
                          type={activeFilter === 'all' ? 'primary' : 'default'} 
                          onClick={() => setActiveFilter('all')}
                          className={activeFilter === 'all' ? 'bg-primary border-primary' : ''}
                        >
                          All
                        </Button>
                      </div>
                      <Buttons
                        type="primary" 
                        onClick={() => showModal()}
                        className="bg-primary hover:bg-primary-hbr"
                      >
                        <PlusOutlined /> Add Coupon
                      </Buttons>
                    </div>
                  </div>
                  
                  <Table 
                    columns={columns} 
                    dataSource={filteredData}
                    loading={loading}
                    pagination={{ 
                      pageSize: 10, 
                      showSizeChanger: true, 
                      pageSizeOptions: ['10', '25', '50', '100'] 
                    }}
                    className="ant-pagination-custom-style table-responsive"
                  />
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </main>

      {/* Add/Edit Coupon Modal */}
      <Modal
        title={isEdit ? "Edit Coupon" : "Add New Coupon"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={isEdit ? handleEditCoupon : handleAddCoupon}
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
          <Form.Item className="mb-0 text-right">
            <Button className="mr-2" onClick={() => setIsModalVisible(false)}>
              Cancel
            </Button>
            <Buttons type="primary" htmlType="submit" className="bg-primary">
              {isEdit ? 'Update' : 'Add'}
            </Buttons>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default Coupons; 