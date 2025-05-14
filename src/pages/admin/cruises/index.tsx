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
  Tag
} from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  CalendarOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { collection, getDocs, doc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import Protected from '../../../components/Protected/Protected';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useMediaQuery } from 'react-responsive';
import moment from 'moment';

// Cruise interface
interface Cruise {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  description?: string;
  destination?: string;
  price?: number;
  duration?: string;
  image?: string;
  status?: string;
  startDate?: any; // Adding start date field
  createdAt?: any;
  updatedAt?: any;
  key: string;
  inclusions?: string[];
  exclusions?: string[];
  itinerary?: any[];
  isFeatured?: string;
  maxPassengers?: number;
  category?: string;
  tags?: string[];
}

function Cruises() {
  const router = useRouter();
  const [cruises, setCruises] = useState<Cruise[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<'active' | 'inactive' | 'all'>('all');
  const [featuredFilter, setFeaturedFilter] = useState<'Yes' | 'No' | 'all'>('all');
  
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
      // Fetch all cruises without filtering in the query - similar to coupons implementation
      const cruisesCollection = collection(db, "cruises");
      const cruisesQuery = query(cruisesCollection, orderBy("createdAt", "desc"));
      
      const querySnapshot = await getDocs(cruisesQuery);
      
      if (querySnapshot.empty) {
        console.log("No cruises found in collection");
        setCruises([]);
        setLoading(false);
        return;
      }
      
      // Log the raw data for debugging, similar to coupons implementation
      querySnapshot.docs.forEach(doc => {
        console.log(`Document ${doc.id}:`, doc.data());
      });
      
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
          status: docData.status || 'inactive',
          startDate: docData.startDate || null,
          createdAt: docData.createdAt || null,
          updatedAt: docData.updatedAt || null,
          inclusions: docData.inclusions || [],
          exclusions: docData.exclusions || [],
          itinerary: docData.itinerary || [],
          isFeatured: docData.isFeatured || 'No',
          maxPassengers: docData.maxPassengers || 0,
          category: docData.category || '',
          tags: docData.tags || [],
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
    console.log("Editing tour with ID:", record.id);
    router.push(`/admin/cruises/edit/${record.id}`);
  };

  const columns = [
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
      title: 'Destination',
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
      render: (price: number) => price ? `$${price.toLocaleString()}` : 'N/A',
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
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Cruise) => (
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

  // Filter data based on active status and search text - using the same approach as in coupons
  const filteredCruises = cruises.filter((cruise) => {
    const matchesStatus = activeFilter === 'all' || cruise.status === activeFilter;
    const searchLower = searchText.toLowerCase();
    
    const matchesSearch = 
      (cruise.title && cruise.title.toLowerCase().includes(searchLower)) ||
      (cruise.destination && cruise.destination.toLowerCase().includes(searchLower)) ||
      (cruise.id.toLowerCase().includes(searchLower));
    
    return matchesStatus && matchesSearch;
  });

  // Tab items for filtering - same approach as coupons
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
                <Input 
                  placeholder="Search cruises..." 
                  prefix={<SearchOutlined />}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 250 }}
                  className="py-2 text-base font-medium"
                />
                <Link href="/admin/cruises/add">
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                  >
                    {!isMobile && "Add Cruise"}
                  </Button>
                </Link>
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
    </>
  );
}

export default Protected(Cruises, ["admin"]);