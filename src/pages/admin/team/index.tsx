import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, Input, Select, Space, Spin } from 'antd';
import { PageHeaders } from '../../../components/page-headers/index';
import { useRouter } from 'next/router';
import { db, auth } from '../../../authentication/firebase';
import { useAuth } from '../../../authentication/AuthContext';
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
  addDoc,
  DocumentData
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { UilPlus, UilEdit, UilTrash } from '@iconscout/react-unicons';

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
  const PageRoutes = [
    {
      path: '/admin',
      breadcrumbName: 'Dashboard',
    },
    {
      path: '',
      breadcrumbName: 'Team',
    },
  ];

  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [form] = Form.useForm<EditUserFormValues>();
  const [addForm] = Form.useForm<AddUserFormValues>();
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
      // First check if the userAdmin collection exists
      const userAdminCollection = collection(db, "userAdmin");
      const usersQuery = query(userAdminCollection, orderBy("createdAt", "desc"));
      
      const querySnapshot = await getDocs(usersQuery);
      
      // If no users found, check admins collection as fallback
      if (querySnapshot.empty) {
        console.log("No users found in userAdmin collection. Checking admins collection...");
        const adminsCollection = collection(db, "admins");
        const adminsSnapshot = await getDocs(adminsCollection);
        
        if (!adminsSnapshot.empty) {
          const adminsList = adminsSnapshot.docs.map(doc => {
            const data = doc.data() as DocumentData;
            return {
              key: doc.id,
              id: doc.id,
              name: data.name || data.displayName || '',
              email: data.email || '',
              roles: ['admin'], // Default role for admins collection
              status: 'active',
              uid: data.uid
            } as UserType;
          });
          setUsers(adminsList);
        } else {
          setUsers([]);
        }
      } else {
        // Process users from userAdmin collection
        const usersList = querySnapshot.docs.map((doc) => {
          const data = doc.data() as DocumentData;
          return {
            key: doc.id,
            id: doc.id,
            name: data.name || '',
            email: data.email || '',
            roles: data.roles || [],
            status: data.status || 'active',
            authorDescription: data.authorDescription,
            slug: data.slug,
            createdAt: data.createdAt,
            uid: data.uid
          } as UserType;
        });
        setUsers(usersList);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      // Add fallback empty array to prevent undefined errors
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
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, "userAdmin", selectedUser.id));
      
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
    
    setLoading(true);
    try {
      const userRef = doc(db, "userAdmin", selectedUser.id);
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
      
      // Log out the created user to avoid session conflicts
      // Use the imported signOut function directly with the auth object
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error("Error signing out after user creation:", signOutError);
      }
      
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

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: UserType, b: UserType) => a.name.localeCompare(b.name),
      render: (text: string) => <span className="capitalize">{text}</span>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Roles',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[]) => (
        <div className="flex flex-wrap gap-1">
          {roles?.map((role: string) => (
            <span key={role} className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs capitalize">
              {role}
            </span>
          ))}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span className={`px-2 py-1 rounded text-xs ${
          status === 'active' 
            ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400' 
            : 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400'
        }`}>
          {status || 'active'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_: any, record: UserType) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<UilEdit className="h-4 w-4" />} 
            onClick={() => handleEditUser(record)}
            className="text-blue-600 dark:text-blue-400"
          />
          <Button 
            type="text" 
            icon={<UilTrash className="h-4 w-4" />} 
            onClick={() => handleDeleteUser(record)}
            className="text-red-600 dark:text-red-400"
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeaders
        className="flex items-center justify-between px-8 xl:px-[15px] pt-2 pb-6 sm:pb-[30px] bg-transparent sm:flex-col"
        title="Team"
        routes={PageRoutes}
      />
      <main className="min-h-[715px] lg:min-h-[580px] px-8 xl:px-[15px] pb-[30px] bg-transparent">
        <Row gutter={25}>
          <Col sm={24} xs={24}>
            <Card className="h-full">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="p-[25px]">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-dark dark:text-white/[.87] text-[16px] font-semibold">Team Management</h2>
                    <Button
                      type="primary"
                      className="bg-primary hover:bg-primary-hover"
                      icon={<UilPlus />}
                      onClick={() => setAddModalVisible(true)}
                    >
                      Add User
                    </Button>
                  </div>
                  
                  <Table 
                    dataSource={users} 
                    columns={columns} 
                    loading={loading}
                    pagination={{ 
                      pageSize: 10,
                      showSizeChanger: true,
                      pageSizeOptions: ['10', '25', '50', '100']
                    }}
                    rowKey="id"
                    className="team-table"
                  />
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </main>

      {/* Edit User Modal */}
      <Modal
        title="Edit User"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateUser}
          initialValues={{
            name: selectedUser?.name,
            email: selectedUser?.email,
            roles: selectedUser?.roles,
            status: selectedUser?.status || 'active',
          }}
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
            {({ getFieldValue }) => 
              getFieldValue('roles')?.includes('author') ? (
                <>
                  <Form.Item
                    name="slug"
                    label="Author Slug"
                  >
                    <Input placeholder="Enter slug" />
                  </Form.Item>
                  
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

          <div className="flex justify-end gap-2">
            <Button onClick={() => setEditModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading} className="bg-primary hover:bg-primary-hover">
              Update
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Add User Modal */}
      <Modal
        title="Add User"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAddUser}
          initialValues={{
            status: 'active',
          }}
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
            {({ getFieldValue }) => 
              getFieldValue('roles')?.includes('author') ? (
                <>
                  <Form.Item
                    name="slug"
                    label="Author Slug"
                  >
                    <Input placeholder="Enter slug" />
                  </Form.Item>
                  
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
          >
            <Select
              placeholder="Select status"
              options={statusOptions}
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setAddModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading} className="bg-primary hover:bg-primary-hover">
              Add User
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete User"
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        onOk={confirmDelete}
        okText="Delete"
        okButtonProps={{ 
          loading: loading,
          className: "bg-red-600 hover:bg-red-700 border-red-600"
        }}
      >
        <p>Are you sure you want to delete {selectedUser?.name}?</p>
        <p className="text-red-500 text-sm mt-2">This action cannot be undone.</p>
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
export default function TeamPage() {
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
} 