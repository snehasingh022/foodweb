import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Input, Button, Table, Modal, message, Space, Tooltip, Divider, Typography, Spin, Tabs, Descriptions, Tag } from 'antd';
import type { InputRef } from 'antd';
import {
  SearchOutlined,
  DeleteOutlined,
  ReloadOutlined,
  UserOutlined,
  InfoCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import Protected from '../../../components/Protected/Protected';
import { useMediaQuery } from 'react-responsive';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Define Booking interface based on your Firebase schema
interface Booking {
  id: string;
  key: string;
  bookingId: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  bookingType: string; // To determine if it's a tour or cruise
  tourDetails?: {
    title?: string;
    location?: string;
    tourType?: string;
    price?: number;
    numberofDays?: number;
    numberofNights?: number;
    category?: string;
    description?: string;
    startDate?: any;
    itenaries?: any;
    categoryDetails?: any;
    tags?: any;
    flightIncluded?: boolean;
    isFeatured?: boolean;
    isStartDate?: boolean;
    imageURL?: string;
    id?: string;
    slug?: string;
    status?: string;
  };
  cruiseDetails?: {
    title?: string;
    category?: string;
    duration?: string;
    price?: string;
    description?: string;
    categoryDetails?: any;
    tags?: any;
    imageURL?: string;
    id?: string;
    slug?: string;
    status?: string;
  };
  createdAt: {
    toDate: () => Date;
  } | null;
  updatedAt?: {
    toDate: () => Date;
  } | null;
  userDetails?: {
    name?: string;
    phone?: string;
    email?: string;
    uid?: string;
    userID?: string;
  };
}

function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // New state for modals
  const [userDetailsModalVisible, setUserDetailsModalVisible] = useState(false);
  const [packageDetailsModalVisible, setPackageDetailsModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Responsive detection
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const searchInputRef = useRef<InputRef>(null);

  // Fetch bookings from Firestore
  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log("Querying Firestore for bookings...");

      // Create a query against the collection
      const bookingsCollection = collection(db, "bookings");
      const bookingsQuery = query(bookingsCollection, orderBy("createdAt", "desc"));

      // Get the snapshot
      const snapshot = await getDocs(bookingsQuery);

      if (snapshot.empty) {
        console.log("No bookings found in collection");
        setBookings([]);
        setLoading(false);
        return;
      }

      // Map the documents to our updated Booking interface
      const data = snapshot.docs.map((doc) => {
        const docData = doc.data();

        // Determine booking type based on document structure
        // If cruiseDetails exists, it's a cruise booking; otherwise, it's a tour
        const bookingType = docData.cruiseDetails ? 'cruise' : 'tour';

        return {
          id: doc.id,
          key: doc.id,
          bookingId: docData.bookingId || '',
          name: docData.userDetails?.name || '',
          phone: docData.userDetails?.phone || '',
          email: docData.userDetails?.email || '',
          status: docData.status || '',
          bookingType: bookingType,
          tourDetails: bookingType === 'tour' ? {
            title: docData.tourDetails?.title || '',
            location: docData.tourDetails?.location || '',
            tourType: docData.tourDetails?.tourType || '',
            price: docData.tourDetails?.price || 0,
            numberofDays: docData.tourDetails?.numberofDays || 0,
            numberofNights: docData.tourDetails?.numberofNights || 0,
            category: docData.tourDetails?.category || '',
            description: docData.tourDetails?.description || '',
            startDate: docData.tourDetails?.startDate || null,
            itenaries: docData.tourDetails?.itenaries || null,
            categoryDetails: docData.tourDetails?.categoryDetails || null,
            tags: docData.tourDetails?.tags || null,
            flightIncluded: docData.tourDetails?.flightIncluded || false,
            isFeatured: docData.tourDetails?.isFeatured || false,
            isStartDate: docData.tourDetails?.isStartDate || false,
            imageURL: docData.tourDetails?.imageURL || '',
            id: docData.tourDetails?.id || '',
            slug: docData.tourDetails?.slug || '',
            status: docData.tourDetails?.status || '',
          } : undefined,
          cruiseDetails: bookingType === 'cruise' ? {
            title: docData.cruiseDetails?.title || '',
            category: docData.cruiseDetails?.category || '',
            duration: docData.cruiseDetails?.duration || '',
            price: docData.cruiseDetails?.price || '',
            description: docData.cruiseDetails?.description || '',
            categoryDetails: docData.cruiseDetails?.categoryDetails || null,
            tags: docData.cruiseDetails?.tags || null,
            imageURL: docData.cruiseDetails?.imageURL || '',
            id: docData.cruiseDetails?.id || '',
            slug: docData.cruiseDetails?.slug || '',
            status: docData.cruiseDetails?.status || '',
          } : undefined,
          createdAt: docData.createdAt || null,
          updatedAt: docData.updatedAt || null,
          userDetails: docData.userDetails || {},
        };
      });

      console.log("Processed bookings:", data);
      setBookings(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      message.error("Failed to fetch bookings");
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Fetching bookings on component mount...");
    fetchBookings();
  }, []);

  // Filter data based on search text and active tab
  const filteredData = bookings.filter((booking) => {
    // First filter by tab selection
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'tours' && booking.bookingType === 'tour') ||
      (activeTab === 'cruises' && booking.bookingType === 'cruise');

    if (!matchesTab) return false;

    // Then filter by search text
    const matchesSearch =
      (booking.bookingId?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (booking.name?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (booking.phone?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (booking.email?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (booking.status?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (booking.tourDetails?.title?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (booking.tourDetails?.location?.toLowerCase() || '').includes(searchText.toLowerCase());

    return matchesSearch;
  });

  // Show delete confirmation modal
  const showDeleteModal = (record: Booking) => {
    setBookingToDelete(record);
    setDeleteModalVisible(true);
  };

  // Show user details modal
  const showUserDetailsModal = (record: Booking) => {
    setSelectedBooking(record);
    setUserDetailsModalVisible(true);
  };

  // Show package details modal
  const showPackageDetailsModal = (record: Booking) => {
    setSelectedBooking(record);
    setPackageDetailsModalVisible(true);
  };

  // Format date from Firebase timestamp
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate();
      return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Table columns with responsive adjustments
  const getColumns = () => {
    let baseColumns: any = [];

    // Common columns for all tabs
    baseColumns = [
      {
        title: 'Booking ID',
        dataIndex: 'bookingId',
        key: 'bookingId',
        render: (text: string) => <span className="font-medium">{text}</span>,
      },
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: 'Phone',
        dataIndex: 'phone',
        key: 'phone',
      },
      {
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
        responsive: ['md'] as any,
      },
    ];

    // Add booking type column only for "All" tab
    if (activeTab === 'all') {
      baseColumns.splice(4, 0, {
        title: 'Type',
        dataIndex: 'bookingType',
        key: 'bookingType',
        render: (type: string) => (
          <span className={`px-2 py-1 rounded-full text-xs ${type === 'cruise' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
            }`}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        ),
      });
    }

    // Add specific columns based on the active tab
    if (activeTab === 'all' || activeTab === 'tours') {
      if (activeTab === 'tours') {
        // Insert tour specific columns for Tours tab
        baseColumns.splice(3, 0, {
          title: 'Package',
          key: 'tourTitle',
          render: (record: Booking) => record.tourDetails?.title || '',
          responsive: ['md'] as any,
        });
        baseColumns.splice(4, 0, {
          title: 'Location',
          key: 'tourLocation',
          render: (record: Booking) => record.tourDetails?.location || '',
          responsive: ['lg'] as any,
        });
        baseColumns.splice(5, 0, {
          title: 'Price',
          key: 'tourPrice',
          render: (record: Booking) =>
            record.tourDetails?.price ? `₹${record.tourDetails.price.toLocaleString()}` : '',
          responsive: ['lg'] as any,
        });
      }
    }

    if (activeTab === 'all' || activeTab === 'cruises') {
      if (activeTab === 'cruises') {
        // Insert cruise specific columns for Cruises tab
        baseColumns.splice(3, 0, {
          title: 'Cruise',
          key: 'cruiseTitle',
          render: (record: Booking) => record.cruiseDetails?.title || '',
          responsive: ['md'] as any,
        });
        baseColumns.splice(4, 0, {
          title: 'Category',
          key: 'cruiseCategory',
          render: (record: Booking) => record.cruiseDetails?.category || '',
          responsive: ['lg'] as any,
        });
        baseColumns.splice(5, 0, {
          title: 'Duration',
          key: 'cruiseDuration',
          render: (record: Booking) => record.cruiseDetails?.duration || '',
          responsive: ['lg'] as any,
        });
        baseColumns.splice(6, 0, {
          title: 'Price',
          key: 'cruisePrice',
          render: (record: Booking) =>
            record.cruiseDetails?.price ? `₹${record.cruiseDetails.price}` : '',
          responsive: ['lg'] as any,
        });
      }
    }

    // Add status column
    baseColumns.push({
      title: 'Status',
      key: 'status',
      dataIndex: 'status',
      render: (status: string) => {
        let color = 'green';
        if (status === 'pending') color = 'orange';
        else if (status === 'failed') color = 'red';

        return (
          <Tag color={color} className="capitalize">
            {status || 'Unknown'}
          </Tag>
        );
      },
      responsive: ['md'] as any,
    });

    // Add action column with two view buttons
    baseColumns.push({
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Booking) => (
        <Space>
          <Tooltip title="View User Details">
            <Button
              type="text"
              icon={<UserOutlined />}
              onClick={() => showUserDetailsModal(record)}
              className="text-blue-600 hover:text-blue-800"
              size="small"
            />
          </Tooltip>
          <Tooltip title="View Package Details">
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              onClick={() => showPackageDetailsModal(record)}
              className="text-blue-600 hover:text-blue-800"
              size="small"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => showDeleteModal(record)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    });

    return baseColumns;
  };

  const confirmDelete = async () => {
    try {
      setSubmitLoading(true);
      if (bookingToDelete) {
        const ref = doc(db, "bookings", bookingToDelete.id);
        await deleteDoc(ref);
        message.success("Booking deleted successfully");
        fetchBookings();
        setDeleteModalVisible(false);
      }
      setSubmitLoading(false);
    } catch (error) {
      console.error("Error deleting booking:", error);
      message.error("Failed to delete booking");
      setSubmitLoading(false);
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  // Render itinerary days
  const renderItineraryDays = (itenaries: any) => {
    if (!itenaries) return <Text>No itinerary information available</Text>;

    return Object.entries(itenaries).map(([day, details]: [string, any]) => (
      <div key={day} className="mb-4">
        <Title level={5}>{details.title || day}</Title>
        <Text>{details.description}</Text>
        {details.imageURL && details.imageURL.length > 0 && (
          <div className="mt-2">
            <Text strong>Images: </Text>
            {details.imageURL.map((url: string, index: number) => (
              <Tag key={index} color="blue">{`Image ${index + 1}`}</Tag>
            ))}
          </div>
        )}
      </div>
    ));
  };

  return (
    <>
      <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] pt-6 bg-transparent">
        <Row gutter={25} className="mb-5">
          <Col xs={24}>
            <div className="flex justify-between items-center mb-5 flex-wrap gap-3 p-5">
              <div className="flex-1">
                <h1 className="text-[24px] font-medium text-dark dark:text-white/[.87]">
                  {isMobile ? 'Bookings' : 'Booking Management'}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search bookings..."
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
                    onClick={fetchBookings}
                    className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                  >
                    <ReloadOutlined className="mr-1" /> Refresh
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
                  <Tabs activeKey={activeTab} onChange={handleTabChange} className="mb-4">
                    <TabPane tab="All Bookings" key="all" />
                    <TabPane tab="Tours" key="tours" />
                    <TabPane tab="Cruises" key="cruises" />
                  </Tabs>

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
          <p className="mb-2 font-medium">Are you sure you want to delete the booking <strong>{bookingToDelete?.bookingId}</strong>?</p>
          <p className="text-danger">This action cannot be undone.</p>
        </div>
      </Modal>

      {/* User Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              User & Booking Details
            </span>
          </div>
        }
        open={userDetailsModalVisible}
        onCancel={() => setUserDetailsModalVisible(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            className='mb-4 mr-6'
            onClick={() => setUserDetailsModalVisible(false)}
            size={isMobile ? 'middle' : 'large'}
          >
            Close
          </Button>,
        ]}
        width="95%"
        style={{ maxWidth: '800px' }}
        className="responsive-modal"
        centered
      >
        {selectedBooking && (
          <div className="booking-info-container bg-white dark:bg-[#1b1e2b] rounded-lg shadow-sm p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 m-0 flex items-center">
                <span className="mr-2">Booking Details</span>
                <Tag color={selectedBooking.status === 'captured' ? 'green' : 'orange'} className="capitalize">
                  {selectedBooking.status}
                </Tag>
              </h3>
              <Tag color={selectedBooking.bookingType === 'cruise' ? 'blue' : 'purple'} className="capitalize text-sm px-3">
                {selectedBooking.bookingType}
              </Tag>
            </div>

            <Divider orientation="left" className="my-3">
              <span className="text-gray-600 dark:text-gray-300 text-base">Booking Information</span>
            </Divider>

            <Descriptions
              bordered
              column={{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }}
              className="booking-description"
              size="middle"
              labelStyle={{ fontWeight: 500 }}
            >
              <Descriptions.Item
                label={<span className="text-gray-600 dark:text-gray-400">Booking ID</span>}
              >
                <span className="font-medium">{selectedBooking.bookingId}</span>
              </Descriptions.Item>
              <Descriptions.Item
                label={<span className="text-gray-600 dark:text-gray-400">Created On</span>}
              >
                <span>
                  {selectedBooking.createdAt
                    ? new Date(String(selectedBooking.createdAt)).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true,
                    })
                    : 'N/A'}
                </span>
              </Descriptions.Item>


              <Descriptions.Item
                label={<span className="text-gray-600 dark:text-gray-400">Payment Method</span>}
              >
                <span>{(selectedBooking as any).paymentMethod || 'N/A'}</span>
              </Descriptions.Item>
              <Descriptions.Item
                label={<span className="text-gray-600 dark:text-gray-400">Payment ID</span>}
              >
                <span className="font-mono text-sm">{(selectedBooking as any).paymentId || 'N/A'}</span>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" className="mt-6 mb-3">
              <span className="text-gray-600 dark:text-gray-300 text-base">User Information</span>
            </Divider>

            <div className="user-info-card bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <div className="user-avatar flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mr-4">
                  <span className="text-xl font-semibold">
                    {selectedBooking.userDetails?.name ? selectedBooking.userDetails.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold mb-1">{selectedBooking.userDetails?.name || 'N/A'}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-600 dark:text-gray-300">{selectedBooking.userDetails?.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-gray-600 dark:text-gray-300">{selectedBooking.userDetails?.phone || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    User ID: <span className="font-mono">{selectedBooking.userDetails?.userID || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Package Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              {selectedBooking?.bookingType === 'cruise' ? 'Cruise Details' : 'Tour Package Details'}
            </span>
          </div>
        }
        open={packageDetailsModalVisible}
        onCancel={() => setPackageDetailsModalVisible(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            className='mb-4 mr-6'
            onClick={() => setPackageDetailsModalVisible(false)}
            size={isMobile ? 'middle' : 'large'}
          >
            Close
          </Button>,
        ]}
        width="95%"
        style={{ maxWidth: '800px' }}
        className="responsive-modal package-details-modal"
        centered
      >
        {selectedBooking?.bookingType === 'tour' && selectedBooking.tourDetails && (
          <div className="tour-details-wrapper overflow-auto bg-white dark:bg-[#1b1e2b] rounded-lg shadow-sm p-4" style={{ maxHeight: '70vh' }}>
            <Divider orientation="left">Tour Package Information</Divider>
            <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }}>
              <Descriptions.Item label="Title">{selectedBooking.tourDetails.title}</Descriptions.Item>
              <Descriptions.Item label="Location">{selectedBooking.tourDetails.location}</Descriptions.Item>
              <Descriptions.Item label="Tour Type">{selectedBooking.tourDetails.tourType}</Descriptions.Item>
              <Descriptions.Item label="Price">₹{selectedBooking.tourDetails.price?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Duration">
                {selectedBooking.tourDetails.numberofDays} Days / {selectedBooking.tourDetails.numberofNights} Nights
              </Descriptions.Item>
              <Descriptions.Item label="Category">{selectedBooking.tourDetails.category}</Descriptions.Item>
              <Descriptions.Item label="Flight Included">
                <Tag color={selectedBooking.tourDetails.flightIncluded ? 'green' : 'red'}>
                  {selectedBooking.tourDetails.flightIncluded ? 'Yes' : 'No'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Featured">
                <Tag color={selectedBooking.tourDetails.isFeatured ? 'green' : 'red'}>
                  {selectedBooking.tourDetails.isFeatured ? 'Yes' : 'No'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <Tag color={selectedBooking.tourDetails.status === 'active' ? 'green' : 'red'} className="capitalize">
                  {selectedBooking.tourDetails.status}
                </Tag>
              </Descriptions.Item>
              {selectedBooking.tourDetails.startDate && (
                <Descriptions.Item label="Start Date" span={2}>
                  {formatDate(selectedBooking.tourDetails.startDate)}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Description" span={2}>
                {selectedBooking.tourDetails.description || 'No description available'}
              </Descriptions.Item>
            </Descriptions>

            {selectedBooking.tourDetails.itenaries && Object.keys(selectedBooking.tourDetails.itenaries).length > 0 && (
              <>
                <Divider orientation="left">Tour Itinerary</Divider>
                <div className="itinerary-container bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  {Object.entries(selectedBooking.tourDetails.itenaries as Record<string, {
                    day: number;
                    title: string;
                    description: string;
                  }>).map(([key, day]) => (
                    <div key={key} className="day-item mb-4 border-l-4 border-blue-400 pl-4">
                      <h4 className="text-lg font-medium mb-2">Day {day.day}: {day.title}</h4>
                      <p className="text-gray-600 dark:text-gray-300">{day.description}</p>
                    </div>
                  ))}

                </div>
              </>
            )}

            {selectedBooking.tourDetails.tags && Object.keys(selectedBooking.tourDetails.tags).length > 0 && (
              <>
                <Divider orientation="left">Tags</Divider>
                <div className="tags-container flex flex-wrap gap-2">
                  {Object.entries(selectedBooking.tourDetails.tags).map(([key, value]: [string, any]) => (
                    <Tag key={key} color="blue">{value.name || key}</Tag>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {selectedBooking?.bookingType === 'cruise' && selectedBooking.cruiseDetails && (
          <div className="cruise-details-wrapper overflow-auto bg-white dark:bg-[#1b1e2b] rounded-lg shadow-sm p-4" style={{ maxHeight: '70vh' }}>
            <Divider orientation="left">Cruise Information</Divider>
            <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }}>
              <Descriptions.Item label="Title">{selectedBooking.cruiseDetails.title}</Descriptions.Item>
              <Descriptions.Item label="Category">{selectedBooking.cruiseDetails.category}</Descriptions.Item>
              <Descriptions.Item label="Duration">{selectedBooking.cruiseDetails.duration}</Descriptions.Item>
              <Descriptions.Item label="Price">₹{selectedBooking.cruiseDetails.price}</Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <Tag color={selectedBooking.cruiseDetails.status === 'active' ? 'green' : 'red'} className="capitalize">
                  {selectedBooking.cruiseDetails.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {selectedBooking.cruiseDetails.description || 'No description available'}
              </Descriptions.Item>
            </Descriptions>

            {selectedBooking.cruiseDetails.tags && Object.keys(selectedBooking.cruiseDetails.tags).length > 0 && (
              <>
                <Divider orientation="left">Tags</Divider>
                <div className="tags-container flex flex-wrap gap-2">
                  {Object.entries(selectedBooking.cruiseDetails.tags).map(([key, value]: [string, any]) => (
                    <Tag key={key} color="blue">{value.name || key}</Tag>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

export default Protected(Bookings, ["admin"]);