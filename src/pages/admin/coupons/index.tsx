import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Input, Button, Table, Modal, Form, message, Switch, Space, Tabs, Tooltip, Divider, Badge, Dropdown, MenuProps, Typography, Radio, Select, Spin } from 'antd';
import type { InputRef } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  MoreOutlined,
  FilterOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { collection, getDocs, doc, query, orderBy, setDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import { Buttons } from '../../../components/buttons';
import Protected from '../../../components/Protected/Protected';
import { useMediaQuery } from 'react-responsive';

const { Title } = Typography;

// Define Coupon interface
interface Coupon {
  id: string;
  key: string;
  name: string;
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
  name: string;
  minimumPrice: string;
  percentageDiscount: string;
  status?: 'active' | 'inactive';
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
          name: docData.name || '',
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
    const matchesSearch =
      coupon.id.toLowerCase().includes(searchText.toLowerCase()) ||
      coupon.name.toLowerCase().includes(searchText.toLowerCase());
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
        name: values.name,
        minimumPrice: values.minimumPrice,
        percentageDiscount: values.percentageDiscount,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        status: values.status || "active",
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
      console.log("Updating coupon with ID:", editId, "Values:", values);

      const ref = doc(db, "coupons", editId);
      await updateDoc(ref, {
        name: values.name,
        minimumPrice: values.minimumPrice,
        percentageDiscount: values.percentageDiscount,
        status: values.status || 'active',
        updatedAt: serverTimestamp(),
      });

      message.success("Coupon updated successfully");
      fetchCoupons();
      form.resetFields();
      setIsModalVisible(false);
      setIsEdit(false);
      setEditId('');
      setCurrentCoupon(null);
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
      setCurrentCoupon(record);
      form.setFieldsValue({
        name: record.name,
        minimumPrice: record.minimumPrice,
        percentageDiscount: record.percentageDiscount,
        status: record.status,
      });
    } else {
      setIsEdit(false);
      setCurrentCoupon(null);
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
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
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
                type="text"
                icon={<EditOutlined />}
                className="text-green-600 hover:text-green-800"
                onClick={() => showModal(record)}
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                className="text-red-600 hover:text-red-800"
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
      if (isEdit) {
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
      <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] pt-6 bg-transparent">
        <Row gutter={25} className="mb-5">
          <Col xs={24}>
            <div className="flex justify-between items-center mb-5 flex-wrap gap-3 p-5">
              <div className="flex-1">
                <h1 className="text-[24px] font-medium text-dark dark:text-white/[.87]">
                  {isMobile ? 'Coupons' : 'Coupon Management'}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="primary"
                  onClick={() => {
                    setCurrentCoupon(null);
                    setIsModalVisible(true);
                  }}
                  icon={<PlusOutlined />}
                  className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                >
                  {!isMobile && "Add Coupon"}
                </Button>
                <Input
                  placeholder="Search coupons..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 250 }}
                  className="py-2 text-base font-medium"
                  ref={searchInputRef}
                />
                {loading ? (
                  <div className="h-10 flex items-center justify-center">
                    <Spin size="small" />
                  </div>
                ) : (
                  <Button
                    type="primary"
                    onClick={fetchCoupons}
                    className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                  >
                    Refresh
                  </Button>
                )}
              </div>
            </div>
          </Col>
        </Row>

        <Row gutter={25}>
          <Col sm={24} xs={24}>
            <Card className="h-full mb-8">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="p-6 sm:p-[30px]">
                  <Tabs
                    activeKey={activeFilter}
                    onChange={(key) => setActiveFilter(key as 'active' | 'inactive' | 'all')}
                    items={tabItems}
                    className="mb-4"
                    size={isMobile ? 'small' : 'middle'}
                    centered={isMobile}
                  />

                  <div className="table-responsive">
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
                      className="[&>div>div>div>div>div>.ant-table-content>table>thead>tr>th]:bg-regularBG dark:[&>div>div>div>div>div>.ant-table-content>table>thead>tr>th]:bg-[#323440] [&>div>div>div>div>div>.ant-table-content>table>thead>tr>th]:font-medium"
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
            name: '',
            percentageDiscount: '',
            minimumPrice: '',
            status: 'active'
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
                name="name"
                label={
                  <span className="font-medium text-dark dark:text-white/[.87]">
                    Coupon Name
                  </span>
                }
                rules={[
                  { required: true, message: 'Please input the coupon name' },
                ]}
              >
                <Input
                  placeholder="e.g. Summer Discount"
                  size={isMobile ? 'middle' : 'large'}
                  className="rounded-md"
                />
              </Form.Item>
            </Col>

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

            <Col span={24}>
              <Form.Item
                name="status"
                label={
                  <span className="font-medium text-dark dark:text-white/[.87]">
                    Status
                  </span>
                }
                initialValue="active"
              >
                <Select
                  placeholder="Select status"
                  size={isMobile ? 'middle' : 'large'}
                  className="rounded-md w-full"
                  dropdownStyle={{ padding: '8px' }}
                  options={[
                    {
                      value: 'active',
                      label: (
                        <div className="flex items-center gap-2">
                          <Badge status="success" />
                          <span>Active</span>
                        </div>
                      )
                    },
                    {
                      value: 'inactive',
                      label: (
                        <div className="flex items-center gap-2">
                          <Badge status="error" />
                          <span>Inactive</span>
                        </div>
                      )
                    }
                  ]}
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
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              Confirm Delete
            </span>
          </div>
        }
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        footer={[
          <Button
            key="cancel"
            onClick={() => setDeleteModalVisible(false)}
            size={isMobile ? 'middle' : 'large'}
            className="mb-4"
          >
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            loading={submitLoading}
            onClick={confirmDelete}
            size={isMobile ? 'middle' : 'large'}
            className="mr-4 mb-4"
          >
            Delete
          </Button>,
        ]}
        width="95%"
        style={{ maxWidth: '500px' }}
        className="responsive-modal"
        centered
      >
        <p className="p-3">
          Are you sure you want to delete the booking <strong>{couponToDelete?.id}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </>
  );
}

export default Protected(Coupons, ["admin"]); 