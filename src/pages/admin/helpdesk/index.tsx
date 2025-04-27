import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Input, 
  Select, 
  Table, 
  Button, 
  Modal, 
  Form, 
  message, 
  Popconfirm, 
  Tabs,
  Space,
  Typography,
  Tag,
  Timeline
} from 'antd';
import { PageHeaders } from '../../../components/page-headers/index';
import { Buttons } from '../../../components/buttons';
import { UilPlus, UilEdit, UilTrash, UilSearch,UilEye } from '@iconscout/react-unicons';
import { collection, query, getDocs, doc, getDoc, deleteDoc, updateDoc, addDoc, limit, orderBy, startAfter, endBefore, limitToLast, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import moment from 'moment';
import { SearchOutlined, PlusOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Ticket {
  id: string;
  status: string;
  customerName: string;
  email: string;
  category: string;
  openMessage: string;
  createdAt: any;
  notes?: Array<{
    message: string;
    status?: string;
    addedBy: string;
    timestamp: any;
  }>;
  updatedAt?: any;
  createdBy?: string;
  priority?: string;
  title?: string;
  description?: string;
  ticketId?: string;
}

function Helpdesk() {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [visibleView, setVisibleView] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [firstVisible, setFirstVisible] = useState<any>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [noteForm] = Form.useForm();
  const [noteSubmitLoading, setNoteSubmitLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('all');

  const PageRoutes = [
    {
      path: '/admin',
      breadcrumbName: 'Dashboard',
    },
    {
      path: '',
      breadcrumbName: 'Helpdesk',
    },
  ];

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  // Generate ticket ID with "HID" + timestamp
  const generateTicketId = () => {
    const timestamp = Date.now();
    return `HID${timestamp}`;
  };

  // Fetch tickets from Firebase
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const ticketsRef = collection(db, 'helpdesk');
      let q = query(
        ticketsRef, 
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setFirstVisible(querySnapshot.docs[0]);
      }
      
      const ticketList: Ticket[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!statusFilter || data.status === statusFilter) {
          ticketList.push({
            id: doc.id,
            status: data.status || 'Opened',
            customerName: data.customerName || '',
            email: data.email || '',
            category: data.category || '',
            openMessage: data.openMessage || '',
            createdAt: data.createdAt,
            notes: data.notes,
            updatedAt: data.updatedAt,
            createdBy: data.createdBy,
            priority: data.priority,
            title: data.title,
            description: data.description,
            ticketId: data.ticketId
          });
        }
      });
      
      setTickets(ticketList);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      message.error("Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  // Handle next page
  const handleNextPage = async () => {
    if (!lastVisible) return;
    
    setLoading(true);
    try {
      const ticketsRef = collection(db, 'helpdesk');
      const q = query(
        ticketsRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(pageSize)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setFirstVisible(querySnapshot.docs[0]);
        
        const ticketList: Ticket[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (!statusFilter || data.status === statusFilter) {
            ticketList.push({
              id: doc.id,
              status: data.status || 'Opened',
              customerName: data.customerName || '',
              email: data.email || '',
              category: data.category || '',
              openMessage: data.openMessage || '',
              createdAt: data.createdAt,
              notes: data.notes,
              updatedAt: data.updatedAt,
              createdBy: data.createdBy,
              priority: data.priority,
              title: data.title,
              description: data.description,
              ticketId: data.ticketId
            });
          }
        });
        
        setTickets(ticketList);
        setCurrentPage(currentPage + 1);
      }
    } catch (error) {
      console.error("Error fetching next page:", error);
      message.error("Failed to fetch next page");
    } finally {
      setLoading(false);
    }
  };

  // Handle previous page
  const handlePrevPage = async () => {
    if (!firstVisible) return;
    
    setLoading(true);
    try {
      const ticketsRef = collection(db, 'helpdesk');
      const q = query(
        ticketsRef,
        orderBy('createdAt', 'desc'),
        endBefore(firstVisible),
        limitToLast(pageSize)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setFirstVisible(querySnapshot.docs[0]);
        
        const ticketList: Ticket[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (!statusFilter || data.status === statusFilter) {
            ticketList.push({
              id: doc.id,
              status: data.status || 'Opened',
              customerName: data.customerName || '',
              email: data.email || '',
              category: data.category || '',
              openMessage: data.openMessage || '',
              createdAt: data.createdAt,
              notes: data.notes,
              updatedAt: data.updatedAt,
              createdBy: data.createdBy,
              priority: data.priority,
              title: data.title,
              description: data.description,
              ticketId: data.ticketId
            });
          }
        });
        
        setTickets(ticketList);
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error("Error fetching previous page:", error);
      message.error("Failed to fetch previous page");
    } finally {
      setLoading(false);
    }
  };

  // Add new ticket
  const handleAddTicket = async (values: any) => {
    setLoading(true);
    try {
      const ticketID = generateTicketId();
      const newTicket = {
        category: values.category,
        status: 'Opened',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        customerName: values.customerName,
        email: values.email,
        openMessage: values.openMessage
      };
      
      await addDoc(collection(db, 'helpdesk'), newTicket);
      message.success("Ticket created successfully");
      setVisible(false);
      form.resetFields();
      fetchTickets();
    } catch (error) {
      console.error("Error adding ticket:", error);
      message.error("Failed to add ticket");
    } finally {
      setLoading(false);
    }
  };

  // Delete ticket
  const handleDeleteTicket = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'helpdesk', id));
      message.success("Ticket deleted successfully");
      fetchTickets();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      message.error("Failed to delete ticket");
    } finally {
      setLoading(false);
    }
  };

  // Fetch ticket details
  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const ticketDoc = await getDoc(doc(db, 'helpdesk', ticketId));
      if (ticketDoc.exists()) {
        setCurrentTicket({ id: ticketDoc.id, ...ticketDoc.data() } as Ticket);
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error);
      message.error("Failed to fetch ticket details");
    }
  };

  const onCancelView = () => {
    setVisibleView(false);
    setCurrentTicket(null);
  };

  const showModal = () => {
    setVisible(true);
  };

  const onCancel = () => {
    setVisible(false);
  };

  const handleStatusSearch = (value: string) => {
    setStatusFilter(value);
  };

  const handleSubjectSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  // Filter data based on search text
  const filteredData = tickets.filter(item => 
    (item.customerName?.toLowerCase().includes(searchText.toLowerCase()) || false) ||
    item.id.toLowerCase().includes(searchText.toLowerCase()) ||
    (item.email?.toLowerCase().includes(searchText.toLowerCase()) || false)
  );

  const columns = [
    {
      title: 'Ticket ID',
      dataIndex: 'id',
      key: 'id',
      className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
    },
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
      key: 'customerName',
      className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
      render: (text: string) => <span className="text-[15px] text-theme-gray dark:text-white/60 font-medium">{text}</span>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
      render: (text: string) => <span className="text-[15px] text-theme-gray dark:text-white/60 font-medium">{text}</span>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
      render: (text: string) => <span className="text-[15px] text-theme-gray dark:text-white/60 font-medium">{text}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
      render: (status: string) => (
        <span
          className={`text-xs font-medium inline-flex items-center justify-center min-h-[24px] px-3 rounded-[15px] ${
            status === 'Opened' ? 'text-green-500 bg-green-100' : 
            status === 'Closed' ? 'text-red-500 bg-red-100' : 
            'text-yellow-500 bg-yellow-100'
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
      render: (date: any) => {
        if (!date) return <span className="text-[15px] text-theme-gray dark:text-white/60 font-medium">N/A</span>;
        const jsDate = date.toDate ? date.toDate() : new Date(date);
        return (
          <span className="text-[15px] text-theme-gray dark:text-white/60 font-medium">
            {jsDate.toLocaleDateString('en-US', {
              year: 'numeric', 
              month: 'numeric', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'action',
      className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
      render: (_: any, record: Ticket) => (
        <div className="flex items-center gap-[15px]">
          <Button
            type="text"
            className="view group hover:text-success p-0 border-none"
            onClick={() => fetchTicketDetails(record.id)}
            icon={<UilEye className="w-4 text-light-extra dark:text-white/60 group-hover:text-currentColor" />}
          />
          <Popconfirm
            title="Are you sure to delete this ticket?"
            onConfirm={() => handleDeleteTicket(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              className="delete group hover:text-danger p-0 border-none"
              icon={<UilTrash className="w-4 text-light-extra dark:text-white/60 group-hover:text-currentColor" />}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const handleSubmit = async (values: any) => {
    setSubmitLoading(true);
    try {
      if (editMode) {
        await updateTicket(currentTicket!.id, values);
      } else {
        await handleAddTicket(values);
      }
      setAddModalVisible(false);
      setEditMode(false);
      form.resetFields();
      fetchTickets();
    } catch (error) {
      console.error("Error submitting ticket:", error);
      message.error("Failed to submit ticket");
    } finally {
      setSubmitLoading(false);
    }
  };

  const updateTicket = async (id: string, values: any) => {
    try {
      await updateDoc(doc(db, 'helpdesk', id), values);
      message.success("Ticket updated successfully");
    } catch (error) {
      console.error("Error updating ticket:", error);
      message.error("Failed to update ticket");
    }
  };

  const handleAddNote = async (values: any) => {
    setNoteSubmitLoading(true);
    try {
      const ticketRef = doc(db, 'helpdesk', currentTicket!.id);
      await updateDoc(ticketRef, {
        notes: [
          ...(currentTicket!.notes || []),
          {
            message: values.message,
            status: values.status,
            addedBy: 'Admin',
            timestamp: serverTimestamp()
          }
        ]
      });
      message.success("Note added successfully");
      setViewModalVisible(false);
      setNoteSubmitLoading(false);
      fetchTicketDetails(currentTicket!.id);
    } catch (error) {
      console.error("Error adding note:", error);
      message.error("Failed to add note");
    } finally {
      setNoteSubmitLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date instanceof Date && !isNaN(date.getTime())
      ? moment(date).format('MMMM D, YYYY h:mm A')
      : 'N/A';
  };
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'blue';
      case 'in-progress': return 'orange';
      case 'resolved': return 'green';
      case 'closed': return 'red';
      default: return 'default';
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  return (
    <>
      <PageHeaders
        className="flex items-center justify-between px-4 sm:px-8 xl:px-[15px] pt-2 pb-4 sm:pb-6 bg-transparent sm:flex-row flex-col gap-4"
        title="Helpdesk"
        routes={PageRoutes}
      />
      <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] bg-transparent">
        <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
          <Col className="mb-4" sm={24} xs={24}>
            <Card className="h-full">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="p-4 sm:p-[25px]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-dark dark:text-white/[.87] text-[16px] font-semibold">Helpdesk Management</h2>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <Input
                        placeholder="Search tickets..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full sm:w-64"
                      />
                      <Button
                        className="w-full sm:w-auto"
                        type="primary"
                        onClick={() => setAddModalVisible(true)}
                        icon={<PlusOutlined />}
                      >
                        Create Ticket
                      </Button>
                    </div>
                  </div>
                  
                  <Tabs 
                    defaultActiveKey="all" 
                    onChange={setCurrentTab}
                    className="mb-6"
                    items={[
                      { key: 'all', label: 'All Tickets' },
                      { key: 'open', label: 'Open' },
                      { key: 'in-progress', label: 'In Progress' },
                      { key: 'resolved', label: 'Resolved' },
                      { key: 'closed', label: 'Closed' },
                    ]}
                  />
                
                  <div className="overflow-x-auto">
                    <Table
                      dataSource={filteredData}
                      columns={columns.map(col => ({
                        ...col,
                        responsive: col.dataIndex === 'id' || col.dataIndex === 'customerName' || col.dataIndex === 'email' || col.dataIndex === 'category' || col.dataIndex === 'status' || col.key === 'action' 
                          ? ['xs', 'sm', 'md', 'lg', 'xl'] as any
                          : ['sm', 'md', 'lg', 'xl'] as any,
                      }))}
                      loading={loading}
                      pagination={{ 
                        pageSize: 10,
                        showSizeChanger: false,
                        responsive: true,
                      }}
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

      {/* Create/Edit Ticket Modal */}
      <Modal
        title={editMode ? "Edit Ticket" : "Create New Ticket"}
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
          setEditMode(false);
          form.resetFields();
        }}
        footer={null}
        width="95%"
        style={{ maxWidth: '700px' }}
        className="responsive-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="p-2"
        >
          <Form.Item
            name="category"
            label={<span className="text-dark dark:text-white/[.87]">Category</span>}
            rules={[{ required: true, message: 'Please select category' }]}
          >
            <Select placeholder="Select a category">
              <Select.Option value="booking_issue">Booking Issue</Select.Option>
              <Select.Option value="payment_issue">Payment Issue</Select.Option>
              <Select.Option value="technical_support">Technical Support</Select.Option>
              <Select.Option value="feedback">Feedback</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="customerName"
            label={<span className="text-dark dark:text-white/[.87]">Customer Name</span>}
            rules={[{ required: true, message: 'Please enter customer name' }]}
          >
            <Input placeholder="Enter customer name" />
          </Form.Item>
          <Form.Item
            name="email"
            label={<span className="text-dark dark:text-white/[.87]">Email</span>}
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>
          <Form.Item
            name="openMessage"
            label={<span className="text-dark dark:text-white/[.87]">Message</span>}
            rules={[{ required: true, message: 'Please enter message' }]}
          >
            <Input.TextArea rows={4} placeholder="Enter message" />
          </Form.Item>
          <Form.Item className="mb-0 flex justify-end mt-4">
            <Space>
              <Button 
                onClick={() => {
                  setAddModalVisible(false);
                  setEditMode(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitLoading}
              >
                {editMode ? "Update" : "Create"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Ticket Modal */}
      <Modal
        title="Ticket Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={null}
        width="95%"
        style={{ maxWidth: '800px' }}
        className="responsive-modal"
      >
        {currentTicket && (
          <div className="p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ticket ID</p>
                <p className="font-medium">{currentTicket.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
                <Tag color={getStatusColor(currentTicket.status)}>
                  {currentTicket.status.toUpperCase()}
                </Tag>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Created At</p>
                <p>{formatDate(currentTicket.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Customer Name</p>
                <p className="font-medium">{currentTicket.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
                <p className="font-medium">{currentTicket.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Category</p>
                <p className="font-medium">{currentTicket.category}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Message</p>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {currentTicket.openMessage}
              </div>
            </div>
            
            {currentTicket.notes && currentTicket.notes.length > 0 && (
              <div className="mb-6">
                <p className="font-medium mb-2">Notes & Updates</p>
                <Timeline>
                  {currentTicket.notes.map((note, index) => (
                    <Timeline.Item key={index} color={getStatusColor(note.status || 'open')}>
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <Text strong>{note.message}</Text>
                          <Tag color={getStatusColor(note.status || 'open')}>
                            {note.status?.toUpperCase() || 'OPEN'}
                          </Tag>
                        </div>
                        <div className="text-xs text-gray-500">
                          {note.addedBy} - {formatDate(note.timestamp)}
                        </div>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            )}
            
            {currentTicket.status !== 'closed' && (
              <div className="border-t dark:border-gray-700 pt-4 mt-4">
                <p className="font-medium mb-2">Add Note or Update Status</p>
                <Form
                  form={noteForm}
                  layout="vertical"
                  onFinish={handleAddNote}
                >
                  <Form.Item
                    name="message"
                    rules={[{ required: true, message: 'Please enter a note' }]}
                  >
                    <Input.TextArea 
                      rows={3} 
                      placeholder="Enter your note or update..." 
                    />
                  </Form.Item>
                  
                  <Form.Item name="status" label="Update Status">
                    <Select>
                      <Select.Option value="open">Open</Select.Option>
                      <Select.Option value="in-progress">In Progress</Select.Option>
                      <Select.Option value="resolved">Resolved</Select.Option>
                      <Select.Option value="closed">Closed</Select.Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item className="mb-0 flex justify-end">
                    <Space>
                      <Button onClick={() => setViewModalVisible(false)}>
                        Close
                      </Button>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={noteSubmitLoading}
                      >
                        Add Note/Update
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

export default Helpdesk; 