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
  Badge
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
  LinkOutlined
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

// Cruise interface
interface Cruise {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  description?: string;
  destination?: string;
  location?: string;
  price?: number | string;
  duration?: string;
  image?: string;
  imageURL?: string;
  status?: string;
  startDate?: any; // Firebase timestamp
  createdAt?: any;
  updatedAt?: any;
  key: string;
  inclusions?: string[];
  exclusions?: string[];
  itinerary?: any[];
  isFeatured?: string | boolean;
  maxPassengers?: number;
  category?: string;
  tags?: string[];
  cruiseType?: string;
  numberofDays?: number;
  numberofNights?: number;
  videoURL?: string;
  categoryDetails?: {
    name?: string;
    description?: string;
    categoryID?: string;
  };
}

function Cruises() {
  const router = useRouter();
  const [cruises, setCruises] = useState<Cruise[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<'active' | 'inactive' | 'all'>('all');

  // Added for View Details Modal
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentCruise, setCurrentCruise] = useState<Cruise | null>(null);
  const [cruiseDetailLoading, setCruiseDetailLoading] = useState(false);

  const isMobile = useMediaQuery({ maxWidth: 767 });

  useEffect(() => {
    // Only fetch data on the client side
    if (typeof window !== "undefined") {
      fetchCruises();
    }
  }, []);

  const fetchCruises = async () => {
    if (typeof window === "undefined") return;

    setLoading(true);
    try {
      // Fetch all cruises without filtering in the query
      const cruisesCollection = collection(db, "cruises");
      const cruisesQuery = query(cruisesCollection, orderBy("createdAt", "desc"));

      const querySnapshot = await getDocs(cruisesQuery);

      if (querySnapshot.empty) {
        console.log("No cruises found in collection");
        setCruises([]);
        setLoading(false);
        return;
      }

      const cruisesData = querySnapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          key: doc.id,
          title: docData.title || '',
          slug: docData.slug || '',
          summary: docData.summary || '',
          description: docData.description || '',
          location: docData.location || '',
          price: docData.price || 0,
          duration: docData.duration || '',
          image: docData.image || '',
          imageURL: docData.imageURL || '',
          status: docData.status || 'inactive',
          startDate: docData.startDate || null,
          createdAt: docData.createdAt || null,
          updatedAt: docData.updatedAt || null,
          inclusions: docData.inclusions || [],
          exclusions: docData.exclusions || [],
          itinerary: docData.itinerary || [],
          isFeatured: docData.isFeatured || false,
          maxPassengers: docData.maxPassengers || 0,
          category: docData.category || '',
          tags: docData.tags || [],
          cruiseType: docData.cruiseType || '',
          numberofDays: docData.numberofDays || 0,
          numberofNights: docData.numberofNights || 0,
          videoURL: docData.videoURL || '',
          categoryDetails: docData.categoryDetails || {},
        };
      });

      console.log("Processed cruises:", cruisesData);
      setCruises(cruisesData);
    } catch (error) {
      console.error("Error fetching cruises:", error);
      message.error("Failed to fetch cruises");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (typeof window === "undefined") return;

    Modal.confirm({
      title: 'Are you sure you want to delete this cruise?',
      content: 'This action cannot be undone',
      okText: 'Yes, delete it',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteDoc(doc(db, "cruises", id));
          message.success("Cruise deleted successfully");
          fetchCruises();
        } catch (error) {
          console.error("Error deleting cruise:", error);
          message.error("Failed to delete cruise");
        }
      }
    });
  };

  const handleEdit = (record: Cruise) => {
    console.log("Editing cruise with ID:", record.id);
    router.push(`/admin/cruises/edit/${record.id}`);
  };

  // View Cruise Details
  const handleViewDetails = async (record: Cruise) => {
    try {
      setCruiseDetailLoading(true);
      setCurrentCruise(record);

      // For detailed view, we fetch the complete document
      const cruiseRef = doc(db, "cruises", record.id);
      const cruiseSnap = await getDoc(cruiseRef);

      if (cruiseSnap.exists()) {
        const cruiseData = cruiseSnap.data() as Cruise;
        setCurrentCruise({
          ...record,
          ...cruiseData,
          id: record.id,
          key: record.id,
        });
      }

      setDetailModalVisible(true);
      setCruiseDetailLoading(false);
    } catch (error) {
      console.error("Error fetching cruise details:", error);
      message.error("Failed to fetch cruise details");
      setCruiseDetailLoading(false);
    }
  };

  const columns: ColumnsType<Cruise> = [
    {
      title: 'Cruise ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <span className="font-medium">{text.substring(0, 8)}...</span>,
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
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: any) => {
        if (!date) return 'N/A';
        // Handle both Firestore Timestamp and string date formats
        if (date.toDate) {
          return moment(date.toDate()).format('MMM DD, YYYY');
        }
        return moment(date).format('MMM DD, YYYY');
      },
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number | string) => price ? `₹${Number(price).toLocaleString()}` : 'N/A',
      responsive: ['sm'],
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span className={`px-3 py-1 rounded-full text-xs ${status === 'active' ? 'bg-success-transparent text-success' : 'bg-danger-transparent text-danger'}`}>
          {status || 'inactive'}
        </span>
      ),
    },
    {
      title: 'Featured',
      dataIndex: 'isFeatured',
      key: 'isFeatured',
      render: (isFeatured: boolean | string) => {
        const featured = isFeatured === true || isFeatured === 'Yes';
        return (
          <Tag color={featured ? 'gold' : 'default'}>
            {featured ? 'Yes' : 'No'}
          </Tag>
        );
      },
      responsive: ['lg'],
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Cruise) => (
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

  // Filter data based on active status and search text
  const filteredCruises = cruises.filter((cruise) => {
    const matchesStatus = activeFilter === 'all' || cruise.status === activeFilter;
    const searchLower = searchText.toLowerCase();

    const matchesSearch =
      (cruise.title && cruise.title.toLowerCase().includes(searchLower)) ||
      (cruise.location && cruise.location.toLowerCase().includes(searchLower)) ||
      (cruise.id.toLowerCase().includes(searchLower));

    return matchesStatus && matchesSearch;
  });

  // Tab items for filtering
  const statusTabItems = [
    {
      key: 'all',
      label: 'All Cruises',
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

  // Function to format the date
  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (date.toDate) {
      return moment(date.toDate()).format('MMM DD, YYYY');
    }
    return moment(date).format('MMM DD, YYYY');
  };

  return (
    <>
      <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] pt-6 bg-transparent">
        <Row gutter={25} className="mb-5">
          <Col xs={24}>
            <div className="flex justify-between items-center mb-5 flex-wrap gap-3 p-5">
              <div className="flex-1">
                <h1 className="text-[24px] font-medium text-dark dark:text-white/[.87]">Cruise Management</h1>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/admin/cruises/add">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                  >
                    {!isMobile && "Add Cruise"}
                  </Button>
                </Link>
                <Input
                  placeholder="Search cruises..."
                  prefix={<SearchOutlined />}
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
                    onClick={fetchCruises}
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
                    items={statusTabItems}
                    className="mb-4"
                    size={isMobile ? 'small' : 'middle'}
                    centered={isMobile}
                  />

                  <div className="table-responsive">
                    <Table
                      dataSource={filteredCruises}
                      columns={columns}
                      pagination={{
                        pageSize: isMobile ? 5 : 10,
                        showSizeChanger: false,
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

      {/* Cruise Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              {currentCruise && <Text copyable strong className="text-base mt-10 ml-2">{currentCruise.id}</Text>}
            </span>
          </div>

        }
        open={detailModalVisible && currentCruise !== null}
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
            onClick={() => currentCruise && router.push(`/admin/cruises/edit/${currentCruise.id}`)}
            className="min-w-[120px] font-medium mb-4 mr-4"
          >
            Edit Cruise
          </Button>,
        ]}
        width={800}
        className="cruise-detail-modal"
        bodyStyle={{ padding: '20px 24px' }}
        maskClosable={false}
      >
        {currentCruise ? (
          <div className="p-4 bg-white dark:bg-[#1b1e2b] rounded-lg shadow-sm">
            <Spin spinning={cruiseDetailLoading}>
              {/* Cruise Image Preview */}
              {currentCruise.imageURL && (
                <div className="mb-6 rounded-lg overflow-hidden">
                  <img
                    src={currentCruise.imageURL}
                    alt={currentCruise.title || "Cruise image"}
                    className="w-full h-auto object-cover"
                    style={{ maxHeight: '250px' }}
                  />
                </div>
              )}

              <div className="mb-6">
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={16}>
                    <div className="border-b pb-2">
                      <Text type="secondary" className="text-sm">Title:</Text>
                      <div className="mt-1">
                        <Text strong className="text-lg">{currentCruise.title || 'N/A'}</Text>
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} md={8}>
                    <div className="border-b pb-2">
                      <Text type="secondary" className="text-sm">Status:</Text>
                      <div className="mt-1">
                        <Tag color={currentCruise.status === 'active' ? 'green' : 'red'} className="text-base px-3 py-1">
                          {currentCruise.status || 'inactive'}
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
                    <Text strong className="text-base">{currentCruise.location || 'N/A'}</Text>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm flex items-center gap-1">
                    <CalendarOutlined /> Start Date:
                  </Text>
                  <div className="mt-1">
                    <Text strong className="text-base">
                      {formatDate(currentCruise.startDate)}
                    </Text>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm flex items-center gap-1">
                    <DollarOutlined /> Price:
                  </Text>
                  <div className="mt-1">
                    <Text strong className="text-base">
                      {currentCruise.price ? `₹${Number(currentCruise.price).toLocaleString()}` : 'N/A'}
                    </Text>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm flex items-center gap-1">
                    <ClockCircleOutlined /> Duration:
                  </Text>
                  <div className="mt-1">
                    <Text strong className="text-base">
                      {currentCruise.numberofDays && currentCruise.numberofNights ?
                        `${currentCruise.numberofNights} Nights / ${currentCruise.numberofDays} Days` :
                        currentCruise.duration || 'N/A'}
                    </Text>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm flex items-center gap-1">
                    <StarOutlined /> Featured:
                  </Text>
                  <div className="mt-1">
                    <Tag color={currentCruise.isFeatured === true || currentCruise.isFeatured === 'Yes' ? 'gold' : 'default'} className="text-base px-3 py-1">
                      {currentCruise.isFeatured === true || currentCruise.isFeatured === 'Yes' ? 'Yes' : 'No'}
                    </Tag>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm flex items-center gap-1">
                    <TagOutlined /> Cruise Type:
                  </Text>
                  <div className="mt-1">
                    <Tag color="blue" className="text-base capitalize px-3 py-1">
                      {currentCruise.cruiseType || 'N/A'}
                    </Tag>
                  </div>
                </div>
              </div>

              {/* Video Attachment */}
              {currentCruise.videoURL && (
                <div className="mb-6">
                  <Text type="secondary" className="text-sm flex items-center gap-1 mb-2">
                    <VideoCameraOutlined /> Video Attachment:
                  </Text>
                  <div className="bg-regularBG dark:bg-[#323440] p-3 rounded-lg">
                    <a
                      href={currentCruise.videoURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-500 hover:text-blue-700"
                    >
                      <Button
                        icon={<VideoCameraOutlined />}
                        type="primary"
                        ghost
                      >
                        View Video
                      </Button>
                    </a>
                  </div>
                </div>
              )}

              {/* Category Details */}
              {currentCruise.categoryDetails && Object.keys(currentCruise.categoryDetails).length > 0 && (
                <div className="mb-6 border-b pb-4">
                  <Text type="secondary" className="text-sm flex items-center gap-1 mb-2">
                    <FileTextOutlined /> Category Details:
                  </Text>
                  <div className="bg-regularBG dark:bg-[#323440] p-4 rounded-lg">
                    <p><strong>Name:</strong> {currentCruise.categoryDetails.name || 'N/A'}</p>
                    {currentCruise.categoryDetails.categoryID && (
                      <p><strong>Category ID:</strong> {currentCruise.categoryDetails.categoryID}</p>
                    )}
                    {currentCruise.categoryDetails.description && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {currentCruise.categoryDetails.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-6 border-b pb-4">
                <Text type="secondary" className="text-sm flex items-center gap-1 mb-2">
                  <FileTextOutlined /> Description:
                </Text>
                <div className="p-4 bg-regularBG dark:bg-[#323440] rounded-md border border-gray-100 dark:border-gray-700">
                  <Text className="text-base whitespace-pre-line">{currentCruise.description || 'No description available.'}</Text>
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

export default Protected(Cruises, ["admin"]);