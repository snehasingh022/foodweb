import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Input, Button, Table, Modal, message, Space, Tabs, Tooltip, Divider, Typography, Spin } from 'antd';
import type { InputRef } from 'antd';
import { 
  SearchOutlined, 
  DeleteOutlined,
  ExclamationCircleOutlined,
  MoreOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import Protected from '../../../components/Protected/Protected';
import { useMediaQuery } from 'react-responsive';

const { Title } = Typography;

// Define Booking interface
interface Booking {
  id: string;
  key: string;
  name: string;
  phone: string;
  tourId: string;
  tourTitle: string;
  category?: string;
  email?: string;
  message?: string;
  userId?: string;
  place?: string;
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
      
      // Log the raw data for debugging
      snapshot.docs.forEach(doc => {
        console.log(`Document ${doc.id}:`, doc.data());
      });
      
      // Map the documents to our Booking interface
      const data = snapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          key: doc.id,
          name: docData.name || '',
          phone: docData.phone || '',
          tourId: docData.tourId || '',
          tourTitle: docData.tourTitle || '',
          category: docData.category || '',
          email: docData.email || '',
          message: docData.message || '',
          userId: docData.userId || '',
          place: docData.place || '',
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

  // Filter data based on search text
  const filteredData = bookings.filter((booking) => {
    const matchesSearch = 
      booking.id.toLowerCase().includes(searchText.toLowerCase()) || 
      booking.name.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.phone.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.tourId.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.tourTitle.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  // Show delete confirmation modal
  const showDeleteModal = (record: Booking) => {
    setBookingToDelete(record);
    setDeleteModalVisible(true);
  };

  // Table columns with responsive adjustments
  const getColumns = () => {
    const baseColumns: any = [
      {
        title: 'Booking ID',
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
        title: 'Phone',
        dataIndex: 'phone',
        key: 'phone',
      },
      {
        title: 'Tour ID',
        dataIndex: 'tourId',
        key: 'tourId',
        responsive: ['sm'] as any,
      },
      {
        title: 'Tour Title',
        dataIndex: 'tourTitle',
        key: 'tourTitle',
        responsive: ['md'] as any,
      }
    ];
    
    // Add action column
    baseColumns.push({
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Booking) => (
        <Space>
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
                <Button 
                  type="primary" 
                  onClick={fetchBookings}
                  icon={<ReloadOutlined />}
                  className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                >
                  {!isMobile && "Refresh"}
                </Button>
                {loading && <Spin />}
              </div>
            </div>
          </Col>
        </Row>
        
        <Row gutter={25}>
          <Col sm={24} xs={24}>
            <Card className="h-full mb-8">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="p-6 sm:p-[30px]">
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
          <p className="mb-2 font-medium">Are you sure you want to delete the booking <strong>{bookingToDelete?.id}</strong>?</p>
          <p className="text-danger">This action cannot be undone.</p>
        </div>
      </Modal>
    </>
  );
}

export default Protected(Bookings, ["admin"]);