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
  Tooltip,
  Tabs
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PaperClipOutlined
} from '@ant-design/icons';
import { collection, getDocs, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import Protected from '../../../components/Protected/Protected';
import { useMediaQuery } from 'react-responsive';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

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
  attachmentURL?: string;
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
  const [activeTab, setActiveTab] = useState('all');

  const isMobile = useMediaQuery({ maxWidth: 767 });

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

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  const filteredQueries = queries.filter(query => {
    // First filter by search text
    const matchesSearch =
      query.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      query.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      query.queryID?.toLowerCase().includes(searchText.toLowerCase()) ||
      query.subject?.toLowerCase().includes(searchText.toLowerCase());

    // Then filter by tab selection
    if (activeTab === 'all') {
      return matchesSearch;
    } else if (activeTab === 'pending') {
      return matchesSearch && query.status === 'pending';
    } else if (activeTab === 'resolved') {
      return matchesSearch && query.status === 'resolved';
    }

    return matchesSearch;
  });

  const showQueryDetails = (query: CustomerQuery) => {
    setCurrentQuery(query);
    setDetailModalVisible(true);
  };

  const handleOpenAttachment = (url: string | undefined) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      message.error("Attachment URL is not available");
    }
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

      // Close modal if we're switching to a different tab view
      if ((activeTab === 'pending' && status === 'resolved') ||
        (activeTab === 'resolved' && status === 'pending')) {
        setDetailModalVisible(false);
      }
    } catch (error) {
      console.error("Error updating query status:", error);
      message.error("Failed to update query status");
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const getColumns = () => {
    const baseColumns = [
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
        title: 'Actions',
        key: 'actions',
        width: 100,
        render: (_: any, record: CustomerQuery) => (
          <Space size="small">
            <Tooltip title="View">
              <Button
                type="text"
                icon={<EyeOutlined />}
                className="text-blue-600 hover:text-blue-800"
                onClick={() => showQueryDetails(record)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ];

    // Only show status column in 'all' tab
    if (activeTab === 'all') {
      return [
        ...baseColumns.slice(0, 5),
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
        ...baseColumns.slice(5)
      ];
    }

    return baseColumns;
  };

  return (
    <>
      <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] pt-6 bg-transparent">
        <Row gutter={25} className="mb-5">
          <Col xs={24}>
            <div className="flex justify-between items-center mb-5 flex-wrap gap-3 p-5">
              <div className="flex-1">
                <h1 className="text-[24px] font-medium text-dark dark:text-white/[.87]">Customer Queries</h1>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search queries..."
                  prefix={<SearchOutlined />}
                  onChange={e => handleSearch(e.target.value)}
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
                    onClick={fetchQueries}
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
                    defaultActiveKey="all"
                    onChange={handleTabChange}
                    className="mb-4"
                    size={isMobile ? 'small' : 'middle'}
                    centered={isMobile}
                  >
                    <TabPane tab="All Queries" key="all" />
                    <TabPane tab="Pending" key="pending" />
                    <TabPane tab="Resolved" key="resolved" />
                  </Tabs>
                  <div className="table-responsive">
                    <Table
                      columns={getColumns()}
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
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              {currentQuery && <Text copyable strong className="text-base mt-10 ml-2">{currentQuery.queryID}</Text>}
            </span>
          </div>
        }
        open={detailModalVisible && currentQuery !== null}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button
            key="back"
            size="large"
            onClick={() => setDetailModalVisible(false)}
            className="min-w-[100px] font-medium mb-4 "
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
              className="min-w-[160px] font-medium mb-4 mr-4"
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
                <div className="border-b pb-2 flex justify-between items-end">
                  <div>
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
              </div>

              <div className="mb-6 border-b pb-2 flex justify-between items-end">
                <div className="flex-1">
                  <Text type="secondary" className="text-sm">Subject:</Text>
                  <div className="mt-1">
                    <Text strong className="text-base">{currentQuery.subject}</Text>
                  </div>
                </div>
                {currentQuery.attachmentURL && (
                  <Tooltip title="View Attachment">
                    <Button
                      type="primary"
                      icon={<PaperClipOutlined />}
                      onClick={() => handleOpenAttachment(currentQuery.attachmentURL)}
                      className="ml-4"
                    >
                      Attachment
                    </Button>
                  </Tooltip>
                )}
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
      </Modal >
    </>
  );
}

export default Protected(Queries, ["admin", "helpdesk"]);