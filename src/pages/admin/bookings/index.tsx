import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Input, Button, Table, Modal, message, Space, Tooltip, Divider, Typography, Spin, Tabs } from 'antd';
import type { InputRef } from 'antd';
import {
  SearchOutlined,
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import Protected from '../../../components/Protected/Protected';
import { useMediaQuery } from 'react-responsive';

const { Title } = Typography;
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
  };
  cruiseDetails?: {
    title?: string;
    category?: string;
    duration?: string;
    price?: string;
  };
  createdAt: {
    toDate: () => Date;
  } | null;
}

function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState('all');

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
          } : undefined,
          cruiseDetails: bookingType === 'cruise' ? {
            title: docData.cruiseDetails?.title || '',
            category: docData.cruiseDetails?.category || '',
            duration: docData.cruiseDetails?.duration || '',
            price: docData.cruiseDetails?.price || '',
          } : undefined,
          createdAt: docData.createdAt || null,
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
          <span className={`px-2 py-1 rounded-full text-xs ${
            type === 'cruise' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
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

    // Add action column
    baseColumns.push({
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Booking) => (
        <Space>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => showDeleteModal(record)}
              className="text-red-600 hover:text-red-800"
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
    </>
  );
}

export default Protected(Bookings, ["admin"]);