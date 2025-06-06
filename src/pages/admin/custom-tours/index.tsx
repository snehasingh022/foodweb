import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Input,
  Button,
  Table,
  Space,
  Modal,
  message,
  Tooltip,
  Tabs,
  Spin,
  Tag,
  Typography,
  Divider,
  Avatar,
  Badge,
  Image
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CalendarOutlined,
  ReloadOutlined,
  VideoCameraOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  StarOutlined,
  TagOutlined,
  FileTextOutlined,
  LinkOutlined,
  PictureOutlined,
  GlobalOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { collection, getDocs, doc, deleteDoc, query, orderBy, where, getDoc } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import Protected from '../../../components/Protected/Protected';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useMediaQuery } from 'react-responsive';
import moment from 'moment';
import type { ColumnsType } from 'antd/es/table';

const { Text, Title, Paragraph } = Typography;

// Custom Tour interface
interface CustomTour {
  id: string;
  componentID: string;
  title: string;
  description?: string;
  location?: string;
  locationType?: 'domestic' | 'international';
  price?: number;
  images?: string[];
  createdAt?: any; // Firebase timestamp
  updatedAt?: any;
  place?: string;
  key: string;
}

function CustomTours() {
  const router = useRouter();
  const [customTours, setCustomTours] = useState<CustomTour[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<'domestic' | 'international' | 'all'>('all');

  // Added for View Details Modal
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentTour, setCurrentTour] = useState<CustomTour | null>(null);
  const [tourDetailLoading, setTourDetailLoading] = useState(false);

  const isMobile = useMediaQuery({ maxWidth: 767 });

  useEffect(() => {
    // Only fetch data on the client side
    if (typeof window !== "undefined") {
      fetchCustomTours();
    }
  }, []);

  const fetchCustomTours = async () => {
    if (typeof window === "undefined") return;

    setLoading(true);
    try {
      // Fetch all custom tours from customComponents collection
      const customToursCollection = collection(db, "customComponents");
      const customToursQuery = query(customToursCollection, orderBy("createdAt", "desc"));

      const querySnapshot = await getDocs(customToursQuery);

      if (querySnapshot.empty) {
        console.log("No custom tours found in collection");
        setCustomTours([]);
        setLoading(false);
        return;
      }

      const customToursData = querySnapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          key: doc.id,
          componentID: docData.componentID || '',
          title: docData.title || '',
          description: docData.description || '',
          location: docData.location || '',
          locationType: (docData.locationType === 'international' ? 'international' : 'domestic') as 'domestic' | 'international',
          price: docData.price || 0,
          images: docData.images || [],
          createdAt: docData.createdAt || null,
          updatedAt: docData.updatedAt || null,
          place: docData.place || '',
        };
      });
      

      console.log("Processed custom tours:", customToursData);
      console.log("Location types found:", customToursData.map(tour => ({ id: tour.id, title: tour.title, locationType: tour.locationType })));
      setCustomTours(customToursData);
    } catch (error) {
      console.error("Error fetching custom tours:", error);
      message.error("Failed to fetch custom tours");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (typeof window === "undefined") return;

    Modal.confirm({
          icon: null, // Removes default icon
          title: (
            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
                Confirm Delete
              </span>
            </div>
          ),
          content: (
            <p className="p-3">
              Are you sure you want to delete this custom tour? This action cannot be undone.
            </p>
          ),
          okText: 'Yes, delete it',
          okType: 'danger',
          cancelText: 'Cancel',
          className: 'custom-confirm-modal', // Use this class for styling buttons
          onOk: async () => {
            try {
              await deleteDoc(doc(db, "customComponents", id));
              message.success("Custom tour deleted successfully");
              fetchCustomTours();
            } catch (error) {
              console.error("Error deleting custom tour:", error);
              message.error("Failed to delete custom tour");
            }
          }
        });
  };

  const handleEdit = (record: CustomTour) => {
    console.log("Editing custom tour with ID:", record.id);
    router.push(`/admin/custom-tours/edit/${record.id}`);
  };

  // View Custom Tour Details
  const handleViewDetails = async (record: CustomTour) => {
    try {
      setTourDetailLoading(true);
      setCurrentTour(record);

      // For detailed view, we fetch the complete document
      const tourRef = doc(db, "customComponents", record.id);
      const tourSnap = await getDoc(tourRef);

      if (tourSnap.exists()) {
        const tourData = tourSnap.data() as CustomTour;
        setCurrentTour({
          ...record,
          ...tourData,
          id: record.id,
          key: record.id,
          // Ensure locationType is normalized
          locationType: (tourData.locationType === 'international') ? 'international' : 'domestic',
        });
      }

      setDetailModalVisible(true);
      setTourDetailLoading(false);
    } catch (error) {
      console.error("Error fetching custom tour details:", error);
      message.error("Failed to fetch custom tour details");
      setTourDetailLoading(false);
    }
  };

  const columns: ColumnsType<CustomTour> = [
    {
      title: 'Component ID',
      dataIndex: 'componentID',
      key: 'componentID',
      render: (text: string) => <span className="font-medium">{text || 'N/A'}</span>,
      responsive: ['md'],
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <span className="font-medium">{text || 'N/A'}</span>,
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (text: string) => text || 'N/A',
      responsive: ['md'],
    },
    {
      title: 'Type',
      dataIndex: 'locationType',
      key: 'locationType',
      render: (type: string) => (
        <Tag 
          color={type === 'international' ? 'blue' : 'green'} 
          icon={type === 'international' ? <GlobalOutlined /> : <HomeOutlined />}
        >
          {type === 'international' ? 'International' : 'Domestic'}
        </Tag>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => price ? `₹${Number(price).toLocaleString()}` : 'N/A',
      responsive: ['sm'],
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: CustomTour) => (
        <Space size="middle">
          <Tooltip title="View">
            <Button
              type="text"
              icon={<EyeOutlined />}
              className="text-blue-600 hover:text-blue-800"
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              className="text-green-600 hover:text-green-800"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              className="text-red-600 hover:text-red-800"
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Filter data based on location type and search text
  const filteredCustomTours = customTours.filter((tour) => {
    // Location type filter - fixed logic
    let matchesType = true;
    if (activeFilter !== 'all') {
      matchesType = tour.locationType === activeFilter;
    }

    // Search filter
    let matchesSearch = true;

    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      matchesSearch =
        !!(tour.title && tour.title.toLowerCase().includes(searchLower)) ||
        !!(tour.location && tour.location.toLowerCase().includes(searchLower)) ||
        !!(tour.componentID && tour.componentID.toLowerCase().includes(searchLower)) ||
        !!(tour.place && tour.place.toLowerCase().includes(searchLower)) ||
        !!(tour.description && tour.description.toLowerCase().includes(searchLower));
    }
    

    return matchesType && matchesSearch;
  });

  // Get counts for each tab
  const domesticCount = customTours.filter(tour => tour.locationType === 'domestic').length;
  const internationalCount = customTours.filter(tour => tour.locationType === 'international').length;
  const totalCount = customTours.length;

  // Tab items for filtering with counts
  const locationTabItems = [
    {
      key: 'all',
      label: `All Tours `,
    },
    {
      key: 'domestic',
      label: `Domestic `,
    },
    {
      key: 'international',
      label: `International `,
    },
  ];

  // Function to format the date
  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (date.toDate) {
      return moment(date.toDate()).format('MMM DD, YYYY HH:mm');
    }
    return moment(date).format('MMM DD, YYYY HH:mm');
  };

  // Debug logging
  console.log('Current filter:', activeFilter);
  console.log('Total tours:', customTours.length);
  console.log('Filtered tours:', filteredCustomTours.length);
  console.log('Domestic tours:', domesticCount);
  console.log('International tours:', internationalCount);

  return (
    <>
      <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] pt-6 bg-transparent">
        <Row gutter={25} className="mb-5">
          <Col xs={24}>
            <div className="flex justify-between items-center mb-5 flex-wrap gap-3 p-5">
              <div className="flex-1">
                <h1 className="text-[24px] font-medium text-dark dark:text-white/[.87]">Custom Tours Management</h1>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/admin/custom-tours/add">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                  >
                    {!isMobile && "Add Custom Tour"}
                  </Button>
                </Link>
                <Input
                  placeholder="Search custom tours..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 250 }}
                  className="py-2 text-base font-medium"
                />
                {loading ? (
                  <div className="h-10 flex items-center justify-center">
                    <Spin size="small" />
                  </div>
                ) : (
                  <Button
                    type="primary"
                    onClick={fetchCustomTours}
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
                    onChange={(key) => setActiveFilter(key as 'domestic' | 'international' | 'all')}
                    items={locationTabItems}
                    className="mb-4"
                    size={isMobile ? 'small' : 'middle'}
                    centered={isMobile}
                  />

                  <div className="table-responsive">
                    <Table
                      dataSource={filteredCustomTours}
                      columns={columns}
                      pagination={{
                        pageSize: isMobile ? 5 : 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} tours`,
                        responsive: true,
                        size: isMobile ? 'small' : 'default',
                      }}
                      loading={loading}
                      rowKey="id"
                      className="[&>div>div>div>div>div>.ant-table-content>table>thead>tr>th]:bg-regularBG dark:[&>div>div>div>div>div>.ant-table-content>table>thead>tr>th]:bg-[#323440] [&>div>div>div>div>div>.ant-table-content>table>thead>tr>th]:font-medium"
                      scroll={{ x: 'max-content' }}
                      size={isMobile ? 'small' : 'middle'}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </main>

      {/* Custom Tour Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
            {currentTour && (
              <Text copyable strong className="text-base mt-2 ml-2">
                {currentTour.componentID}
              </Text>
            )}
            </span>
            
          </div>
        }
        open={detailModalVisible && currentTour !== null}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button
            key="back"
            size="large"
            onClick={() => setDetailModalVisible(false)}
            className="min-w-[100px] font-medium mb-4"
          >
            Close
          </Button>,
          <Button
            key="edit"
            type="primary"
            size="large"
            icon={<EditOutlined />}
            onClick={() => currentTour && router.push(`/admin/custom-tours/edit/${currentTour.id}`)}
            className="min-w-[120px] font-medium mb-4 mr-4"
          >
            Edit Tour
          </Button>,
        ]}
        width={900}
        className="custom-tour-detail-modal"
        bodyStyle={{ padding: '20px 24px' }}
      >
        {currentTour ? (
          <div className="p-4 bg-white dark:bg-[#1b1e2b] rounded-lg shadow-sm">
            <Spin spinning={tourDetailLoading}>
              {/* Tour Images Preview */}
              {currentTour.images && currentTour.images.length > 0 && (
                <div className="mb-6">
                  <Text type="secondary" className="text-sm flex items-center gap-1 mb-3">
                    <PictureOutlined /> Tour Images:
                  </Text>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {currentTour.images.map((imageUrl, index) => (
                      <div key={index} className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                        <Image
                          src={imageUrl}
                          alt={`${currentTour.title} - Image ${index + 1}`}
                          className="w-full aspect-video object-cover"

                          placeholder={
                            <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <PictureOutlined className="text-gray-400" />
                            </div>
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={16}>
                    <div className="border-b pb-2">
                      <Text type="secondary" className="text-sm">Title:</Text>
                      <div className="mt-1">
                        <Text strong className="text-lg">{currentTour.title || 'N/A'}</Text>
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} md={8}>
                    <div className="border-b pb-2">
                      <Text type="secondary" className="text-sm">Location Type:</Text>
                      <div className="mt-1">
                        <Tag 
                          color={currentTour.locationType === 'international' ? 'blue' : 'green'} 
                          className="text-base px-3 py-1"
                          icon={currentTour.locationType === 'international' ? <GlobalOutlined /> : <HomeOutlined />}
                        >
                          {currentTour.locationType === 'international' ? 'International' : 'Domestic'}
                        </Tag>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm flex items-center gap-1">
                    <EnvironmentOutlined /> Location:
                  </Text>
                  <div className="mt-1">
                    <Text strong className="text-base">{currentTour.location || 'N/A'}</Text>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm flex items-center gap-1">
                    <DollarOutlined /> Price:
                  </Text>
                  <div className="mt-1">
                    <Text strong className="text-base">
                      {currentTour.price ? `₹${Number(currentTour.price).toLocaleString()}` : 'N/A'}
                    </Text>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm flex items-center gap-1">
                    <CalendarOutlined /> Created At:
                  </Text>
                  <div className="mt-1">
                    <Text strong className="text-base">
                      {formatDate(currentTour.createdAt)}
                    </Text>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm flex items-center gap-1">
                    <CalendarOutlined /> Updated At:
                  </Text>
                  <div className="mt-1">
                    <Text strong className="text-base">
                      {formatDate(currentTour.updatedAt)}
                    </Text>
                  </div>
                </div>
              </div>

              {/* Place Information */}
              {currentTour.place && (
                <div className="mb-6 border-b pb-4">
                  <Text type="secondary" className="text-sm flex items-center gap-1 mb-2">
                    <TagOutlined /> Place:
                  </Text>
                  <div className="bg-regularBG dark:bg-[#323440] p-3 rounded-lg">
                    <Text className="text-base">{currentTour.place}</Text>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-6 border-b pb-4">
                <Text type="secondary" className="text-sm flex items-center gap-1 mb-2">
                  <FileTextOutlined /> Description:
                </Text>
                <div className="p-4 bg-regularBG dark:bg-[#323440] rounded-md border border-gray-100 dark:border-gray-700">
                  <Text className="text-base whitespace-pre-line">
                    {currentTour.description || 'No description available.'}
                  </Text>
                </div>
              </div>
            </Spin>
          </div>
        ) : (
          <div className="flex justify-center items-center p-10">
            <Spin size="large" />
          </div>
        )}
      </Modal>
    </>
  );
}

export default Protected(CustomTours, ["admin", "tours", "tours+media"]);