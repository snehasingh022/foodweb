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
  Spin
} from 'antd';
import { 
  SearchOutlined, 
  EyeOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined 
} from '@ant-design/icons';
import { PageHeaders } from '../../../components/page-headers/index';
import { collection, getDocs, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import Protected from '../../../components/Protected/Protected';

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
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      render: (text: string) => (
        <span className="truncate block max-w-[250px]">{text}</span>
      ),
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
           
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeaders
        className="flex items-center justify-between px-8 xl:px-[15px] pt-2 pb-6 sm:pb-[30px] bg-transparent sm:flex-col"
       
      />
      <main className="min-h-[715px] lg:min-h-[580px] px-8 xl:px-[15px] pb-[30px] bg-transparent">
        <Row gutter={25}>
          <Col sm={24} xs={24}>
            <Card className="h-full">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="p-[25px]">
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <Title level={4} className="mb-0 text-dark dark:text-white/[.87]">
                      All Customer Queries
                    </Title>
                    <div className="flex items-center gap-2">
                      <Input 
                        placeholder="Search queries..." 
                        prefix={<SearchOutlined />} 
                        onChange={e => handleSearch(e.target.value)}
                        className="min-w-[280px]"
                      />
                      <Button 
                        type="primary" 
                        onClick={fetchQueries}
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>
                  
                  <div className="table-responsive">
                    <Table
                      columns={columns}
                      dataSource={filteredQueries}
                      pagination={{ pageSize: 10 }}
                      loading={loading}
                      bordered={false}
                      className="[&>div>div>div>div>div>.ant-table-content>table>thead>tr>th]:bg-regularBG dark:[&>div>div>div>div>div>.ant-table-content>table>thead>tr>th]:bg-[#323440] [&>div>div>div>div>div>.ant-table-content>table>thead>tr>th]:font-medium"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </main>

      {/* Query Details Modal */}
      <Modal
        title={<Title level={4} className="text-lg font-semibold p-4">Query Details</Title>}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button 
            key="back" 
            size="large"
            onClick={() => setDetailModalVisible(false)}
            className="min-w-[100px] font-medium"
          >
            Close
          </Button>,
          currentQuery?.status !== 'resolved' && (
            <Button 
              key="resolve" 
              type="primary" 
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={() => handleStatusChange('resolved')}
              loading={statusUpdateLoading && currentQuery?.status !== 'resolved'}
              className="min-w-[160px] font-medium"
            >
              Mark as Resolved
            </Button>
          ),
          // currentQuery?.status !== 'rejected' && (
          //   <Button 
          //     key="reject" 
          //     danger
          //     icon={<CloseCircleOutlined />}
          //     onClick={() => handleStatusChange('rejected')}
          //     loading={statusUpdateLoading && currentQuery?.status !== 'rejected'}
          //   >
          //     Reject
          //   </Button>
          // ),
        ]}
        width={700}
        className="query-detail-modal"
        bodyStyle={{ padding: '20px 24px' }}
        maskClosable={false}
      >
        {currentQuery ? (
          <div className="p-4 bg-white dark:bg-[#1b1e2b] rounded-lg shadow-sm">
            <Spin spinning={statusUpdateLoading}>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm">Query ID:</Text>
                  <div className="mt-1">
                    <Text copyable strong className="text-base">{currentQuery.queryID}</Text>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm">Status:</Text>
                  <div className="mt-1">
                    <Tag color={
                      currentQuery.status === 'resolved' ? 'green' : 
                      currentQuery.status === 'rejected' ? 'red' : 
                      currentQuery.status === 'pending' ? 'orange' : 'blue'
                    } className="text-sm px-3 py-1">
                      {currentQuery.status?.toUpperCase() || 'ACTIVE'}
                    </Tag>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm">Name:</Text>
                  <div className="mt-1">
                    <Text strong className="text-base">{currentQuery.name}</Text>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm">Email:</Text>
                  <div className="mt-1">
                    <Text strong className="text-base">{currentQuery.email}</Text>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm">Phone:</Text>
                  <div className="mt-1">
                    <Text strong className="text-base">{currentQuery.phone || 'N/A'}</Text>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm">Date:</Text>
                  <div className="mt-1">
                    <Text strong className="text-base">
                      {currentQuery.createdAt?.toDate ? 
                        currentQuery.createdAt.toDate().toLocaleString() : 
                        new Date(currentQuery.createdAt).toLocaleString()}
                    </Text>
                  </div>
                </div>
              </div>
              
              <div className="mb-6 border-b pb-2">
                <Text type="secondary" className="text-sm">Subject:</Text>
                <div className="mt-1">
                  <Text strong className="text-base">{currentQuery.subject}</Text>
                </div>
              </div>
              
              <div>
                <Text type="secondary" className="text-sm">Message:</Text>
                <div className="mt-2 p-5 bg-regularBG dark:bg-[#323440] rounded-md border border-gray-100 dark:border-gray-700">
                  <Text className="text-base whitespace-pre-line">{currentQuery.message}</Text>
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

export default Protected(Queries, ["admin", "helpdesk"]); 