import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
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
=======
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
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
  Tabs,
  Space,
  Typography,
  Tag,
  Timeline,
  Spin
} from 'antd';
import { Buttons } from '../../../components/buttons';
<<<<<<< HEAD
import { UilPlus, UilEdit, UilTrash, UilSearch, UilEye } from '@iconscout/react-unicons';
import { collection, query, getDocs, doc, getDoc, deleteDoc, updateDoc, addDoc, limit, orderBy, startAfter, endBefore, limitToLast, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import moment from 'moment';
import { SearchOutlined, PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
=======
import { UilPlus, UilEdit, UilTrash, UilSearch,UilEye } from '@iconscout/react-unicons';
import { collection, query, getDocs, doc, getDoc, deleteDoc, updateDoc, addDoc, limit, orderBy, startAfter, endBefore, limitToLast, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import moment from 'moment';
import { SearchOutlined, PlusOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
import Protected from '../../../components/Protected/Protected';

const { Text } = Typography;

interface Ticket {
  id: string;
  status: string;
<<<<<<< HEAD
  customerName?: string;
  email?: string;
  phone?: string;
  category: string;
  openMessage?: string;
=======
  customerName: string;
  email: string;
  category: string;
  openMessage: string;
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
  createdAt: any;
  updatedAt?: any;
  createdBy?: string;
  priority?: string;
  title?: string;
  description?: string;
  ticketId?: string;
  helpDeskID?: string;
<<<<<<< HEAD
  userDetails?: {
    name: string;
    email: string;
    phone: string;
    uid: string;
    userID: string;
  };
=======
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
  responses?: {
    opened?: {
      createdAt: any;
      response?: string;
<<<<<<< HEAD
      attachmentURL?: string;
=======
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
    if (!category) return '';
    // Replace underscores with spaces
    let formatted = category.replace(/_/g, ' ');

=======
    // Replace underscores with spaces
    let formatted = category.replace(/_/g, ' ');
    
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
    // Capitalize first letter of each word
    return formatted.replace(/\b\w/g, (char) => char.toUpperCase());
  };

<<<<<<< HEAD
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

=======
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
  // Fetch tickets from Firebase
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const ticketsRef = collection(db, 'helpdesk');
      let q = query(
<<<<<<< HEAD
        ticketsRef,
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      const querySnapshot = await getDocs(q);

=======
        ticketsRef, 
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
      
      const querySnapshot = await getDocs(q);
      
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
      if (!querySnapshot.empty) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setFirstVisible(querySnapshot.docs[0]);
      }
<<<<<<< HEAD

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

=======
      
      const ticketList: Ticket[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const status = data.status || 'Opened';
        
        // Filter based on current tab
        if (
          (currentTab === 'opened' && status === 'Opened') ||
          (currentTab === 'resolved' && status === 'Resolved') ||
          (currentTab === 'reopened' && status === 'Re-Opened') ||
          (currentTab === 'closed' && status === 'Closed') ||
          searchText.trim() !== '' // Always include if there's a search
        ) {
          ticketList.push({
            id: doc.id,
            status: status,
            customerName: data.customerName || '',
            email: data.email || '',
            category: data.category || '',
            openMessage: data.openMessage || '',
            createdAt: data.createdAt,
            responses: data.responses || {
              opened: {
                createdAt: data.createdAt,
                response: data.openMessage || ''
              }
            },
            updatedAt: data.updatedAt,
            createdBy: data.createdBy,
            priority: data.priority,
            title: data.title,
            description: data.description,
            ticketId: data.ticketId,
            helpDeskID: data.helpDeskID
          });
        }
      });
      
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD

=======
    
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
    setLoading(true);
    try {
      const ticketsRef = collection(db, 'helpdesk');
      const q = query(
        ticketsRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(pageSize)
      );
<<<<<<< HEAD

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

=======
      
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
              responses: data.responses || {
                opened: {
                  createdAt: data.createdAt,
                  response: data.openMessage || ''
                }
              },
              updatedAt: data.updatedAt,
              createdBy: data.createdBy,
              priority: data.priority,
              title: data.title,
              description: data.description,
              ticketId: data.ticketId,
              helpDeskID: data.helpDeskID
            });
          }
        });
        
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD

=======
    
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
    setLoading(true);
    try {
      const ticketsRef = collection(db, 'helpdesk');
      const q = query(
        ticketsRef,
        orderBy('createdAt', 'desc'),
        endBefore(firstVisible),
        limitToLast(pageSize)
      );
<<<<<<< HEAD

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

=======
      
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
              responses: data.responses || {
                opened: {
                  createdAt: data.createdAt,
                  response: data.openMessage || ''
                }
              },
              updatedAt: data.updatedAt,
              createdBy: data.createdBy,
              priority: data.priority,
              title: data.title,
              description: data.description,
              ticketId: data.ticketId,
              helpDeskID: data.helpDeskID
            });
          }
        });
        
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD

=======
        
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
        // Ensure the opened response always exists
        let responses = data.responses || {};
        if (!responses.opened) {
          responses.opened = {
            createdAt: data.createdAt,
<<<<<<< HEAD
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
=======
            response: data.openMessage || ''
          };
        }
        
        setCurrentTicket({ 
          id: ticketDoc.id, 
          ...data,
          responses: responses 
        } as Ticket);
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error);
      message.error("Failed to fetch ticket details");
    }
  };

<<<<<<< HEAD
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
=======
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

  // Get action buttons with updated functionality
  const getActionButtons = (record: Ticket) => {
    const actions = [];
    
    // Only show "Resolve" button for Opened tickets
    if (currentTab === 'opened') {
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
      actions.push(
        <Button
          key="resolve"
          type="primary"
          size="small"
          onClick={() => {
            setCurrentTicket(record);
            setResponseModalVisible(true);
<<<<<<< HEAD
            responseForm.setFieldsValue({
              status: 'Resolved',
              message: '',
              attachmentURL: ''
            });
=======
            responseForm.setFieldsValue({ status: 'Resolved' });
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
          }}
        >
          Resolve
        </Button>
      );
    }
<<<<<<< HEAD

    // Only show "Close" button for Resolved and Re-Opened tickets
    if (record.status === 'Resolved' || record.status === 'Re-Opened') {
=======
    
    // Only show "Close" button for Resolved and Re-Opened tickets
    if (currentTab === 'resolved' || currentTab === 'reopened') {
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
      actions.push(
        <Button
          key="close"
          type="primary"
          size="small"
          onClick={() => {
            setCurrentTicket(record);
            setResponseModalVisible(true);
<<<<<<< HEAD
            responseForm.setFieldsValue({
              status: 'Closed',
              message: '',
              attachmentURL: ''
            });
=======
            responseForm.setFieldsValue({ status: 'Closed' });
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
          }}
        >
          Close
        </Button>
      );
    }
<<<<<<< HEAD

=======
    
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
    // Always show "View" button
    actions.push(
      <Button
        key="view"
<<<<<<< HEAD
        type="text"
        icon={<EyeOutlined />}
        className="text-blue-600 hover:text-blue-800"
=======
        type="default"
        size="small"
        className="view group hover:text-success"
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
        onClick={() => {
          fetchTicketDetails(record.id);
          setViewModalVisible(true);
        }}
      >
<<<<<<< HEAD
      </Button>
    );

=======
        View
      </Button>
    );
    
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
    return <div className="flex items-center gap-[15px]">{actions}</div>;
  };

  const columns = [
    {
      title: 'Ticket ID',
<<<<<<< HEAD
      dataIndex: 'helpDeskID',
      key: 'helpDeskID',
      className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
      render: (helpDeskID: string, record: Ticket) => (
        <span className="text-[15px] font-medium">{helpDeskID || record.id}</span>
      ),
=======
      dataIndex: 'id',
      key: 'id',
      className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
=======
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
      render: (status: string) => (
        <span
          className={`text-xs font-medium inline-flex items-center justify-center min-h-[24px] px-3 rounded-[15px] ${
            status === 'Opened' ? 'text-green-500 bg-green-100' : 
            status === 'Closed' ? 'text-red-500 bg-red-100' : 
            status === 'Resolved' ? 'text-blue-500 bg-blue-100' :
            status === 'Re-Opened' ? 'text-yellow-500 bg-yellow-100' :
            'text-yellow-500 bg-yellow-100'
          }`}
        >
          {status}
        </span>
      ),
    },
    {
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
              year: 'numeric',
              month: 'numeric',
=======
              year: 'numeric', 
              month: 'numeric', 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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

<<<<<<< HEAD
  

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';

=======
  const handleSubmit = async (values: any) => {
    // This function is intentionally left empty after removing ticket creation
    message.info("Ticket creation has been disabled");
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
      
      // Create the appropriate response object based on status
      const responseType = values.status.toLowerCase().replace('-', '');
      const responseData = {
        [responseType]: {
          createdAt: serverTimestamp(),
          response: values.message
        }
      };
      
      await updateDoc(ticketRef, {
        status: values.status,
        responses: {
          ...(currentTicket!.responses || {}),
          ...responseData
        },
        updatedAt: serverTimestamp()
      });
      
      message.success("Response added successfully");
      setViewModalVisible(false);
      setNoteSubmitLoading(false);
      fetchTicketDetails(currentTicket!.id);
    } catch (error) {
      console.error("Error adding response:", error);
      message.error("Failed to add response");
    } finally {
      setNoteSubmitLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date instanceof Date && !isNaN(date.getTime())
      ? moment(date).format('MMMM D, YYYY h:mm A')
      : 'N/A';
  };
<<<<<<< HEAD

  
=======
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'opened': return 'green';
      case 're-opened': return 'yellow';
      case 'resolved': return 'blue';
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
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12

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
<<<<<<< HEAD

=======
      
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD

      const ticketRef = doc(db, 'helpdesk', currentTicket!.id);
      const responseType = values.status.toLowerCase().replace('-', '');

=======
      
      const ticketRef = doc(db, 'helpdesk', currentTicket!.id);
      const responseType = values.status.toLowerCase().replace('-', '');
      
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
      // Create response update object
      const responseData = {
        [responseType]: {
          createdAt: serverTimestamp(),
<<<<<<< HEAD
          response: values.message,
          ...(values.attachmentURL && { attachmentURL: values.attachmentURL })
        }
      };

      await updateDoc(ticketRef, {
        status: values.status.toLowerCase(),
=======
          response: values.message
        }
      };
      
      await updateDoc(ticketRef, {
        status: values.status,
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
        responses: {
          ...(currentTicket!.responses || {}),
          ...responseData
        },
        updatedAt: serverTimestamp()
      });
<<<<<<< HEAD

      // Send email notification
      const emailSubject = `Your Ticket ${currentTicket!.helpDeskID || currentTicket!.id} ${values.status}`;
      const emailMessage = `Hello ${currentTicket!.customerName},\n\nYour ticket with ID ${currentTicket!.helpDeskID || currentTicket!.id} has been ${values.status.toLowerCase()}. Here is our response:\n${values.message}\n\nThank you.`;

      if (currentTicket!.email) {
        await sendEmailNotification(currentTicket!.email, emailSubject, emailMessage);
      }

=======
      
      // Send email notification
      const emailSubject = `Your Ticket ${currentTicket!.id} ${values.status}`;
      const emailMessage = `Hello ${currentTicket!.customerName},\n\nYour ticket with ID ${currentTicket!.id} has been ${values.status.toLowerCase()}. Here is our response:\n${values.message}\n\nThank you.`;
      await sendEmailNotification(currentTicket!.email, emailSubject, emailMessage);
      
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
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
=======
                <Button 
                  type="primary" 
                  className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                  onClick={fetchTickets}
                >
                  Refresh
                </Button>
                {loading && <Spin />}
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
              </div>
            </div>
          </Col>
        </Row>
<<<<<<< HEAD

=======
        
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
        <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
          <Col className="mb-4" sm={24} xs={24}>
            <Card className="h-full mb-8">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="p-6 sm:p-[30px]">
<<<<<<< HEAD
                  <Tabs
                    defaultActiveKey="opened"
                    activeKey={currentTab}
=======
                  <Tabs 
                    defaultActiveKey="opened" 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
                    onChange={setCurrentTab}
                    className="mb-6"
                    items={[
                      { key: 'opened', label: 'Opened' },
                      { key: 'resolved', label: 'Resolved' },
                      { key: 'reopened', label: 'Reopened' },
                      { key: 'closed', label: 'Closed' },
                    ]}
                  />
<<<<<<< HEAD

=======
                
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
                  <div className="overflow-x-auto">
                    <Table
                      dataSource={filteredData}
                      columns={columns.map(col => ({
                        ...col,
<<<<<<< HEAD
                        responsive: col.dataIndex === 'helpDeskID' || col.dataIndex === 'customerName' || col.dataIndex === 'email' || col.dataIndex === 'category' || col.dataIndex === 'status' || col.key === 'action'
=======
                        responsive: col.dataIndex === 'id' || col.dataIndex === 'customerName' || col.dataIndex === 'email' || col.dataIndex === 'category' || col.dataIndex === 'status' || col.key === 'action' 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
                          ? ['xs', 'sm', 'md', 'lg', 'xl'] as any
                          : ['sm', 'md', 'lg', 'xl'] as any,
                      }))}
                      loading={loading}
<<<<<<< HEAD
                      pagination={{
=======
                      pagination={{ 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-dark dark:text-white/[.87]">
              {currentTicket?.helpDeskID || currentTicket?.id}
            </h3>
=======
          <div className="px-2 py-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Ticket Details</h3>
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
          </div>
        }
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
<<<<<<< HEAD
          <Button
            key="close"
            size="large"
            onClick={() => setViewModalVisible(false)}
            className="min-w-[100px] font-medium mb-4"
          >
=======
          <Button key="close" onClick={() => setViewModalVisible(false)}>
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
            Close
          </Button>
        ]}
        width={700}
<<<<<<< HEAD
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
=======
        className="helpdesk-view-modal"
      >
        {currentTicket && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Ticket ID</p>
                <p className="text-base font-semibold">{currentTicket.id}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</p>
                <Tag color={getStatusColor(currentTicket.status)} className="px-3 py-1 text-sm">
                  {currentTicket.status.toUpperCase()}
                </Tag>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Created At</p>
                <p className="text-base">{formatDate(currentTicket.createdAt)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Customer Name</p>
                <p className="text-base font-semibold">{currentTicket.customerName}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</p>
                <p className="text-base">{currentTicket.email}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Category</p>
                <p className="text-base">{formatCategory(currentTicket.category)}</p>
              </div>
            </div>
            
            <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Message</p>
              <div className="bg-white dark:bg-gray-700 p-3 rounded-md text-gray-800 dark:text-gray-200 whitespace-pre-wrap border border-gray-200 dark:border-gray-600">
                {currentTicket.openMessage}
              </div>
            </div>
            
            {/* Ticket History Timeline */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <p className="text-base font-medium mb-4">Ticket History</p>
              <Timeline>
                <Timeline.Item color="green">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <Text strong>Ticket Opened</Text>
                      <Tag color="green">OPENED</Tag>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(currentTicket.createdAt)}
                    </div>
                    <div className="mt-2 bg-white dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                      {currentTicket.openMessage}
                    </div>
                  </div>
                </Timeline.Item>

                {currentTicket.responses?.resolved && (
                  <Timeline.Item color="blue">
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <Text strong>Ticket Resolved</Text>
                        <Tag color="blue">RESOLVED</Tag>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(currentTicket.responses.resolved.createdAt)}
                      </div>
                      <div className="mt-2 bg-white dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                        {currentTicket.responses.resolved.response}
                      </div>
                    </div>
                  </Timeline.Item>
                )}

                {currentTicket.responses?.reopened && (
                  <Timeline.Item color="yellow">
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <Text strong>Ticket Reopened</Text>
                        <Tag color="yellow">REOPENED</Tag>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(currentTicket.responses.reopened.createdAt)}
                      </div>
                      <div className="mt-2 bg-white dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                        {currentTicket.responses.reopened.response}
                      </div>
                    </div>
                  </Timeline.Item>
                )}

                {currentTicket.responses?.closed && (
                  <Timeline.Item color="red">
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <Text strong>Ticket Closed</Text>
                        <Tag color="red">CLOSED</Tag>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(currentTicket.responses.closed.createdAt)}
                      </div>
                      <div className="mt-2 bg-white dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                        {currentTicket.responses.closed.response}
                      </div>
                    </div>
                  </Timeline.Item>
                )}
              </Timeline>
            </div>
          </div>
        )}
      </Modal>

      {/* Response Modal (Replaces Resolve and Close dialogs) */}
      <Modal
        title={
          <div className="px-2 py-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {currentTicket?.status === 'Opened' ? 'Resolve Ticket' : 'Close Ticket'}
            </h3>
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
          </div>
        }
        open={responseModalVisible}
        onCancel={() => {
          setResponseModalVisible(false);
          responseForm.resetFields();
        }}
        footer={null}
<<<<<<< HEAD
        width={650}
=======
        width={500}
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
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

=======
                label="Add Response"
                rules={[{ required: true, message: 'Please enter a response' }]}
              >
                <Input.TextArea 
                  rows={4} 
                  placeholder="Enter your response..." 
                  className="w-full"
                />
              </Form.Item>
              
              <Form.Item 
                name="status" 
                label="Update Status"
                rules={[{ required: true, message: 'Please select a status' }]}
              >
                <Select className="w-full">
                  {currentTicket.status === 'Opened' && (
                    <Select.Option value="Resolved">Resolved</Select.Option>
                  )}
                  {(currentTicket.status === 'Resolved' || currentTicket.status === 'Re-Opened') && (
                    <Select.Option value="Closed">Closed</Select.Option>
                  )}
                </Select>
              </Form.Item>
              
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
              <Form.Item className="mb-0 flex justify-end">
                <Space>
                  <Button onClick={() => setResponseModalVisible(false)}>
                    Cancel
                  </Button>
<<<<<<< HEAD
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitLoading}
                  >
                    {responseForm.getFieldValue('status') === 'Resolved' ? 'Resolve' : 'Close'}
=======
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={submitLoading}
                  >
                    Submit
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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