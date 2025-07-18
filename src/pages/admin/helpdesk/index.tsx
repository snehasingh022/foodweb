import React, { useState, useEffect } from 'react';
import TicketHistoryTimeline from '@/components/TicketHistoryTimeline';
import FirebaseFileUploader from '@/components/FirebaseFileUploader';
import { InboxOutlined } from '@ant-design/icons';
import { Select, Upload } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { convertImageToWebP } from '@/components/imageConverter'; 

import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import {
  Row,
  Col,
  Card,
  Input,
  Table,
  Button,
  Modal,
  Form,
  message,
  Tabs,
  Space,
  Typography,
  Spin
} from 'antd';
import { collection, query, getDocs, doc, getDoc, updateDoc, limit, orderBy, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import moment from 'moment';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
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

interface EmailLog {
  ticketId: string;
  customerEmail: string;
  subject: string;
  messageContent: string;
  status: 'success' | 'failed';
  timestamp: any;
  errorMessage?: string;
}

function Helpdesk() {
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [searchText, setSearchText] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [firstVisible, setFirstVisible] = useState<any>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [noteForm] = Form.useForm();
  const [currentTab, setCurrentTab] = useState('opened');
  const [clicked, setClicked] = useState('opened');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [responseForm] = Form.useForm();
  const [emailSent, setEmailSent] = useState(false);
  const [attachmentURL, setAttachmentURL] = useState('');

  useEffect(() => {
    fetchTickets();
    setClicked(currentTab);
  }, [currentTab]);

  // Log email activity to Firebase
  const logEmailActivity = async (emailLog: EmailLog) => {
    try {
      const emailLogRef = doc(collection(db, 'emailLogs'));
      await setDoc(emailLogRef, {
        ...emailLog,
        timestamp: serverTimestamp()
      });
      console.log('Email activity logged successfully');
    } catch (error) {
      console.error('Error logging email activity:', error);
    }
  };

// Fixed sendEmailNotification function - replace the existing one in your helpdesk component
const sendEmailNotification = async (
  email: string, 
  subject: string, 
  messageContent: string
) => {
  try {
    console.log("Sending email notification to:", email);
    
    const response = await fetch("/api/mail/send", {
      method: "POST",
      body: JSON.stringify({
        email: email,
        message: messageContent,
        subject: subject,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Response status:", response.status);

    // Read the response body only once
    const responseText = await response.text();

    // Try to parse as JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", responseText);
      throw new Error(`Server returned invalid JSON. Status: ${response.status}. Response: ${responseText.substring(0, 200)}...`);
    }

    if (response.ok && result.status === 'success') {
      console.log('Email notification sent successfully');
      message.success('Email notification sent successfully!');
      setEmailSent(true);
      
      await logEmailActivity({
        ticketId: currentTicket?.helpDeskID || currentTicket?.id || '',
        customerEmail: email,
        subject,
        messageContent,
        status: 'success',
        timestamp: serverTimestamp()
      });
      
      return true;
    } else {
      throw new Error(result.error || `Server error: ${response.status}`);
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
    let errorMessage = 'Unknown error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    message.error(`Error sending email notification: ${errorMessage}`);
    
    // Log failed email
    await logEmailActivity({
      ticketId: currentTicket?.helpDeskID || currentTicket?.id || '',
      customerEmail: email,
      subject,
      messageContent,
      status: 'failed',
      timestamp: serverTimestamp(),
      errorMessage: errorMessage
    });
    
    return false;
  }
};

  const formatCategory = (category: string) => {
    if (!category) return '';
    let formatted = category.replace(/_/g, ' ');
    return formatted.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const normalizeStatus = (status: string): string => {
    if (!status) return 'Opened';
    if (status.toLowerCase() === 'opened') return 'Opened';
    if (status.toLowerCase() === 'resolved') return 'Resolved';
    if (status.toLowerCase() === 'reopened' || status.toLowerCase() === 're-opened') return 'Re-Opened';
    if (status.toLowerCase() === 'closed') return 'Closed';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

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
        if (
          normalizedStatus === tabStatus ||
          searchText.trim() !== ''
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

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const ticketDoc = await getDoc(doc(db, 'helpdesk', ticketId));
      if (ticketDoc.exists()) {
        const data = ticketDoc.data();
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

  const filteredData = tickets.filter(item =>
    (item.customerName?.toLowerCase().includes(searchText.toLowerCase()) || false) ||
    item.id.toLowerCase().includes(searchText.toLowerCase()) ||
    (item.email?.toLowerCase().includes(searchText.toLowerCase()) || false) ||
    (item.helpDeskID?.toLowerCase().includes(searchText.toLowerCase()) || false)
  );

  const getActionButtons = (record: Ticket) => {
    const actions = [];
  /*  if (record.status === 'Opened') {
      actions.push(
        <Button
          key="resolve"
          type="primary"
          size="small"
          onClick={() => {
            setCurrentTicket(record);
            setEmailSent(false);
            setResponseModalVisible(true);
            setTimeout(() => {
              responseForm.setFieldsValue({
                status: 'resolved',
                message: '',
                attachmentURL: ''
              });
            }, 100);
          }}
        >
          Resolve
        </Button>
      );
    }

    if (record.status === 'Resolved' || record.status === 'Re-Opened') {
      actions.push(
        <Button
          key="close"
          type="primary"
          size="small"
          onClick={() => {
            setCurrentTicket(record);
            setEmailSent(false);
            setResponseModalVisible(true);
            setTimeout(() => {
              responseForm.setFieldsValue({
                status: 'closed',
                message: '',
                attachmentURL: ''
              });
            }, 100);
          }}
        >
          Close
        </Button>
      );
    }*/

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
    title: 'Category',
    dataIndex: 'category',
    key: 'category',
    className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
    render: (text: string) => (
      <span className="text-[15px] text-theme-gray dark:text-white/60 font-medium">
        {formatCategory(text)}
      </span>
    ),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
    render: (status: string) => {
      let badgeColor = '';
      let textColor = '';

      switch (status) {
        case 'Opened':
          badgeColor = 'bg-blue-100';
          textColor = 'text-blue-600';
          break;
        case 'Resolved':
          badgeColor = 'bg-green-100';
          textColor = 'text-green-700';
          break;
        case 'Re-Opened':
          badgeColor = 'bg-yellow-100';
          textColor = 'text-yellow-800';
          break;
        case 'Closed':
          badgeColor = 'bg-red-100';
          textColor = 'text-red-700';
          break;
        default:
          badgeColor = 'bg-gray-100';
          textColor = 'text-gray-600';
          break;
      }

      return (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColor} ${textColor}`}
        >
          {status}
        </span>
      );
    },
  },
{
  title: 'Created At',
  dataIndex: 'createdAt',
  key: 'createdAt',
  className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
  render: (createdAt: any) => {
    if (!createdAt) {
      return <span className="text-[15px] text-black">N/A</span>;
    }

    const dateObj = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return (
      <span className="text-[15px] text-black font-medium">
        {formattedDate}
      </span>
    );
  },
  sorter: (a: any, b: any) => {
    const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
    const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
    return aTime - bTime;
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

  // Updated handleResponseSubmit function with simplified email integration
  const handleResponseSubmit = async (values: any) => {
    try {
      setSubmitLoading(true);
      if (!currentTicket) {
        message.error('No ticket selected');
        return;
      }

      const ticketRef = doc(db, 'helpdesk', currentTicket.id);
      const status = values.status || 'resolved';
      const responseType = status.toLowerCase().replace('-', '');

      const responseData = {
        [responseType]: {
          createdAt: serverTimestamp(),
          response: values.message,
          ...(values.attachmentURL && { attachmentURL: values.attachmentURL })
        }
      };

      // Update the ticket in Firebase
      await updateDoc(ticketRef, {
        status: status.toLowerCase(),
        responses: {
          ...(currentTicket.responses || {}),
          ...responseData
        },
        updatedAt: serverTimestamp()
      });

      const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1);

      // Send email notification for resolved and closed tickets
      if ((status.toLowerCase() === 'resolved' || status.toLowerCase() === 'closed') && currentTicket.email) {
        const emailSubject = `${currentTicket.helpDeskID || currentTicket.id}: Issue ${statusDisplay}`;
        
        // Create HTML email content
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333; margin: 0;">Wecofy Support Team</h1>
                <div style="width: 50px; height: 3px; background-color: #007bff; margin: 10px auto;"></div>
              </div>
              
              <h2 style="color: #333; margin-bottom: 20px;">Ticket Update Notification</h2>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                <p style="margin: 0; color: #666;"><strong>Ticket ID:</strong> ${currentTicket.helpDeskID || currentTicket.id}</p>
                <p style="margin: 10px 0 0 0; color: #666;"><strong>Customer Name:</strong> ${currentTicket.customerName}</p>
                <p style="margin: 10px 0 0 0; color: #666;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">${statusDisplay}</span></p>
              </div>
              
              <div style="margin-bottom: 25px;">
                <h3 style="color: #333; margin-bottom: 10px;">Our Response:</h3>
                <div style="background-color: #e9ecef; padding: 15px; border-radius: 6px; border-left: 4px solid #007bff;">
                  <p style="margin: 0; color: #333; line-height: 1.6;">${values.message}</p>
                </div>
              </div>
              
              <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
                <p style="color: #666; margin: 0;">Thank you for choosing us!</p>
                <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        `;
        
        // Send email notification
        await sendEmailNotification(
          currentTicket.email, 
          emailSubject, 
          htmlContent
        );
      }

      message.success(`Ticket ${status.toLowerCase()} successfully`);

      // Only close modal if email was sent successfully or no email was required
      if (emailSent || !currentTicket.email || (status.toLowerCase() !== 'resolved' && status.toLowerCase() !== 'closed')) {
        setResponseModalVisible(false);
        responseForm.resetFields();
        setEmailSent(false);
        fetchTickets();
      }
    } catch (error) {
      console.error(`Error updating ticket: ${error}`);
      message.error(`Failed to update ticket`);
    } finally {
      setSubmitLoading(false);
    }
  };

  useEffect(() => {
    if (viewModalVisible && currentTicket) {
      noteForm.setFieldsValue({ status: currentTicket.status });
    }
  }, [viewModalVisible, currentTicket]);

const [tagModalVisible, setTagModalVisible] = useState(false);
const [tagCategory, setTagCategory] = useState('');
const [tagDescription, setTagDescription] = useState('');


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

              <Button
                type="primary"
                onClick={() => setTagModalVisible(true)}
                icon={<PlusOutlined />}
                className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
              >
                Add Ticket
              </Button>


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

      <Modal
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-dark dark:text-white/[.87]">
              Ticket Details : {currentTicket && <Text copyable strong className="text-base mt-10 ml-2">{currentTicket.helpDeskID}</Text>}
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
            className="min-w-[100px] font-medium mb-4 mr-4"
          >
            Close
          </Button>
        ]}
        width={400}
        className="ticket-detail-modal"
        bodyStyle={{ padding: "20px 24px" }}
        maskClosable={false}
      >
        {currentTicket ? (
          <div className="p-4 bg-white dark:bg-[#1b1e2b] rounded-lg shadow-sm">
            <div className="grid grid-cols-1 gap-8">
              {/* Left Column - User Details */}

              <div className="bg-regularBG dark:bg-[#323440] p-6 rounded-lg border border-gray-100 dark:border-gray-700">
                <Text strong className="text-lg block mb-4">Ticket History</Text>
                <TicketHistoryTimeline
                  currentTicket={currentTicket}
                  formatDate={formatDate}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center p-10">
            <Spin size="large" />
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              {(() => {
                const status = responseForm.getFieldValue('status');
                if (status === 'resolved') return 'Resolve Ticket';
                if (status === 'closed') return 'Close Ticket';
                return 'Update Ticket';
              })()}
            </span>
          </div>
        }
        open={responseModalVisible}
        onCancel={() => {
          setResponseModalVisible(false);
          responseForm.resetFields();
          setEmailSent(false);
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
              <Form.Item name="status" hidden>
                <Input />
              </Form.Item>

              <Form.Item
                name="message"
                label="Response Message"
                rules={[{ required: true, message: 'Please enter a response' }]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="Enter your response..."
                  className="w-full"
                  disabled={emailSent}
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
                  } }
                  onUploadStart={() => {
                    responseForm.setFieldsValue({ attachmentURL: '' });
                  } }
                  onUploadError={(error) => {
                    console.error('Upload error:', error);
                    message.error('Failed to upload attachment');
                  } } partnerUID={''}                />
              </Form.Item>

              <Form.Item name="attachmentURL" hidden>
                <Input />
              </Form.Item>

              <Form.Item className="mb-0 flex justify-end">
                <Space>
                  <Button onClick={() => {
                    setResponseModalVisible(false);
                    setEmailSent(false);
                  }}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitLoading}
                    disabled={emailSent && !responseForm.getFieldValue('message')}
                    className="flex items-center gap-2"
                  >
                    {emailSent ? (
                      <>
                        ✓ Sent
                      </>
                    ) : submitLoading ? (
                      'Processing...'
                    ) : (
                      (() => {
                        const status = responseForm.getFieldValue('status');
                        if (status === 'resolved') return 'Resolve';
                        if (status === 'closed') return 'Close';
                        return 'Update';
                      })()
                    )}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          )}
        </div>
      </Modal>
      <Modal 
  title={
    <div style={{ padding: '12px 24px 0' }}>
      <h2 style={{ margin: 0 }}>Create New Ticket</h2>
    </div>
  }
  open={tagModalVisible}
  onCancel={() => setTagModalVisible(false)}
  footer={null}
>
  <div style={{ padding: '24px 24px' }}>
    <Form
      layout="vertical"
      onFinish={async () => {
        try {
          const newTicketID = uuidv4(); // unique ID
          await setDoc(doc(db, 'helpdesk', newTicketID), {
            helpDeskID: `TICKET-${Date.now()}`,
            category: tagCategory,
            description: tagDescription,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            status: 'opened',
            responses: {
              opened: {
                createdAt: serverTimestamp(),
                response: tagDescription,
                ...(attachmentURL && { attachmentURL }) // include if uploaded
              }
            },
            userDetails: {
              name: 'Guest User',
              email: 'guest@example.com',
              phone: 'N/A',
              uid: 'guest',
              userID: 'guest'
            }
          });

          message.success('Ticket created successfully!');
          setTagModalVisible(false);
          setTagCategory('');
          setTagDescription('');
          setAttachmentURL('');
          fetchTickets(); // optional: refresh tickets table
        } catch (err) {
          console.error('Error creating ticket:', err);
          message.error('Failed to create ticket');
        }
      }}
    >
      <Form.Item
        label="Category"
        name="category"
        rules={[{ required: true, message: 'Please select a category!' }]}
      >
        <Select
          placeholder="Select a category"
          onChange={(value) => setTagCategory(value)}
        >
          <Select.Option value="Account Related">Account Related</Select.Option>
          <Select.Option value="Technical">Technical Support</Select.Option>
          <Select.Option value="Billing">Billing</Select.Option>
          <Select.Option value="Feature Request">Feature Request</Select.Option>
          <Select.Option value="Other">Other</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        label="Description"
        name="description"
        rules={[{ required: true, min: 10, message: 'Minimum 10 characters required' }]}
      >
        <Input.TextArea
          rows={4}
          placeholder="Describe your issue in detail (minimum 10 characters)"
          maxLength={1000}
          onChange={(e) => setTagDescription(e.target.value)}
        />
      </Form.Item>

      <Form.Item label="Attachment (Optional)" name="attachment">
        <FirebaseFileUploader
          storagePath="helpdesk/attachments"
          accept=".jpg,.png,.pdf,.doc,.docx"
          maxSizeMB={15}
          onUploadSuccess={(url) => setAttachmentURL(url)}
          onUploadStart={() => setAttachmentURL('')}
          onUploadError={(err) => {
            console.error(err);
            message.error('Upload failed!');
          }}
          partnerUID={''}
        />
      </Form.Item>

      <Form.Item>
        <div className="flex justify-end gap-2">
          <Button onClick={() => setTagModalVisible(false)}>Cancel</Button>
          <Button type="primary" htmlType="submit">Submit Ticket</Button>
        </div>
      </Form.Item>
    </Form>
  </div>
</Modal>


    </>
  );
}

export default Protected(Helpdesk, ["admin", "helpdesk","partner"]);