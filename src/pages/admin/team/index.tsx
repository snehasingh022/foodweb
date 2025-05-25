import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
=======
import { 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Space, 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
  Spin,
  Typography,
  Tag
} from 'antd';
<<<<<<< HEAD
import {
  EditOutlined,
=======
import { 
  EditOutlined, 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
  DeleteOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import { db, auth } from '../../../authentication/firebase';
import { useAuth } from '../../../authentication/AuthContext';
<<<<<<< HEAD
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  where,
=======
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  setDoc, 
  serverTimestamp, 
  where, 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
  addDoc,
  DocumentData
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
<<<<<<< HEAD
import {
  UilPlus,
  UilEdit,
  UilTrash,
=======
import { 
  UilPlus, 
  UilEdit, 
  UilTrash, 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
  UilEye
} from '@iconscout/react-unicons';
import type { Breakpoint } from 'antd/es/_util/responsiveObserver';
import Protected from '../../../components/Protected/Protected';

const { Text, Title } = Typography;

// Define user type
interface UserType {
  id: string;
  key: string;
  uid?: string;
  name: string;
  email: string;
  roles: string[];
  status: string;
  authorDescription?: string;
  slug?: string;
  createdAt?: any;
}

// Define form values types
interface EditUserFormValues {
  name: string;
  email: string;
  roles: string[];
  status: string;
  authorDescription?: string;
  slug?: string;
}

interface AddUserFormValues extends EditUserFormValues {
  password: string;
}

// Define column types
type SorterFn = (a: UserType, b: UserType) => number;

function Team() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [form] = Form.useForm<EditUserFormValues>();
  const [addForm] = Form.useForm<AddUserFormValues>();
  const [searchText, setSearchText] = useState('');
  const router = useRouter();

  const roleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'Helpdesk', value: 'helpdesk' },
    { label: 'Author', value: 'author' }
  ];

  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
  ];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Use only the admins collection 
      const adminsCollection = collection(db, "admins");
      const usersQuery = query(adminsCollection, orderBy("createdAt", "desc"));
<<<<<<< HEAD

      const querySnapshot = await getDocs(usersQuery);

=======
      
      const querySnapshot = await getDocs(usersQuery);
      
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
      if (!querySnapshot.empty) {
        const adminsList = querySnapshot.docs.map(doc => {
          const data = doc.data() as DocumentData;
          return {
            key: doc.id,
            id: doc.id,
            name: data.name || data.displayName || '',
            email: data.email || '',
            roles: data.roles || (data.isAdmin ? ['admin'] : []),
            status: data.status || 'active',
            uid: data.uid || doc.id,
            authorDescription: data.authorDescription,
            slug: data.slug,
            createdAt: data.createdAt
          } as UserType;
        });
        setUsers(adminsList);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditUser = (user: UserType) => {
    setSelectedUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      roles: user.roles,
      status: user.status,
      ...(user.roles.includes('author') && {
        authorDescription: user.authorDescription || '',
        slug: user.slug || user.name?.toLowerCase().replace(/ /g, '-') || '',
      })
    });
    setEditModalVisible(true);
  };

  const handleDeleteUser = (user: UserType) => {
    setSelectedUser(user);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
<<<<<<< HEAD

    setLoading(true);
    try {
      await deleteDoc(doc(db, "admins", selectedUser.id));

=======
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, "admins", selectedUser.id));
      
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
      // If the user is an author, delete from authors collection
      if (selectedUser.roles.includes('author')) {
        const authorQuery = query(
          collection(db, "authors"),
          where("name", "==", selectedUser.name)
        );
        const authorSnapshot = await getDocs(authorQuery);
        if (!authorSnapshot.empty) {
          await deleteDoc(authorSnapshot.docs[0].ref);
        }
      }
<<<<<<< HEAD

=======
      
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
      fetchUsers();
      setDeleteModalVisible(false);
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (values: EditUserFormValues) => {
    if (!selectedUser) return;
<<<<<<< HEAD

=======
    
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
    setLoading(true);
    try {
      const userRef = doc(db, "admins", selectedUser.id);
      await updateDoc(userRef, {
        name: values.name,
        roles: values.roles,
        status: values.status,
      });

      // Handle author data
      if (values.roles.includes('author')) {
        const authorQuery = query(
          collection(db, "authors"),
          where("name", "==", selectedUser.name)
        );
        const authorSnapshot = await getDocs(authorQuery);
<<<<<<< HEAD

=======
        
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
        if (authorSnapshot.empty) {
          // Create new author record
          await addDoc(collection(db, "authors"), {
            name: values.name,
            slug: values.slug || values.name.toLowerCase().replace(/ /g, '-'),
            description: values.authorDescription || '',
            createdAt: serverTimestamp(),
          });
        } else {
          // Update existing author
          await updateDoc(authorSnapshot.docs[0].ref, {
            name: values.name,
            slug: values.slug || values.name.toLowerCase().replace(/ /g, '-'),
            description: values.authorDescription || '',
          });
        }
      } else if (
        !values.roles.includes('author') &&
        selectedUser.roles.includes('author')
      ) {
        // Delete author if role was removed
        const authorQuery = query(
          collection(db, "authors"),
          where("name", "==", selectedUser.name)
        );
        const authorSnapshot = await getDocs(authorQuery);
        if (!authorSnapshot.empty) {
          await deleteDoc(authorSnapshot.docs[0].ref);
        }
      }

      fetchUsers();
      setEditModalVisible(false);
    } catch (error) {
      console.error("Error updating user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (values: AddUserFormValues) => {
    setLoading(true);
    try {
      // Create user with Firebase Auth directly using the imported auth object
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      // Add user to admins collection
      const userDocRef = doc(db, "admins", user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        name: values.name,
        email: values.email,
        roles: values.roles,
        status: values.status || 'active',
        createdAt: serverTimestamp(),
      });

      // If user is an author, add to authors collection
      if (values.roles.includes('author')) {
        await addDoc(collection(db, "authors"), {
          name: values.name,
          slug: values.slug || values.name.toLowerCase().replace(/ /g, '-'),
          description: values.authorDescription || '',
          createdAt: serverTimestamp(),
        });
      }

      fetchUsers();
      setAddModalVisible(false);
      addForm.resetFields();
<<<<<<< HEAD

=======
      
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
    } catch (error: any) {
      console.error("Error adding user:", error);
      if (error.code === "auth/email-already-in-use") {
        // Handle the duplicate email error
        alert("Email address is already in use. Please use a different email.");
      } else {
        // Show more descriptive error
        alert(`Error creating user: ${error.message || error}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

<<<<<<< HEAD
  const filteredUsers = users.filter(user =>
=======
  const filteredUsers = users.filter(user => 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
    user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchText.toLowerCase()) ||
    (user.uid ? user.uid.toLowerCase().includes(searchText.toLowerCase()) : false) ||
    user.roles?.some(role => role.toLowerCase().includes(searchText.toLowerCase()))
  );

  const columns = [
    {
      title: 'UID',
      dataIndex: 'uid',
      key: 'uid',
      width: 120,
      render: (text: string) => <Text copyable>{text}</Text>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-medium">{text}</span>,
      sorter: (a: UserType, b: UserType) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[]) => (
        <Space size={[0, 8]} wrap>
          {roles?.map(role => (
<<<<<<< HEAD
            <Tag
              key={role}
              color={
                role === 'admin' ? 'blue' :
                  role === 'helpdesk' ? 'orange' :
                    role === 'author' ? 'purple' : 'default'
=======
            <Tag 
              key={role} 
              color={
                role === 'admin' ? 'blue' : 
                role === 'helpdesk' ? 'orange' : 
                role === 'author' ? 'purple' : 'default'
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
              }
            >
              {role.toUpperCase()}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status?.toUpperCase() || 'ACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: UserType) => (
        <Space size="small">
          {/* <Button 
            type="primary" 
            icon={<UilEdit />} 
            size="small" 
            onClick={() => handleEditUser(record)}
          /> */}
<<<<<<< HEAD
          <Button
            type="text"
            icon={<EditOutlined />}
            className="text-green-600 hover:text-green-800"
            onClick={() => handleEditUser(record)}
          />
=======
          <Button 
                type="primary" 
                size="small" 
                icon={<EditOutlined />}
                onClick={() => handleEditUser(record)}
                className="bg-primary hover:bg-primary-hbr"
              />
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
          {/* <Button 
            type="primary" 
            danger
            icon={<UilTrash />}
            size="small"
            onClick={() => handleDeleteUser(record)}
          /> */}
<<<<<<< HEAD
          <Button
            type="text"
            icon={<DeleteOutlined />}
            className="text-red-600 hover:text-red-800"
            onClick={() => handleDeleteUser(record)}
          />
=======
          <Button 
                type="primary" 
                danger
                size="small" 
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteUser(record)}
              />
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
        </Space>
      ),
    },
  ];

  return (
    <>
      <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] pt-6 bg-transparent">
        <Row gutter={25} className="mb-5">
          <Col xs={24}>
            <div className="flex justify-between items-center mb-5 flex-wrap gap-3 p-5">
              <div className="flex-1">
                <h1 className="text-[24px] font-medium text-dark dark:text-white/[.87]">Team Management</h1>
              </div>
              <div className="flex items-center gap-2">
<<<<<<< HEAD
                <Button
                  type="primary"
=======
                <Input 
                  placeholder="Search team members..." 
                  prefix={<SearchOutlined />}
                  onChange={e => handleSearch(e.target.value)}
                  style={{ width: 250 }}
                  className="py-2 text-base font-"
                />
                <Button 
                  type="primary" 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
                  onClick={() => setAddModalVisible(true)}
                  icon={<UilPlus />}
                  className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                >
                  Add User
                </Button>
<<<<<<< HEAD
                <Input
                  placeholder="Search team members..."
                  prefix={<SearchOutlined />}
                  onChange={e => handleSearch(e.target.value)}
                  style={{ width: 250 }}
                  className="py-2 text-base font-"
                />
                {loading ? (
                  <div className="h-10 flex items-center justify-center">
                    <Spin size="small" />
                  </div>
                ) : (
                  <Button
                    type="primary"
                    onClick={fetchUsers}
                    className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                  >
                    Refresh
                  </Button>
                )}
=======
                {loading && <Spin />}
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
              </div>
            </div>
          </Col>
        </Row>
<<<<<<< HEAD

=======
        
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
        <Row gutter={25}>
          <Col sm={24} xs={24}>
            <Card className="h-full mb-8">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="p-6 sm:p-[30px]">
                  <div className="table-responsive">
                    <Table
                      columns={columns}
                      dataSource={filteredUsers}
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

      {/* User Edit Modal */}
      <Modal
        title={<Title level={4} className="text-lg font-semibold p-4">Edit User</Title>}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width="95%"
        style={{ maxWidth: '600px' }}
        className="responsive-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateUser}
          className="p-4"
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input placeholder="Enter name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: 'Please enter email' }]}
          >
            <Input disabled placeholder="Enter email" />
          </Form.Item>

          <Form.Item
            name="roles"
            label="Roles"
            rules={[{ required: true, message: 'Please select at least one role' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select roles"
              options={roleOptions}
            />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.roles !== currentValues.roles}
          >
<<<<<<< HEAD
            {({ getFieldValue }) =>
=======
            {({ getFieldValue }) => 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
              getFieldValue('roles')?.includes('author') ? (
                <>
                  <Form.Item
                    name="slug"
                    label="Author Slug"
                  >
                    <Input placeholder="Enter slug" />
                  </Form.Item>
<<<<<<< HEAD

=======
                  
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
                  <Form.Item
                    name="authorDescription"
                    label="Author Description"
                  >
                    <Input.TextArea rows={4} placeholder="Enter author description" />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select
              placeholder="Select status"
              options={statusOptions}
            />
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end mt-4">
            <Space>
              <Button size="large" onClick={() => setEditModalVisible(false)} className="min-w-[100px] font-medium">
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" size="large" loading={loading} className="bg-primary hover:bg-primary-hover min-w-[100px] font-medium">
                Update
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add User Modal */}
      <Modal
        title={<Title level={4} className="text-lg font-semibold p-4">Add New User</Title>}
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
        width="95%"
        style={{ maxWidth: '600px' }}
        className="responsive-modal"
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAddUser}
          className="p-4"
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input placeholder="Enter name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please enter password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>

          <Form.Item
            name="roles"
            label="Roles"
            rules={[{ required: true, message: 'Please select at least one role' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select roles"
              options={roleOptions}
            />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.roles !== currentValues.roles}
          >
<<<<<<< HEAD
            {({ getFieldValue }) =>
=======
            {({ getFieldValue }) => 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
              getFieldValue('roles')?.includes('author') ? (
                <>
                  <Form.Item
                    name="slug"
                    label="Author Slug"
                  >
                    <Input placeholder="Enter slug" />
                  </Form.Item>
<<<<<<< HEAD

=======
                  
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
                  <Form.Item
                    name="authorDescription"
                    label="Author Description"
                  >
                    <Input.TextArea rows={4} placeholder="Enter author description" />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            initialValue="active"
          >
            <Select
              placeholder="Select status"
              options={statusOptions}
            />
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end mt-4">
            <Space>
              <Button size="large" onClick={() => setAddModalVisible(false)} className="min-w-[100px] font-medium">
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" size="large" loading={loading} className="bg-primary hover:bg-primary-hover min-w-[100px] font-medium">
                Add User
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title={<Title level={4} className="text-lg font-semibold p-4">Confirm Delete</Title>}
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        footer={[
          <Button key="back" size="large" onClick={() => setDeleteModalVisible(false)} className="min-w-[100px] font-medium">
            Cancel
          </Button>,
          <Button key="submit" type="primary" danger size="large" loading={loading} onClick={confirmDelete} className="min-w-[100px] font-medium">
            Delete
          </Button>,
        ]}
        width="95%"
        style={{ maxWidth: '500px' }}
        className="responsive-modal"
      >
        <div className="p-4">
          <p>Are you sure you want to delete {selectedUser?.name}?</p>
        </div>
      </Modal>
    </>
  );
}

// Define currentUser type for the container component
interface UserInfo {
  uid: string;
  roles?: string[];
  isAdmin?: boolean;
  [key: string]: any;
}

// Add role-based access control
function TeamPage() {
  const router = useRouter();
  const { currentUser, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If authentication is completed
    if (currentUser !== null) {
      // If user is not admin, redirect based on role
      if (!isAdmin) {
        console.log("User is not an admin, redirecting");
        router.push('/admin/support/tickets');
      }
      setLoading(false);
    }
  }, [currentUser, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  // Only render Team component if user has admin access
  return isAdmin ? <Team /> : null;
<<<<<<< HEAD
}
=======
} 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12

export default Protected(TeamPage, ["admin"]);