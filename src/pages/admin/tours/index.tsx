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
  InputRef,
  Dropdown,
  MenuProps
} from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  MoreOutlined,
  ReloadOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { collection, getDocs, doc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import Protected from '../../../components/Protected/Protected';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useMediaQuery } from 'react-responsive';

// Tour interface
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
  
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const searchInputRef = useRef<InputRef>(null);

  // Fetch tours from Firestore
  const fetchTours = async () => {
    if (typeof window === "undefined") return;
    
    try {
      setLoading(true);
      console.log("Querying Firestore for tours...");
      
      // Create a query against the collection
      const toursCollection = collection(db, "tours");
      const toursQuery = query(toursCollection, orderBy("createdAt", "desc"));
      
      // Get the snapshot
      const snapshot = await getDocs(toursQuery);
      
      if (snapshot.empty) {
        console.log("No tours found in collection");
        setTours([]);
        setLoading(false);
        return;
      }
      
      // Map the documents to our Tour interface
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
          status: (docData.status as string) || 'inactive',
          createdAt: docData.createdAt || null,
          updatedAt: docData.updatedAt || null,
          inclusions: docData.inclusions || [],
          exclusions: docData.exclusions || [],
          itinerary: docData.itinerary || [],
          featured: docData.featured || false,
          maxGroupSize: docData.maxGroupSize || 0,
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

  // Show delete confirmation modal
  const showDeleteModal = (record: Tour) => {
    setTourToDelete(record);
    setDeleteModalVisible(true);
  };

  // Confirm delete action
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

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
  };

  // Filter data based on active status and search text
  const filteredData = tours.filter((tour) => {
    const matchesStatus = activeFilter === 'all' || tour.status === activeFilter;
    const searchLower = searchText.toLowerCase();
    
    const matchesSearch = 
      (tour.id && tour.id.toLowerCase().includes(searchLower)) || 
      (tour.name && tour.name.toLowerCase().includes(searchLower)) ||
      (tour.title && tour.title.toLowerCase().includes(searchLower)) ||
      (tour.location && tour.location.toLowerCase().includes(searchLower)) ||
      (tour.description && tour.description.toLowerCase().includes(searchLower));
    
    return matchesStatus && matchesSearch;
  });

  // Action menu for mobile view
  const getActionMenu = (record: Tour): MenuProps => {
    return {
      items: [
        {
          key: '1',
          label: 'View',
          icon: <EyeOutlined />,
          onClick: () => router.push(`/admin/tours/view/${record.id}`),
        },
        {
          key: '2',
          label: 'Edit',
          icon: <EditOutlined />,
          onClick: () => router.push(`/admin/tours/edit/${record.id}`),
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
            fetchTours();
          } catch (error) {
            console.error("Error deleting cruise:", error);
            message.error("Failed to delete cruise");
          }
        }
      });
    };

  // Handle edit button click
  const handleEdit = (record: Tour) => {
    console.log("Editing tour with ID:", record.id);
    router.push(`/admin/tours/edit/${record.id}`);
  };

  // Table columns with responsive adjustments
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
        render: (text: string, record: Tour) => <span className="font-medium">{text || record.name || 'N/A'}</span>,
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
        render: (price: number) => price ? `$${price}` : 'N/A',
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
                    onClick={() => router.push(`/admin/cruises/view/${record.id}`)}
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

  // Tab items for filtering
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
                <Link href="/admin/tours/add">
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                  >
                    {!isMobile && "Add Tour"}
                  </Button>
                </Link>
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
        <div className="p-4 bg-danger-transparent rounded-lg mb-4 mt-4">
          <p className="mb-2 font-medium">Are you sure you want to delete the tour <strong>{tourToDelete?.title || tourToDelete?.name}</strong>?</p>
          <p className="text-danger">This action cannot be undone.</p>
        </div>
      </Modal>
    </>
  );
}

export default Protected(Tours, ["admin"]);