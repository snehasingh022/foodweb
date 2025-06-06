import React, { useState, useEffect, useRef } from 'react';
import { Row, InputRef, DatePicker, Col, Card, Input, Button, Table, Modal, message, Space, Tooltip, Divider, Typography, Spin, Tabs, Descriptions, Tag } from 'antd';
const { RangePicker } = DatePicker;
import { SearchOutlined, DeleteOutlined, ReloadOutlined, UserOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import Protected from '../../../components/Protected/Protected';
import { useMediaQuery } from 'react-responsive';
const { TabPane } = Tabs;

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
  customTourDetails?: {
    days?: number;
    nights?: number;
    location?: string;
    totalCost?: number;
    items?: Array<{
      componentID?: string;
      title?: string;
      description?: string;
      location?: string;
      locationType?: string;
      price?: number;
      images?: string[];
      createdAt?: any;
      updatedAt?: any;
    }>;
    createdAt?: any;
    updatedAt?: any;
    id?: string;
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
  const [userDetailsModalVisible, setUserDetailsModalVisible] = useState(false);
  const [packageDetailsModalVisible, setPackageDetailsModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const searchInputRef = useRef<InputRef>(null);
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log("Querying Firestore for bookings...");

      const bookingsCollection = collection(db, "bookings");
      const bookingsQuery = query(bookingsCollection, orderBy("createdAt", "desc"));

      const snapshot = await getDocs(bookingsQuery);

      if (snapshot.empty) {
        console.log("No bookings found in collection");
        setBookings([]);
        setLoading(false);
        return;
      }

      const data = snapshot.docs.map((doc) => {
        const docData = doc.data();

        // UPDATE THIS LOGIC TO DETECT CUSTOM TOURS:
        let bookingType = 'tour'; // default
        if (docData.cruiseDetails) {
          bookingType = 'cruise';
        } else if (docData.itineraryDetails) {
          bookingType = 'customTour';
        }

        return {
          id: doc.id,
          key: doc.id,
          bookingId: docData.bookingId || '',
          name: docData.userDetails?.name || '',
          phone: docData.userDetails?.phone || '',
          email: docData.userDetails?.email || '',
          status: docData.status || '',
          bookingType: bookingType,

          // FIXED TOUR DETAILS MAPPING:
          tourDetails: bookingType === 'tour' ? {
            title: docData.tourDetails?.title || '',
            location: docData.tourDetails?.location || '', // This might not exist in your schema
            tourType: docData.tourDetails?.tourType || '',
            price: docData.tourDetails?.price || 0,
            // Parse duration string to extract days/nights
            numberofDays: docData.tourDetails?.duration ?
              parseInt(docData.tourDetails.duration.match(/(\d+)\s*Days?/i)?.[1] || '0') : 0,
            numberofNights: docData.tourDetails?.duration ?
              parseInt(docData.tourDetails.duration.match(/(\d+)\s*Nights?/i)?.[1] || '0') : 0,
            duration: docData.tourDetails?.duration || '',
            category: docData.tourDetails?.category || '',
            description: docData.tourDetails?.description || '',
            startDate: docData.tourDetails?.startDate || null,
            itenaries: docData.tourDetails?.itenaries || {},
            categoryDetails: docData.tourDetails?.categoryDetails || {},
            tags: docData.tourDetails?.tags || {},
            flightIncluded: docData.tourDetails?.flightIncluded || false,
            isFeatured: docData.tourDetails?.isFeatured || false,
            isStartDate: docData.tourDetails?.isStartDate || false,
            imageURL: docData.tourDetails?.imageURL || '',
            id: docData.tourDetails?.id || '',
            slug: docData.tourDetails?.slug || '',
            status: docData.tourDetails?.status || 'active',
          } : undefined,

          // FIXED CRUISE DETAILS MAPPING:
          cruiseDetails: bookingType === 'cruise' ? {
            title: docData.cruiseDetails?.title || '',
            category: docData.cruiseDetails?.category || '',
            duration: docData.cruiseDetails?.duration || '',
            price: docData.cruiseDetails?.price || '',
            description: docData.cruiseDetails?.description || '',
            categoryDetails: docData.cruiseDetails?.categoryDetails || {},
            tags: docData.cruiseDetails?.tags || {},
            imageURL: docData.cruiseDetails?.imageURL || '',
            id: docData.cruiseDetails?.id || '',
            slug: docData.cruiseDetails?.slug || '',
            status: docData.cruiseDetails?.status || 'active',
          } : undefined,

          // CUSTOM TOUR DETAILS (This is correct):
          customTourDetails: bookingType === 'customTour' ? {
            days: docData.itineraryDetails?.days || 0,
            nights: docData.itineraryDetails?.nights || 0,
            location: docData.itineraryDetails?.location || '',
            totalCost: docData.itineraryDetails?.totalCost || 0,
            items: docData.itineraryDetails?.items || [],
            createdAt: docData.itineraryDetails?.createdAt || null,
            updatedAt: docData.itineraryDetails?.updatedAt || null,
            id: docData.itineraryDetails?.id || '',
          } : undefined,

          createdAt: docData.createdAt || null,
          updatedAt: docData.updatedAt || null,
          userDetails: docData.userDetails || {},

          paymentMethod: docData.paymentMethod || null,
          paymentId: docData.paymentId || null,
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

  const filteredData = bookings.filter((booking) => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'tours' && booking.bookingType === 'tour') ||
      (activeTab === 'cruises' && booking.bookingType === 'cruise') ||
      (activeTab === 'customTours' && booking.bookingType === 'customTour');

    if (!matchesTab) return false;

    // Date filter logic
    const matchesDate = !dateRange || !dateRange[0] || !dateRange[1] || (() => {
      if (!booking.createdAt) return false;
      try {
        const bookingDate = booking.createdAt.toDate();
        const startDate = dateRange[0].startOf('day').toDate();
        const endDate = dateRange[1].endOf('day').toDate();
        return bookingDate >= startDate && bookingDate <= endDate;
      } catch (error) {
        return false;
      }
    })();

    const matchesSearch =
      (booking.bookingId?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (booking.name?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (booking.phone?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (booking.email?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (booking.status?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (booking.tourDetails?.title?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (booking.tourDetails?.location?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (booking.cruiseDetails?.title?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (booking.cruiseDetails?.category?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
      (booking.customTourDetails?.location?.toLowerCase() || '').includes(searchText.toLowerCase());

    return matchesSearch && matchesDate;
  });

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
  };

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
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getColumns = () => {
    let baseColumns: any = [];

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
    ];
    if (activeTab === 'all') {
      baseColumns.push({
        title: 'Booking Date',
        key: 'bookingDate',
        render: (record: Booking) => formatDate(record.createdAt),
        responsive: ['md'] as any,
      });
    }

    if (activeTab === 'all') {
      baseColumns.splice(4, 0, {
        title: 'Type',
        dataIndex: 'bookingType',
        key: 'bookingType',
        render: (type: string) => (
          <span className={`px-2 py-1 rounded-full text-xs ${type === 'cruise' ? 'bg-blue-100 text-blue-800' :
            type === 'customTour' ? 'bg-green-100 text-green-800' :
              'bg-purple-100 text-purple-800'
            }`}>
            {type === 'customTour' ? 'Custom Tour' : type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        ),
      });
    }

    if (activeTab === 'all' || activeTab === 'tours') {
      if (activeTab === 'tours') {
        baseColumns.splice(3, 0, {
          title: 'Package',
          key: 'tourTitle',
          render: (record: Booking) => {
            const fullTitle = record.tourDetails?.title || '';
            const firstThreeWords = fullTitle.split(' ').slice(0, 3).join(' ');
            return firstThreeWords;
          },
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

    if (activeTab === 'customTours') {
      baseColumns.splice(3, 0, {
        title: 'Location',
        key: 'customTourLocation',
        render: (record: Booking) => record.customTourDetails?.location || '',
        responsive: ['md'] as any,
      });
      baseColumns.splice(4, 0, {
        title: 'Duration',
        key: 'customTourDuration',
        render: (record: Booking) =>
          record.customTourDetails?.days ? `${record.customTourDetails.days}D/${record.customTourDetails.nights}N` : '',
        responsive: ['lg'] as any,
      });
      baseColumns.splice(5, 0, {
        title: 'Total Cost',
        key: 'customTourCost',
        render: (record: Booking) =>
          record.customTourDetails?.totalCost ? `₹${record.customTourDetails.totalCost.toLocaleString()}` : '',
        responsive: ['lg'] as any,
      });
      baseColumns.splice(6, 0, {
        title: 'Items',
        key: 'customTourItems',
        render: (record: Booking) =>
          record.customTourDetails?.items ? `${record.customTourDetails.items.length} items` : '0 items',
        responsive: ['lg'] as any,
      });
    }

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
                <div className="flex justify-between flex-wrap items-center mb-4 gap-4">

                  {/* Tabs (Left side) */}
                  <div className="flex-1 min-w-0">
                    <Tabs activeKey={activeTab} onChange={handleTabChange}>
                      <TabPane tab="All Bookings" key="all" />
                      <TabPane tab="Tours" key="tours" />
                      <TabPane tab="Cruises" key="cruises" />
                      <TabPane tab="Custom Tours" key="customTours" />
                    </Tabs>
                  </div>

                  {/* Date Range Picker (Right side) */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <RangePicker
                      value={dateRange}
                      onChange={handleDateRangeChange}
                      placeholder={['Start Date', 'End Date']}
                      className="date-range-picker"
                      style={{ width: isMobile ? 280 : 300 }}
                      size={isMobile ? 'middle' : 'large'}
                      allowClear
                      format="DD/MM/YYYY"
                    />
                    {dateRange && (
                      <Button
                        type="text"
                        onClick={() => setDateRange(null)}
                        className="text-gray-500 hover:text-gray-700"
                        size="small"
                        title="Clear date filter"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>

                {/* Table Section */}
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

            </Card>
          </Col>
        </Row>
      </main >

      {/* Delete Confirmation Modal */}
      < Modal
        title={
          < div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700" >
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              Confirm Delete
            </span>
          </div >
        }
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        footer={
          [
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
          Are you sure you want to delete the booking <strong>{bookingToDelete?.bookingId}</strong>? This action cannot be undone.
        </p>
      </Modal >


      {/* User Details Modal */}
      < Modal
        title={
          < div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700" >
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              User & Booking Details
            </span>
          </div >
        }
        open={userDetailsModalVisible}
        onCancel={() => setUserDetailsModalVisible(false)}
        footer={
          [
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
                  {formatDate(selectedBooking.createdAt)}
                </span>
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
      </Modal >

      <Modal
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              {selectedBooking?.bookingType === 'cruise'
                ? 'Cruise Details'
                : selectedBooking?.bookingType === 'tour'
                  ? 'Tour Package Details'
                  : 'Custom Tour Details'}

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
              <Descriptions.Item label="Title">{selectedBooking.tourDetails.title || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Location">{selectedBooking.tourDetails.location || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Tour Type">{selectedBooking.tourDetails.tourType || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Price">
                {selectedBooking.tourDetails.price ? `₹${selectedBooking.tourDetails.price.toLocaleString()}` : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Duration">
                {selectedBooking.tourDetails.numberofDays && selectedBooking.tourDetails.numberofNights
                  ? `${selectedBooking.tourDetails.numberofDays} Days / ${selectedBooking.tourDetails.numberofNights} Nights`
                  : 'N/A'
                }
              </Descriptions.Item>
              <Descriptions.Item label="Category">{selectedBooking.tourDetails.category || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Flight Included">
                <Tag color={selectedBooking.tourDetails.flightIncluded ? 'green' : 'red'}>
                  {selectedBooking.tourDetails.flightIncluded !== undefined
                    ? (selectedBooking.tourDetails.flightIncluded ? 'Yes' : 'No')
                    : 'N/A'
                  }
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Featured">
                <Tag color={selectedBooking.tourDetails.isFeatured ? 'green' : 'red'}>
                  {selectedBooking.tourDetails.isFeatured !== undefined
                    ? (selectedBooking.tourDetails.isFeatured ? 'Yes' : 'No')
                    : 'N/A'
                  }
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <Tag color={selectedBooking.tourDetails.status === 'active' ? 'green' : 'red'} className="capitalize">
                  {selectedBooking.tourDetails.status || 'N/A'}
                </Tag>
              </Descriptions.Item>
              {selectedBooking.tourDetails.startDate ? (
                <Descriptions.Item label="Start Date" span={2}>
                  {formatDate(selectedBooking.tourDetails.startDate)}
                </Descriptions.Item>
              ) : (
                <Descriptions.Item label="Start Date" span={2}>
                  N/A
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Description" span={2}>
                {selectedBooking.tourDetails.description || 'N/A'}
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
                      <h4 className="text-lg font-medium mb-2">Day {day.day || 'N/A'}: {day.title || 'N/A'}</h4>
                      <p className="text-gray-600 dark:text-gray-300">{day.description || 'N/A'}</p>
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
                    <Tag key={key} color="blue">{value?.name || key || 'N/A'}</Tag>
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
              <Descriptions.Item label="Title">{selectedBooking.cruiseDetails.title || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Category">{selectedBooking.cruiseDetails.category || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Duration">{selectedBooking.cruiseDetails.duration || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Price">
                {selectedBooking.cruiseDetails.price ? `₹${selectedBooking.cruiseDetails.price}` : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <Tag color={selectedBooking.cruiseDetails.status === 'active' ? 'green' : 'red'} className="capitalize">
                  {selectedBooking.cruiseDetails.status || 'N/A'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {selectedBooking.cruiseDetails.description || 'N/A'}
              </Descriptions.Item>
            </Descriptions>

            {selectedBooking.cruiseDetails.tags && Object.keys(selectedBooking.cruiseDetails.tags).length > 0 && (
              <>
                <Divider orientation="left">Tags</Divider>
                <div className="tags-container flex flex-wrap gap-2">
                  {Object.entries(selectedBooking.cruiseDetails.tags).map(([key, value]: [string, any]) => (
                    <Tag key={key} color="blue">{value?.name || key || 'N/A'}</Tag>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {selectedBooking?.bookingType === 'customTour' && selectedBooking.customTourDetails && (
          <div className="custom-tour-details-wrapper overflow-auto bg-white dark:bg-[#1b1e2b] rounded-lg shadow-sm p-4" style={{ maxHeight: '70vh' }}>
            <Divider orientation="left">Custom Tour Information</Divider>
            <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }}>
              <Descriptions.Item label="Location">{selectedBooking.customTourDetails.location || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Total Cost">
                {selectedBooking.customTourDetails.totalCost ? `₹${selectedBooking.customTourDetails.totalCost.toLocaleString()}` : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Duration">
                {selectedBooking.customTourDetails.days && selectedBooking.customTourDetails.nights
                  ? `${selectedBooking.customTourDetails.days} Days / ${selectedBooking.customTourDetails.nights} Nights`
                  : 'N/A'
                }
              </Descriptions.Item>
              <Descriptions.Item label="Number of Items">
                {selectedBooking.customTourDetails.items?.length || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Tour ID" span={2}>
                <span className="font-mono text-sm">{selectedBooking.customTourDetails.id || 'N/A'}</span>
              </Descriptions.Item>
            </Descriptions>

            {selectedBooking.customTourDetails.items && selectedBooking.customTourDetails.items.length > 0 && (
              <>
                <Divider orientation="left">Tour Items</Divider>
                <div className="items-container space-y-4">
                  {selectedBooking.customTourDetails.items.map((item, index) => (
                    <div key={index} className="item-card bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border-l-4 border-green-400">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200">{item.title || 'N/A'}</h4>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">
                            {item.price ? `₹${item.price.toLocaleString()}` : 'N/A'}
                          </div>
                          <Tag color={item.locationType === 'domestic' ? 'blue' : 'orange'} className="mt-1">
                            {item.locationType || 'N/A'}
                          </Tag>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-2">{item.description || 'N/A'}</p>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="mr-4">📍 {item.location || 'N/A'}</span>
                        <span>ID: {item.componentID || 'N/A'}</span>
                      </div>
                      {item.images && item.images.length > 0 && (
                        <div className="mt-3">
                          <img
                            src={item.images[0]}
                            alt={item.title || 'Tour item'}
                            className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
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