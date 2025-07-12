import React, { useState, useEffect, useRef } from 'react';
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
  Switch,
  InputRef,
  Typography
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PaperClipOutlined,
  GiftOutlined
} from '@ant-design/icons';
import { collection, getDocs, doc, deleteDoc, query, orderBy, where, getDoc } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import Protected from '../../../components/Protected/Protected';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useMediaQuery } from 'react-responsive';

const { Text } = Typography;

interface Tour {
  id: string;
  name: string;
  slug: string;
  description?: string;
  location?: string;
  price?: number;
  duration?: string;
  image?: string;
  status?: string;
  createdAt?: {
    toDate: () => Date;
  } | null;
  updatedAt?: {
    toDate: () => Date;
  } | null;
  key: string;
  inclusions?: string[];
  exclusions?: string[];
  itinerary?: any[];
  featured?: boolean;
  maxGroupSize?: number;
  title?: string;
  flightIncluded?: boolean;
  numberofDays?: number;
  numberofNights?: number;
  isFeatured?: boolean;
  isStartDate?: boolean;
  startDate?: string | null;
  imageURL?: string;
  itenaries?: Record<string, any>;
  tourType?: string;
  isOffered?: boolean;
  priceShow?: boolean;
  videoURL?: string;
  themeType?: string;
  categoryDetails?: Record<string, any>;
  included?: {
    breakfast?: boolean;
    dinner?: boolean;
    flights?: boolean;
    hotel?: boolean;
    lunch?: boolean;
    sightseeing?: boolean;
    transfers?: boolean;
  };
  includedMore?: string[];
  notIncluded?: string[];
  dos?: string[];
  donts?: string[];
  tags?: Record<string, any>;
}

function Tours() {
  const router = useRouter();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<'active' | 'inactive' | 'all'>('all');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [tourToDelete, setTourToDelete] = useState<Tour | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentTour, setCurrentTour] = useState<Tour | null>(null);
  const [tourDetailLoading, setTourDetailLoading] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const searchInputRef = useRef<InputRef>(null);
  const [offeredFilter, setOfferedFilter] = useState(false);
  const [featuredFilter, setFeaturedFilter] = useState(false);

  const fetchTours = async () => {
    if (typeof window === "undefined") return;

    try {
      setLoading(true);
      console.log("Querying Firestore for tours...");
      const toursCollection = collection(db, "tours");
      const toursQuery = query(toursCollection, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(toursQuery);

      if (snapshot.empty) {
        console.log("No tours found in collection");
        setTours([]);
        setLoading(false);
        return;
      }

      const data = snapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          key: doc.id,
          name: docData.name || '',
          title: docData.title || docData.name || '',
          slug: docData.slug || '',
          description: docData.description || '',
          location: docData.location || '',
          price: docData.price || 0,
          duration: docData.duration || '',
          image: docData.image || '',
          imageURL: docData.imageURL || '',
          status: (docData.status as string) || 'inactive',
          createdAt: docData.createdAt || null,
          updatedAt: docData.updatedAt || null,
          inclusions: docData.inclusions || [],
          exclusions: docData.exclusions || [],
          itinerary: docData.itinerary || [],
          itenaries: docData.itenaries || {},
          featured: docData.featured || false,
          maxGroupSize: docData.maxGroupSize || 0,
          flightIncluded: docData.flightIncluded || false,
          numberofDays: docData.numberofDays || 0,
          numberofNights: docData.numberofNights || 0,
          isFeatured: docData.isFeatured || false,
          isStartDate: docData.isStartDate || false,
          startDate: docData.startDate || null,
          tourType: docData.tourType || '',
          isOffered: docData.isOffered || false,
          priceShow: docData.priceShow || false,
          videoURL: docData.videoURL || '',
          themeType: docData.themeType || '',
          categoryDetails: docData.categoryDetails || {},
          included: docData.included || {},
          includedMore: docData.includedMore || [],
          notIncluded: docData.notIncluded || [],
          dos: docData.dos || [],
          donts: docData.donts || [],
          tags: docData.tags || {},
        };
      });

      console.log("Processed tours:", data);
      setTours(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tours:", error);
      message.error("Failed to fetch tours");
      setLoading(false);
    }
  };


  useEffect(() => {
    console.log("Fetching tours on component mount...");
    fetchTours();
  }, []);

  const confirmDelete = async () => {
    try {
      setSubmitLoading(true);
      if (tourToDelete) {
        const ref = doc(db, "tours", tourToDelete.id);
        await deleteDoc(ref);
        message.success("Tour deleted successfully");
        fetchTours();
        setDeleteModalVisible(false);
      }
      setSubmitLoading(false);
    } catch (error) {
      console.error("Error deleting tour:", error);
      message.error("Failed to delete tour");
      setSubmitLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
  };

  const filteredData = tours.filter((tour) => {
    const matchesStatus = activeFilter === 'all' || tour.status === activeFilter;
    const matchesOffered = !offeredFilter || tour.isOffered === true;
    const matchesFeatured = !featuredFilter || tour.isFeatured === true || tour.featured === true;
    const searchLower = searchText.toLowerCase();

    const matchesSearch =
      (tour.id && tour.id.toLowerCase().includes(searchLower)) ||
      (tour.name && tour.name.toLowerCase().includes(searchLower)) ||
      (tour.title && tour.title.toLowerCase().includes(searchLower)) ||
      (tour.location && tour.location.toLowerCase().includes(searchLower)) ||
      (tour.description && tour.description.toLowerCase().includes(searchLower));

    return matchesStatus && matchesSearch && matchesOffered && matchesFeatured;
  });

  const handleDelete = async (id: string) => {
    if (typeof window === "undefined") return;

    Modal.confirm({
      icon: null,
      title: (
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
            Confirm Delete
          </span>
        </div>
      ),
      content: (
        <p className="p-3">
          Are you sure you want to delete this tour? This action cannot be undone.
        </p>
      ),
      okText: 'Yes, delete it',
      okType: 'danger',
      cancelText: 'Cancel',
      className: 'custom-confirm-modal',
      onOk: async () => {
        try {
          await deleteDoc(doc(db, "tours", id));
          message.success("Tour deleted successfully");
          fetchTours();
        } catch (error) {
          console.error("Error deleting tour:", error);
          message.error("Failed to delete tour");
        }
      }
    });

  };

  const handleEdit = (record: Tour) => {
    console.log("Editing tour with ID:", record.id);
    router.push(`/admin/tours/edit/${record.id}`);
  };

  const getColumns = () => {
    const baseColumns: any = [
      {
        title: 'Tour ID',
        dataIndex: 'id',
        key: 'id',
        render: (text: string) => <span className="font-medium">{text}</span>,
      },
      {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        render: (text: string, record: Tour) => {
          const titleText = text || record.name || 'N/A';
          const words = titleText.split(' ');
          const truncatedTitle = words.length > 4
            ? words.slice(0, 4).join(' ') + '...'
            : titleText;
          return <span className="font-medium">{truncatedTitle}</span>;
        },
      },
      {
        title: 'Location',
        dataIndex: 'location',
        key: 'location',
        render: (text: string) => text || 'N/A',
        responsive: ['sm'] as any,
      },
      {
        title: 'Price',
        dataIndex: 'price',
        key: 'price',
        render: (price: number) => price ? `₹${price}` : 'N/A',
        responsive: ['sm'] as any,
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
        title: 'Created At',
        dataIndex: 'createdAt',
        key: 'createdAt',
        responsive: ['md'] as any,
        render: (createdAt: Tour['createdAt']) =>
          createdAt && typeof createdAt.toDate === 'function'
            ? new Date(createdAt.toDate()).toLocaleString()
            : 'N/A',
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_: any, record: Tour) => (
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
                onClick={() => handleEdit(record)}
                className="text-green-600 hover:text-green-800"
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id)}
                className="text-red-600 hover:text-red-800"
              />
            </Tooltip>
          </Space>
        ),
      },
    ];

    return baseColumns;
  };

  const tabItems = [
    {
      key: 'all',
      label: 'All Tours',
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

  const handleViewDetails = async (record: Tour) => {
    try {
      setTourDetailLoading(true);
      setCurrentTour(record);

      const tourRef = doc(db, "tours", record.id);
      const tourSnap = await getDoc(tourRef);

      if (tourSnap.exists()) {
        const tourData = tourSnap.data() as Tour;

        const processedTour = {
          ...record,
          ...tourData,
          id: record.id,
          key: record.id,
          title: tourData.title || tourData.name || record.title || record.name,
          itenaries: processItineraries(tourData.itenaries || {}),
          tags: processTags((tourData as any).tags || {}),
        };

        setCurrentTour(processedTour);
      }

      setDetailModalVisible(true);
      setTourDetailLoading(false);
    } catch (error) {
      console.error("Error fetching tour details:", error);
      message.error("Failed to fetch tour details");
      setTourDetailLoading(false);
    }
  };

  const processItineraries = (itenaries: Record<string, any>) => {
    const processed: Record<string, any> = {};

    Object.keys(itenaries).forEach(day => {
      const dayData = itenaries[day];

      processed[day] = {
        ...dayData,
        imageURL: Array.isArray(dayData.imageURL) ? dayData.imageURL :
          (dayData.imageURL ? [dayData.imageURL] : [])
      };
    });
    return processed;
  };

  const processTags = (tags: Record<string, any>) => {
    if (!tags || Object.keys(tags).length === 0) return {};
    return tags;
  };

  return (
    <>
      <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] pt-6 bg-transparent">
        <Row gutter={25} className="mb-5">
          <Col xs={24}>
            <div className="flex justify-between items-center mb-5 flex-wrap gap-3 p-5">
              <div className="flex-1">
                <h1 className="text-[24px] font-medium text-dark dark:text-white/[.87]">
                  {isMobile ? 'Tours' : 'Tour Management'}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/admin/tours/add">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                  >
                    {!isMobile && "Add Tour"}
                  </Button>
                </Link>
                <Input
                  placeholder="Search tours..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={handleSearchChange}
                  style={{ width: 250 }}
                  className="py-2 text-base font-medium"
                  ref={searchInputRef}
                  allowClear
                />
                {loading ? (
                  <div className="h-10 flex items-center justify-center">
                    <Spin size="small" />
                  </div>
                ) : (
                  <Button
                    type="primary"
                    onClick={fetchTours}
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
                  <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <Tabs
                      activeKey={activeFilter}
                      onChange={(key) => setActiveFilter(key as 'active' | 'inactive' | 'all')}
                      items={tabItems}
                      size={isMobile ? 'small' : 'middle'}
                      centered={isMobile}
                      className="flex-1 min-w-0"
                    />
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded border">
                        <GiftOutlined className="text-orange-500" />
                        <span className="text-sm">Offered</span>
                        <Switch
                          size="small"
                          className="custom-switch"
                          checked={offeredFilter}
                          onChange={setOfferedFilter}
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded border">
                        <span className="text-purple-500">⭐</span>
                        <span className="text-sm">Featured</span>
                        <Switch
                          size="small"
                          className="custom-switch"
                          checked={featuredFilter}
                          onChange={setFeaturedFilter}
                        />
                      </div>
                    </div>
                  </div>
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
        <div className="p-4 bg-danger-transparent rounded-lg mb-4 mt-4">
          <p className="mb-2 font-medium">Are you sure you want to delete the tour <strong>{tourToDelete?.title || tourToDelete?.name}</strong>?</p>
          <p className="text-danger">This action cannot be undone.</p>
        </div>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              Tour Details
              {currentTour && (
                <Text copyable={{ text: currentTour.id }} className="ml-2">
                  ID: {currentTour.id}
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
            onClick={() => currentTour && router.push(`/admin/tours/edit/${currentTour.id}`)}
            className="min-w-[120px] font-medium mb-4 mr-4"
          >
            Edit Tour
          </Button>,
        ]}
        width={800}
        className="tour-detail-modal"
        bodyStyle={{ padding: '20px 24px' }}
        maskClosable={false}
        destroyOnClose={true}
      >
        {currentTour ? (
          <div className="p-4 bg-white dark:bg-[#1b1e2b] rounded-lg shadow-sm">
            <Spin spinning={tourDetailLoading}>
              {currentTour.imageURL && (
                <div className="mb-6 rounded-lg overflow-hidden">
                  <img
                    src={currentTour.imageURL}
                    alt={currentTour.title || "Tour image"}
                    className="w-full h-auto object-cover"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm">Title:</Text>
                  <div className="mt-1">
                    <Text strong className="text-base">{currentTour.title || currentTour.name || 'N/A'}</Text>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm">Location:</Text>
                  <div className="mt-1">
                    <Text strong className="text-base">{currentTour.location || 'N/A'}</Text>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm">Price:</Text>
                  <div className="mt-1 flex items-center gap-2">
                    <Text strong className="text-base">
                      {currentTour.price ? `₹${currentTour.price.toLocaleString()}` : 'N/A'}
                    </Text>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm">Duration:</Text>
                  <div className="mt-1">
                    <Text strong className="text-base">
                      {currentTour.numberofDays && currentTour.numberofNights ?
                        `${currentTour.numberofNights} Nights / ${currentTour.numberofDays} Days` :
                        currentTour.duration || 'N/A'}
                    </Text>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm">Status:</Text>
                  <div className="mt-1">
                    <Tag color={currentTour.status === 'active' ? 'green' : 'red'}>
                      {currentTour.status || 'inactive'}
                    </Tag>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm">Tour Type:</Text>
                  <div className="mt-1">
                    <Tag color="blue">
                      {currentTour.tourType ? currentTour.tourType.charAt(0).toUpperCase() + currentTour.tourType.slice(1) : 'N/A'}
                    </Tag>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm">Flight Included:</Text>
                  <div className="mt-1">
                    <Tag color={currentTour.flightIncluded ? 'blue' : 'default'}>
                      {currentTour.flightIncluded ? 'Yes' : 'No'}
                    </Tag>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm">Featured:</Text>
                  <div className="mt-1">
                    <Tag color={currentTour.isFeatured || currentTour.featured ? 'purple' : 'default'}>
                      {currentTour.isFeatured || currentTour.featured ? 'Yes' : 'No'}
                    </Tag>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm">Special Offer:</Text>
                  <div className="mt-1">
                    <Tag color={currentTour.isOffered ? 'orange' : 'default'} icon={currentTour.isOffered ? <GiftOutlined /> : null}>
                      {currentTour.isOffered ? 'Offered' : 'Not Offered'}
                    </Tag>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm">Theme Type:</Text>
                  <div className="mt-1">
                    <Text strong className="text-base">{currentTour.themeType || 'N/A'}</Text>
                  </div>
                </div>
                {currentTour.isStartDate && currentTour.startDate && (
                  <div className="border-b pb-2 col-span-2">
                    <Text type="secondary" className="text-sm">Start Date:</Text>
                    <div className="mt-1">
                      <Text strong className="text-base">{currentTour.startDate}</Text>
                    </div>
                  </div>
                )}
                {currentTour.videoURL && (
                  <div className="border-b pb-2 col-span-2">
                    <Text type="secondary" className="text-sm">Video URL:</Text>
                    <div className="mt-1">
                      <Text copyable className="text-base">{currentTour.videoURL}</Text>
                    </div>
                  </div>
                )}
                <div className="border-b pb-2 col-span-2">
                  <Text type="secondary" className="text-sm">Slug:</Text>
                  <div className="mt-1">
                    <Text copyable className="text-base">{currentTour.slug || 'N/A'}</Text>
                  </div>
                </div>
              </div>

              {/* Inclusions Section */}
              {currentTour.included && Object.keys(currentTour.included).length > 0 && (
                <div className="mb-6 border-b pb-4">
                  <Text strong className="text-lg mb-3 block">What's Included</Text>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(currentTour.included).map(([key, value]) => (
                      <Tag key={key} color={value ? 'green' : 'red'} className="mb-1">
                        {key.charAt(0).toUpperCase() + key.slice(1)}: {value ? 'Yes' : 'No'}
                      </Tag>
                    ))}
                  </div>
                  {currentTour.includedMore && currentTour.includedMore.length > 0 && (
                    <div className="mt-3">
                      <Text type="secondary" className="text-sm block mb-2">Additional Inclusions:</Text>
                      <div className="flex flex-wrap gap-1">
                        {currentTour.includedMore.map((item, index) => (
                          <Tag key={index} color="cyan">{item}</Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Not Included Section */}
              {currentTour.notIncluded && currentTour.notIncluded.length > 0 && (
                <div className="mb-6 border-b pb-4">
                  <Text strong className="text-lg mb-3 block">What's Not Included</Text>
                  <div className="flex flex-wrap gap-1">
                    {currentTour.notIncluded.map((item, index) => (
                      <Tag key={index} color="red">{item}</Tag>
                    ))}
                  </div>
                </div>
              )}

              {/* Do's and Don'ts Section */}
              {((currentTour.dos && currentTour.dos.length > 0) || (currentTour.donts && currentTour.donts.length > 0)) && (
                <div className="mb-6 border-b pb-4">
                  <Text strong className="text-lg mb-3 block">Guidelines</Text>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentTour.dos && currentTour.dos.length > 0 && (
                      <div>
                        <Text type="secondary" className="text-sm block mb-2">Do's:</Text>
                        <div className="space-y-1">
                          {currentTour.dos.map((item, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <span className="text-green-500 text-xs mt-1">✓</span>
                              <Text className="text-sm">{item}</Text>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {currentTour.donts && currentTour.donts.length > 0 && (
                      <div>
                        <Text type="secondary" className="text-sm block mb-2">Don'ts:</Text>
                        <div className="space-y-1">
                          {currentTour.donts.map((item, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <span className="text-red-500 text-xs mt-1">✗</span>
                              <Text className="text-sm">{item}</Text>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentTour.itenaries && Object.keys(currentTour.itenaries).length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <PaperClipOutlined />
                    <Text strong className="text-lg">Itinerary Details</Text>
                  </div>

                  <Tabs
                    defaultActiveKey="Day1"
                    type="card"
                    items={Object.keys(currentTour.itenaries)
                      .sort((a, b) => {
                        const numA = parseInt(a.replace('Day', ''));
                        const numB = parseInt(b.replace('Day', ''));
                        return numA - numB;
                      })
                      .map(day => {
                        const itinerary = currentTour.itenaries?.[day];
                        return {
                          key: day,
                          label: `Day ${day.replace('Day', '')}`,
                          children: (
                            <div className="border p-4 rounded-md bg-white/50 dark:bg-gray-800/50">
                              <div className="mb-3">
                                <Text strong className="text-base">
                                  {itinerary?.title || 'Day Activity'}
                                </Text>
                              </div>
                              <div className="mb-4">
                                <Text className="text-sm whitespace-pre-line">
                                  {itinerary?.description || 'No description available'}
                                </Text>
                              </div>

                              {itinerary?.imageURL && itinerary.imageURL.length > 0 && (
                                <div>
                                  <Text type="secondary" className="text-sm mb-2 block">Day Images:</Text>
                                  <div className="grid grid-cols-3 gap-2">
                                    {(itinerary.imageURL as string[]).map((img: string, index: number) => (
                                      <div key={index} className="relative rounded-md overflow-hidden h-24">
                                        <img
                                          src={img}
                                          alt={`Day ${day.replace('Day', '')} - Image ${index + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        };
                      })
                    }
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card size="small" title="Timestamps" className="w-full">
                  <div className="flex flex-col gap-2">
                    <div>
                      <Text type="secondary" className="text-xs">Created:</Text>
                      <div>
                        {currentTour.createdAt && typeof currentTour.createdAt.toDate === 'function' ?
                          new Date(currentTour.createdAt.toDate()).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <Text type="secondary" className="text-xs">Updated:</Text>
                      <div>
                        {currentTour.updatedAt && typeof currentTour.updatedAt.toDate === 'function' ?
                          new Date(currentTour.updatedAt.toDate()).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </Card>

                {(currentTour as any).tags && Object.keys((currentTour as any).tags).length > 0 && (
                  <Card size="small" title="Tags" className="w-full">
                    <div className="flex flex-wrap gap-2">
                      {Object.values((currentTour as any).tags).map((tag: any, index: number) => (
                        <Tag key={index} color="blue">{tag.name || 'Unnamed Tag'}</Tag>
                      ))}
                    </div>
                  </Card>
                )}

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

export default Protected(Tours, ["admin", "tours", "tours+media","partner"]);
