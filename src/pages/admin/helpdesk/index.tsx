import React, { useState, useEffect } from 'react';
import TicketHistoryTimeline from '@/components/TicketHistoryTimeline';
import FirebaseFileUploader from '@/components/FirebaseFileUploader';
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
  Timeline,
  Spin
} from 'antd';
import { Buttons } from '../../../components/buttons';
import { UilPlus, UilEdit, UilTrash, UilSearch, UilEye } from '@iconscout/react-unicons';
import { collection, query, getDocs, doc, getDoc, deleteDoc, updateDoc, addDoc, limit, orderBy, startAfter, endBefore, limitToLast, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import moment from 'moment';
import { SearchOutlined, PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import Protected from '../../../components/Protected/Protected';

const { Text } = Typography;

interface Ticket {
  id: string;
  status: string;
  customerName?: string;
  email?: string;
  phone?: string;
  category: string;
  openMessage?: string;
  createdAt: any;
  updatedAt?: any;
  createdBy?: string;
  priority?: string;
  title?: string;
  description?: string;
  ticketId?: string;
  helpDeskID?: string;
  userDetails?: {
    name: string;
    email: string;
    phone: string;
    uid: string;
    userID: string;
  };
  responses?: {
    opened?: {
      createdAt: any;
      response?: string;
      attachmentURL?: string;
    };
    resolved?: {
      createdAt: any;
      response?: string;
    };
    reopened?: {
      createdAt: any;
      response?: string;
    };
    closed?: {
      createdAt: any;
      response?: string;
    };
  };
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
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [noteForm] = Form.useForm();
  const [noteSubmitLoading, setNoteSubmitLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('opened');
  const [clicked, setClicked] = useState('opened');
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [resolvedMessage, setResolvedMessage] = useState('');
  const [closedMessage, setClosedMessage] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [responseForm] = Form.useForm();

  useEffect(() => {
    fetchTickets();
    setClicked(currentTab);
  }, [currentTab]);

  // Generate ticket ID with "HID" + timestamp (8 digits)
  const generateTicketId = () => {
    const timestamp = Date.now().toString();
    // Take the last 8 digits of the timestamp
    const shortTimestamp = timestamp.slice(-8);
    return `HID${shortTimestamp}`;
  };

  // Format category string
  const formatCategory = (category: string) => {
    if (!category) return '';
    // Replace underscores with spaces
    let formatted = category.replace(/_/g, ' ');

    // Capitalize first letter of each word
    return formatted.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Function to normalize status case
  const normalizeStatus = (status: string): string => {
    if (!status) return 'Opened';

    // Handle "opened" -> "Opened", "re-opened" -> "Re-Opened", etc.
    if (status.toLowerCase() === 'opened') return 'Opened';
    if (status.toLowerCase() === 'resolved') return 'Resolved';
    if (status.toLowerCase() === 'reopened' || status.toLowerCase() === 're-opened') return 'Re-Opened';
    if (status.toLowerCase() === 'closed') return 'Closed';

    return status.charAt(0).toUpperCase() + status.slice(1);
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
        const normalizedStatus = normalizeStatus(data.status);

        // Map the ticket data, accounting for the nested userDetails
        const ticket: Ticket = {
          id: doc.id,
          status: normalizedStatus,
          customerName: data.userDetails?.name || "Unknown",
          email: data.userDetails?.email || "",
          phone: data.userDetails?.phone || "",
          category: data.category || '',
          openMessage: data.responses?.opened?.response || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          createdBy: data.createdBy,
          priority: data.priority,
          title: data.title,
          description: data.description,
          ticketId: data.ticketId,
          helpDeskID: data.helpdeskID,
          userDetails: data.userDetails,
          responses: data.responses || {
            opened: {
              createdAt: data.createdAt,
              response: data.responses?.opened?.response || ''
            }
          }
        };

        // Filter based on the current tab, but include all tickets if searching
        const tabStatus = currentTab === 'reopened' ? 'Re-Opened' : currentTab.charAt(0).toUpperCase() + currentTab.slice(1);

        if (
          normalizedStatus === tabStatus ||
          searchText.trim() !== '' // Always include if there's a search
        ) {
          ticketList.push(ticket);
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
          const normalizedStatus = normalizeStatus(data.status);

          // Map the ticket data, accounting for the nested userDetails
          const ticket: Ticket = {
            id: doc.id,
            status: normalizedStatus,
            customerName: data.userDetails?.name || "Unknown",
            email: data.userDetails?.email || "",
            phone: data.userDetails?.phone || "",
            category: data.category || '',
            openMessage: data.responses?.opened?.response || '',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            createdBy: data.createdBy,
            priority: data.priority,
            title: data.title,
            description: data.description,
            ticketId: data.ticketId,
            helpDeskID: data.helpdeskID,
            userDetails: data.userDetails,
            responses: data.responses || {
              opened: {
                createdAt: data.createdAt,
                response: data.responses?.opened?.response || ''
              }
            }
          };

          const tabStatus = currentTab === 'reopened' ? 'Re-Opened' : currentTab.charAt(0).toUpperCase() + currentTab.slice(1);

          if (normalizedStatus === tabStatus || !statusFilter) {
            ticketList.push(ticket);
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
          const normalizedStatus = normalizeStatus(data.status);

          // Map the ticket data, accounting for the nested userDetails
          const ticket: Ticket = {
            id: doc.id,
            status: normalizedStatus,
            customerName: data.userDetails?.name || "Unknown",
            email: data.userDetails?.email || "",
            phone: data.userDetails?.phone || "",
            category: data.category || '',
            openMessage: data.responses?.opened?.response || '',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            createdBy: data.createdBy,
            priority: data.priority,
            title: data.title,
            description: data.description,
            ticketId: data.ticketId,
            helpDeskID: data.helpdeskID,
            userDetails: data.userDetails,
            responses: data.responses || {
              opened: {
                createdAt: data.createdAt,
                response: data.responses?.opened?.response || ''
              }
            }
          };

          const tabStatus = currentTab === 'reopened' ? 'Re-Opened' : currentTab.charAt(0).toUpperCase() + currentTab.slice(1);

          if (normalizedStatus === tabStatus || !statusFilter) {
            ticketList.push(ticket);
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

  // Fetch ticket details
  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const ticketDoc = await getDoc(doc(db, 'helpdesk', ticketId));
      if (ticketDoc.exists()) {
        const data = ticketDoc.data();

        // Ensure the opened response always exists
        let responses = data.responses || {};
        if (!responses.opened) {
          responses.opened = {
            createdAt: data.createdAt,
            response: data.responses?.opened?.response || ''
          };
        }

        setCurrentTicket({
          id: ticketDoc.id,
          status: normalizeStatus(data.status),
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          category: data.category || '',
          helpDeskID: data.helpdeskID,
          customerName: data.userDetails?.name || "Unknown",
          email: data.userDetails?.email || "",
          phone: data.userDetails?.phone || "",
          openMessage: data.responses?.opened?.response || '',
          createdBy: data.createdBy,
          priority: data.priority,
          title: data.title,
          description: data.description,
          ticketId: data.ticketId,
          userDetails: data.userDetails,
          responses: responses
        });
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error);
      message.error("Failed to fetch ticket details");
    }
  };

  // Filter data based on search text
  const filteredData = tickets.filter(item =>
    (item.customerName?.toLowerCase().includes(searchText.toLowerCase()) || false) ||
    item.id.toLowerCase().includes(searchText.toLowerCase()) ||
    (item.email?.toLowerCase().includes(searchText.toLowerCase()) || false) ||
    (item.helpDeskID?.toLowerCase().includes(searchText.toLowerCase()) || false)
  );

  // Get action buttons with updated functionality
  // In your getActionButtons function:
  const getActionButtons = (record: Ticket) => {
    const actions = [];

    // Only show "Resolve" button for Opened tickets
    if (record.status === 'Opened') {
      actions.push(
        <Button
          key="resolve"
          type="primary"
          size="small"
          onClick={() => {
            setCurrentTicket(record);
            setResponseModalVisible(true);
            responseForm.setFieldsValue({
              status: 'Resolved',
              message: '',
              attachmentURL: ''
            });
          }}
        >
          Resolve
        </Button>
      );
    }

    // Only show "Close" button for Resolved and Re-Opened tickets
    if (record.status === 'Resolved' || record.status === 'Re-Opened') {
      actions.push(
        <Button
          key="close"
          type="primary"
          size="small"
          onClick={() => {
            setCurrentTicket(record);
            setResponseModalVisible(true);
            responseForm.setFieldsValue({
              status: 'Closed',
              message: '',
              attachmentURL: ''
            });
          }}
        >
          Close
        </Button>
      );
    }

    // Always show "View" button
    actions.push(
      <Button
        key="view"
        type="text"
        icon={<EyeOutlined />}
        className="text-blue-600 hover:text-blue-800"
        onClick={() => {
          fetchTicketDetails(record.id);
          setViewModalVisible(true);
        }}
      >
      </Button>
    );

    return <div className="flex items-center gap-[15px]">{actions}</div>;
  };

  const columns = [
    {
      title: 'Ticket ID',
      dataIndex: 'helpDeskID',
      key: 'helpDeskID',
      className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
      render: (helpDeskID: string, record: Ticket) => (
        <span className="text-[15px] font-medium">{helpDeskID || record.id}</span>
      ),
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
      render: (text: string) => <span className="text-[15px] text-theme-gray dark:text-white/60 font-medium">{formatCategory(text)}</span>,
    },
    {
      title: 'Updated Date',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
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
      render: (_: any, record: Ticket) => getActionButtons(record),
    },
  ];

  

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date instanceof Date && !isNaN(date.getTime())
      ? moment(date).format('MMMM D, YYYY h:mm A')
      : 'N/A';
  };

  

  // Send email notification
  const sendEmailNotification = async (email: string, subject: string, message: string) => {
    try {
      const response = await fetch('/api/sendEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, subject, message }),
      });

      if (response.ok) {
        console.log('Email notification sent successfully');
      } else {
        console.error('Failed to send email notification');
      }
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  };

  // Handle response submission from the response modal
  const handleResponseSubmit = async (values: any) => {
    try {
      setSubmitLoading(true);

      const ticketRef = doc(db, 'helpdesk', currentTicket!.id);
      const responseType = values.status.toLowerCase().replace('-', '');

      // Create response update object
      const responseData = {
        [responseType]: {
          createdAt: serverTimestamp(),
          response: values.message,
          ...(values.attachmentURL && { attachmentURL: values.attachmentURL })
        }
      };

      await updateDoc(ticketRef, {
        status: values.status.toLowerCase(),
        responses: {
          ...(currentTicket!.responses || {}),
          ...responseData
        },
        updatedAt: serverTimestamp()
      });

      // Send email notification
      const emailSubject = `Your Ticket ${currentTicket!.helpDeskID || currentTicket!.id} ${values.status}`;
      const emailMessage = `Hello ${currentTicket!.customerName},\n\nYour ticket with ID ${currentTicket!.helpDeskID || currentTicket!.id} has been ${values.status.toLowerCase()}. Here is our response:\n${values.message}\n\nThank you.`;

      if (currentTicket!.email) {
        await sendEmailNotification(currentTicket!.email, emailSubject, emailMessage);
      }

      message.success(`Ticket ${values.status.toLowerCase()} successfully`);
      setResponseModalVisible(false);
      responseForm.resetFields();
      fetchTickets();
    } catch (error) {
      console.error(`Error updating ticket: ${error}`);
      message.error(`Failed to update ticket`);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Add an effect to set form status when modal opens
  useEffect(() => {
    if (viewModalVisible && currentTicket) {
      noteForm.setFieldsValue({ status: currentTicket.status });
    }
  }, [viewModalVisible, currentTicket]);

  return (
    <>
      <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] pt-6 bg-transparent">
        <Row gutter={25} className="mb-5">
          <Col xs={24}>
            <div className="flex justify-between items-center mb-5 flex-wrap gap-3 p-5">
              <div className="flex-1">
                <h1 className="text-[24px] font-medium text-dark dark:text-white/[.87]">Helpdesk Management</h1>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search queries..."
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
                    onClick={fetchTickets}
                    className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                  >
                    Refresh
                  </Button>
                )}
              </div>
            </div>
          </Col>
        </Row>

        <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
          <Col className="mb-4" sm={24} xs={24}>
            <Card className="h-full mb-8">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="p-6 sm:p-[30px]">
                  <Tabs
                    defaultActiveKey="opened"
                    activeKey={currentTab}
                    onChange={setCurrentTab}
                    className="mb-6"
                    items={[
                      { key: 'opened', label: 'Opened' },
                      { key: 'resolved', label: 'Resolved' },
                      { key: 'reopened', label: 'Reopened' },
                      { key: 'closed', label: 'Closed' },
                    ]}
                  />

                  <div className="overflow-x-auto">
                    <Table
                      dataSource={filteredData}
                      columns={columns.map(col => ({
                        ...col,
                        responsive: col.dataIndex === 'helpDeskID' || col.dataIndex === 'customerName' || col.dataIndex === 'email' || col.dataIndex === 'category' || col.dataIndex === 'status' || col.key === 'action'
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

      {/* View Ticket Modal - Simplified to only show details */}
      <Modal
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-dark dark:text-white/[.87]">
              {currentTicket?.helpDeskID || currentTicket?.id}
            </h3>
          </div>
        }
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button
            key="close"
            size="large"
            onClick={() => setViewModalVisible(false)}
            className="min-w-[100px] font-medium mb-4"
          >
            Close
          </Button>
        ]}
        width={700}
        className="ticket-detail-modal"
        bodyStyle={{ padding: "20px 24px" }}
        maskClosable={false}
      >
        {currentTicket ? (
          <div className="p-4 bg-white dark:bg-[#1b1e2b] rounded-lg shadow-sm">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="border-b pb-2">
                <Text type="secondary" className="text-sm">Created At:</Text>
                <div className="mt-1">
                  <Text strong className="text-base">{formatDate(currentTicket.createdAt)}</Text>
                </div>
              </div>
              <div className="border-b pb-2">
                <Text type="secondary" className="text-sm">Customer Name:</Text>
                <div className="mt-1">
                  <Text strong className="text-base">{currentTicket.customerName}</Text>
                </div>
              </div>
              <div className="border-b pb-2">
                <Text type="secondary" className="text-sm">Email:</Text>
                <div className="mt-1">
                  <Text strong className="text-base">{currentTicket.email}</Text>
                </div>
              </div>
              <div className="border-b pb-2">
                <Text type="secondary" className="text-sm">Category:</Text>
                <div className="mt-1">
                  <Text strong className="text-base">{formatCategory(currentTicket.category)}</Text>
                </div>
              </div>
            </div>

            <div className="mb-6 border-b pb-2">
              <Text type="secondary" className="text-sm">Message:</Text>
              <div className="mt-2 p-5 bg-regularBG dark:bg-[#323440] rounded-md border border-gray-100 dark:border-gray-700">
                <Text className="text-base whitespace-pre-line">{currentTicket.openMessage}</Text>
              </div>
            </div>

            <div className="bg-regularBG dark:bg-[#323440] p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <Text strong className="text-base block mb-4">Ticket History</Text>
              <TicketHistoryTimeline
                currentTicket={currentTicket}
                formatDate={formatDate}
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center p-10">
            <Spin size="large" />
          </div>
        )}
      </Modal>


      {/* Response Modal (Replaces Resolve and Close dialogs) */}
      <Modal
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              {responseForm.getFieldValue('status') === 'Resolved' ? 'Resolve Ticket' : 'Close Ticket'}
            </span>
          </div>
        }
        open={responseModalVisible}
        onCancel={() => {
          setResponseModalVisible(false);
          responseForm.resetFields();
        }}
        footer={null}
        width={650}
        className="helpdesk-response-modal"
      >
        <div className="p-4">
          {currentTicket && (
            <Form
              form={responseForm}
              layout="vertical"
              onFinish={handleResponseSubmit}
            >
              <Form.Item
                name="message"
                label="Response Message"
                rules={[{ required: true, message: 'Please enter a response' }]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="Enter your response..."
                  className="w-full"
                />
              </Form.Item>

              <Form.Item
                label="Attachment"
                name="attachment"
                extra="Optional - Upload any relevant files"
              >
                <FirebaseFileUploader
                  storagePath="helpdesk/attachments"
                  accept="*"
                  maxSizeMB={10}
                  onUploadSuccess={(url) => {
                    responseForm.setFieldsValue({ attachmentURL: url });
                  }}
                  onUploadStart={() => {
                    responseForm.setFieldsValue({ attachmentURL: '' });
                  }}
                  onUploadError={(error) => {
                    console.error('Upload error:', error);
                    message.error('Failed to upload attachment');
                  }}
                />
              </Form.Item>

              <Form.Item name="attachmentURL" hidden>
                <Input />
              </Form.Item>

              <Form.Item className="mb-0 flex justify-end">
                <Space>
                  <Button onClick={() => setResponseModalVisible(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitLoading}
                  >
                    {responseForm.getFieldValue('status') === 'Resolved' ? 'Resolve' : 'Close'}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          )}
        </div>
      </Modal>
    </>
  );
}

export default Protected(Helpdesk, ["admin", "helpdesk"]); 