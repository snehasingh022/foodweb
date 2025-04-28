import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Input, Button, Table, Modal, Form, message, Switch, Space, Tabs, Tooltip, Divider, Badge, Dropdown, MenuProps } from 'antd';
import type { InputRef } from 'antd';
import { PageHeaders } from '../../../components/page-headers/index';
import { 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ExclamationCircleOutlined,
  MoreOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { collection, getDocs, doc, query, orderBy, setDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import { Buttons } from '../../../components/buttons';
import Protected from '../../../components/Protected/Protected';
import { useMediaQuery } from 'react-responsive';

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
  
  // Responsive detection
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const searchInputRef = useRef<InputRef>(null);

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

  // Show delete confirmation modal
  const showDeleteModal = (record: Coupon) => {
    setCouponToDelete(record);
    setDeleteModalVisible(true);
  };

  // Action menu for mobile view
  const getActionMenu = (record: Coupon): MenuProps => {
    return {
      items: [
        {
          key: '1',
          label: 'Edit',
          icon: <EditOutlined />,
          onClick: () => showModal(record),
        },
        {
          key: '2',
          label: record.status === 'active' ? 'Deactivate' : 'Activate',
          icon: <Badge status={record.status === 'active' ? 'success' : 'error'} />,
          onClick: () => handleToggleStatus(record),
        },
        {
          key: '3',
          label: 'Delete',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => showDeleteModal(record),
        },
      ],
    };
  };

  // Table columns with responsive adjustments
  const getColumns = () => {
    const baseColumns: any = [
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
        responsive: ['sm'] as any,
      },
      {
        title: 'Min. Price',
        dataIndex: 'minimumPrice',
        key: 'minimumPrice',
        responsive: ['sm'] as any,
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
        responsive: ['md'] as any,
        render: (createdAt: Coupon['createdAt']) => 
          createdAt && typeof createdAt.toDate === 'function' 
            ? new Date(createdAt.toDate()).toLocaleString() 
            : '',
      }
    ];
    
    // Different action column based on screen size
    if (isMobile) {
      baseColumns.push({
        title: 'Actions',
        key: 'actions',
        width: 80,
        render: (_: any, record: Coupon) => (
          <Dropdown menu={getActionMenu(record)} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        ),
      });
    } else {
      baseColumns.push({
        title: 'Actions',
        key: 'actions',
        render: (_: any, record: Coupon) => (
          <Space>
            <Tooltip title="Edit">
              <Button 
                type="primary" 
                size="small" 
                icon={<EditOutlined />}
                onClick={() => showModal(record)}
                className="bg-primary hover:bg-primary-hbr"
              />
            </Tooltip>
            <Tooltip title={record.status === 'active' ? 'Deactivate' : 'Activate'}>
              <Switch
                checked={record.status === 'active'}
                onChange={() => handleToggleStatus(record)}
                className={record.status === 'active' ? 'bg-success' : 'bg-danger'}
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Button 
                type="primary" 
                danger
                size="small" 
                icon={<DeleteOutlined />}
                onClick={() => showDeleteModal(record)}
              />
            </Tooltip>
          </Space>
        ),
      });
    }
    
    return baseColumns;
  };

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

  // Tab items for filtering
  const tabItems = [
    {
      key: 'all',
      label: 'All Coupons',
    },
    {
      key: 'active',
      label: 'Active',
    },
    {
      key: 'inactive',
      label: 'Inactive',
    },
  ];

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
            <Card className="h-full" bodyStyle={{ padding: isMobile ? '12px' : '24px' }}>
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className={`${isMobile ? 'p-2 sm:p-4' : 'p-4 sm:p-[25px]'}`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                    <h2 className="text-dark dark:text-white/[.87] text-[16px] font-semibold mb-1 sm:mb-0">
                      {isMobile ? 'Coupons' : 'Coupon Management'}
                    </h2>
                    
                    {isMobile ? (
                      <div className="flex items-center justify-between w-full">
                        <Button 
                          icon={<FilterOutlined />} 
                          onClick={() => {
                            const tabsElement = document.querySelector('.ant-tabs-nav');
                            if (tabsElement) {
                              tabsElement.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                        >
                          Filter
                        </Button>
                        <Space>
                          <Button 
                            icon={<SearchOutlined />} 
                            onClick={() => searchInputRef.current?.focus()}
                          />
                          <Button 
                            icon={<ReloadOutlined />} 
                            onClick={fetchCoupons}
                            loading={loading}
                          />
                          <Button
                            type="primary"
                            onClick={() => {
                              setCurrentCoupon(null);
                              setIsModalVisible(true);
                            }}
                            icon={<PlusOutlined />}
                          />
                        </Space>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <Input
                          placeholder="Search coupons..."
                          prefix={<SearchOutlined />}
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          className="w-full sm:w-64"
                          ref={searchInputRef}
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
                    )}
                  </div>
                  
                  {isMobile && (
                    <div className="mb-4">
                      <Input
                        placeholder="Search coupons..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full"
                        ref={searchInputRef}
                      />
                    </div>
                  )}
                  
                  <Tabs
                    activeKey={activeFilter}
                    onChange={(key) => setActiveFilter(key as 'active' | 'inactive' | 'all')}
                    items={tabItems}
                    className="mb-4"
                    size={isMobile ? 'small' : 'middle'}
                    centered={isMobile}
                  />
                  
                  <div className="overflow-x-auto">
                    <Table
                      dataSource={filteredData}
                      columns={getColumns()}
                      loading={loading}
                      pagination={{ 
                        pageSize: isMobile ? 5 : 10,
                        showSizeChanger: false,
                        responsive: true,
                        size: isMobile ? 'small' : 'default',
                      }}
                      className="responsive-table"
                      scroll={{ x: 'max-content' }}
                      size={isMobile ? 'small' : 'middle'}
                      rowKey="id"
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
        title={
          <div className="flex items-center gap-2 px-2 py-1">
            {isEdit ? (
              <EditOutlined className="text-primary text-lg" />
            ) : (
              <PlusOutlined className="text-primary text-lg" />
            )}
            <span className="text-lg font-medium">
              {isEdit ? "Edit Coupon" : "Add New Coupon"}
            </span>
          </div>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width="95%"
        style={{ maxWidth: '550px' }}
        className="responsive-modal"
        centered
        maskClosable={false}
      >
        <Divider className="my-2" />
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={currentCoupon || {
            percentageDiscount: '',
            minimumPrice: ''
          }}
          className="p-2"
        >
          {isEdit && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <ExclamationCircleOutlined className="text-primary" />
                <span className="font-medium">Coupon ID: </span>
                <span className="text-primary font-bold">{editId}</span>
              </div>
            </div>
          )}

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="percentageDiscount"
                label={
                  <span className="font-medium text-dark dark:text-white/[.87]">
                    Discount Percentage
                  </span>
                }
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
                <Input 
                  placeholder="e.g. 20" 
                  addonAfter="%" 
                  size={isMobile ? 'middle' : 'large'}
                  className="rounded-md"
                />
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Form.Item
                name="minimumPrice"
                label={
                  <span className="font-medium text-dark dark:text-white/[.87]">
                    Minimum Purchase Amount
                  </span>
                }
                rules={[
                  { required: true, message: 'Please input the minimum price' },
                  { 
                    pattern: /^[0-9]+$/, 
                    message: 'Please enter numbers only' 
                  }
                ]}
                help="Minimum amount required for coupon to be applicable"
              >
                <Input 
                  placeholder="e.g. 1000" 
                  size={isMobile ? 'middle' : 'large'}
                  className="rounded-md"
                  addonBefore="₹"
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end gap-3 mt-8">
            <Button
              size={isMobile ? 'middle' : 'large'}
              onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
              }}
              className="min-w-[80px] sm:min-w-[100px]"
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={submitLoading}
              size={isMobile ? 'middle' : 'large'}
              className="min-w-[80px] sm:min-w-[100px]"
            >
              {isEdit ? "Update" : "Add"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-danger">
            <DeleteOutlined />
            <span>Confirm Delete</span>
          </div>
        }
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        footer={[
          <Button 
            key="back" 
            onClick={() => setDeleteModalVisible(false)} 
            size={isMobile ? 'middle' : 'large'}
          >
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            danger 
            loading={submitLoading} 
            onClick={confirmDelete}
            size={isMobile ? 'middle' : 'large'}
          >
            Delete
          </Button>,
        ]}
        width="95%"
        style={{ maxWidth: '500px' }}
        className="responsive-modal"
        centered
      >
        <Divider className="my-2" />
        <div className="p-4 bg-danger-transparent rounded-lg mb-4">
          <p className="mb-2 font-medium">Are you sure you want to delete the coupon code <strong>{couponToDelete?.id}</strong>?</p>
          <p className="text-danger">This action cannot be undone.</p>
        </div>
      </Modal>
    </>
  );
}

export default Protected(Coupons, ["admin"]); 