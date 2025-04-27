import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Table, 
  Space, 
  Button, 
  Tag, 
  Modal, 
  Typography, 
  Input,
  message,
  Spin,
} from 'antd';
import type { Breakpoint } from 'antd/es/_util/responsiveObserver';
import { 
  SearchOutlined, 
  EyeOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined 
} from '@ant-design/icons';
import { PageHeaders } from '../../../components/page-headers/index';
import { collection, getDocs, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';

const { Text, Title } = Typography;
const { TextArea } = Input;

// Query interface
interface CustomerQuery {
  id: string;
  queryID: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  subject: string;
  status: string;
  createdAt: any;
  updatedAt: any;
  key: string;
}

function Queries() {
  const [queries, setQueries] = useState<CustomerQuery[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentQuery, setCurrentQuery] = useState<CustomerQuery | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  const PageRoutes = [
    {
      path: '/admin',
      breadcrumbName: 'Dashboard',
    },
    {
      path: '',
      breadcrumbName: 'Customer Queries',
    },
  ];

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "queries"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const queriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        key: doc.id,
      })) as CustomerQuery[];
      setQueries(queriesData);
    } catch (error) {
      console.error("Error fetching queries:", error);
      message.error("Failed to fetch customer queries");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const filteredQueries = queries.filter(query => 
    query.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    query.email?.toLowerCase().includes(searchText.toLowerCase()) ||
    query.queryID?.toLowerCase().includes(searchText.toLowerCase()) ||
    query.subject?.toLowerCase().includes(searchText.toLowerCase())
  );

  const showQueryDetails = (query: CustomerQuery) => {
    setCurrentQuery(query);
    setDetailModalVisible(true);
  };

  const handleStatusChange = async (status: string) => {
    if (!currentQuery) return;
    
    setStatusUpdateLoading(true);
    try {
      const queryRef = doc(db, "queries", currentQuery.id);
      await updateDoc(queryRef, { 
        status: status,
        updatedAt: new Date()
      });
      
      // Update local state
      setQueries(prev => prev.map(q => 
        q.id === currentQuery.id ? { ...q, status } : q
      ));
      
      setCurrentQuery(prev => prev ? { ...prev, status } : null);
      message.success(`Query status updated to ${status}`);
    } catch (error) {
      console.error("Error updating query status:", error);
      message.error("Failed to update query status");
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'queryID',
      key: 'queryID',
      width: 120,
      render: (text: string) => <Text copyable>{text}</Text>,
      responsive: ['md', 'lg', 'xl'] as Breakpoint[],
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-medium">{text}</span>,
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'] as Breakpoint[],
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      responsive: ['lg', 'xl'] as Breakpoint[],
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      render: (text: string) => (
        <span className="truncate block max-w-xs sm:max-w-[250px]">{text}</span>
      ),
      responsive: ['sm', 'md', 'lg', 'xl'] as Breakpoint[],
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: any) => {
        const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
        return date instanceof Date && !isNaN(date.getTime())
          ? date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : 'N/A';
      },
      responsive: ['md', 'lg', 'xl'] as Breakpoint[],
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'blue';
        if (status === 'resolved') {
          color = 'green';
        } else if (status === 'pending') {
          color = 'orange';
        } else if (status === 'rejected') {
          color = 'red';
        }
        return <Tag color={color}>{status?.toUpperCase() || 'ACTIVE'}</Tag>;
      },
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'] as Breakpoint[],
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: CustomerQuery) => (
        <Space size="small">
          <Button 
            type="primary" 
            icon={<EyeOutlined />} 
            size="small" 
            onClick={() => showQueryDetails(record)}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeaders
        className="flex items-center justify-between px-4 sm:px-8 xl:px-[15px] pt-2 pb-4 sm:pb-6 bg-transparent sm:flex-row flex-col gap-4"
        title="Customer Queries"
        routes={PageRoutes}
      />
      <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] bg-transparent">
        <Row gutter={25}>
          <Col sm={24} xs={24}>
            <Card className="h-full">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="p-4 sm:p-[25px]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-dark dark:text-white/[.87] text-[16px] font-semibold">Query Management</h2>
                    <Input
                      className="w-full sm:w-64"
                      placeholder="Search by name, email, ID, or subject"
                      prefix={<SearchOutlined className="mr-2" />}
                      onChange={(e) => handleSearch(e.target.value)}
                      allowClear
                    />
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table 
                      dataSource={filteredQueries} 
                      columns={columns} 
                      loading={loading}
                      pagination={{ 
                        pageSize: 10,
                        showSizeChanger: false,
                        responsive: true,
                      }}
                      rowKey="id"
                      className="responsive-table"
                      scroll={{ x: 'max-content' }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </main>

      <Modal
        title="Query Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width="95%"
        style={{ maxWidth: '700px' }}
        className="responsive-modal"
      >
        {currentQuery && (
          <div className="p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Query ID</p>
                <p className="font-medium"><Text copyable>{currentQuery.queryID}</Text></p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Date</p>
                <p>
                  {(() => {
                    const date = currentQuery.createdAt?.toDate 
                      ? currentQuery.createdAt.toDate() 
                      : new Date(currentQuery.createdAt);
                    return date instanceof Date && !isNaN(date.getTime())
                      ? date.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'N/A';
                  })()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Name</p>
                <p className="font-medium">{currentQuery.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
                <p>{currentQuery.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Phone</p>
                <p>{currentQuery.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
                <p>
                  <Tag color={
                    currentQuery.status === 'resolved' ? 'green' :
                    currentQuery.status === 'pending' ? 'orange' :
                    currentQuery.status === 'rejected' ? 'red' : 'blue'
                  }>
                    {currentQuery.status?.toUpperCase() || 'ACTIVE'}
                  </Tag>
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Subject</p>
              <p className="font-medium">{currentQuery.subject}</p>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Message</p>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {currentQuery.message}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                type="default"
                onClick={() => setDetailModalVisible(false)}
              >
                Close
              </Button>
              <Button 
                type="primary" 
                icon={<CheckCircleOutlined />}
                className="bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700"
                onClick={() => handleStatusChange('resolved')}
                loading={statusUpdateLoading && currentQuery.status !== 'resolved'}
                disabled={currentQuery.status === 'resolved'}
              >
                Mark as Resolved
              </Button>
              <Button 
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleStatusChange('rejected')}
                loading={statusUpdateLoading && currentQuery.status !== 'rejected'}
                disabled={currentQuery.status === 'rejected'}
              >
                Reject
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default Queries; 