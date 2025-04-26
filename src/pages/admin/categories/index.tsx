import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Input, Table, Button, Modal, Form, Spin, message } from 'antd';
import { PageHeaders } from '../../../components/page-headers/index';
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { db } from '../../../authentication/firebase';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

interface CategoryType {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: any; // Using any for Firestore timestamp
  updatedAt?: any;
}

interface CategoryFormValues {
  name: string;
  description: string;
}

function Categories() {
  const PageRoutes = [
    {
      path: '/admin',
      breadcrumbName: 'Dashboard',
    },
    {
      path: '',
      breadcrumbName: 'Categories',
    },
  ];

  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);

  // Fetch categories from Firestore
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'categories'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const categoriesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CategoryType[];
      setCategories(categoriesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      message.error('Failed to fetch categories');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle add category
  const handleAddCategory = async (values: CategoryFormValues) => {
    try {
      setLoading(true);
      const slug = values.name.toLowerCase().replace(/ /g, '-');
      await addDoc(collection(db, 'categories'), {
        name: values.name,
        slug: slug,
        description: values.description,
        createdAt: serverTimestamp(),
      });
      message.success('Category added successfully');
      form.resetFields();
      setModalVisible(false);
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      message.error('Failed to add category');
      setLoading(false);
    }
  };

  // Handle update category
  const handleUpdateCategory = async (values: CategoryFormValues) => {
    if (!selectedCategory) return;
    try {
      setLoading(true);
      const slug = values.name.toLowerCase().replace(/ /g, '-');
      const categoryRef = doc(db, 'categories', selectedCategory.id);
      await updateDoc(categoryRef, {
        name: values.name,
        slug: slug,
        description: values.description,
        updatedAt: serverTimestamp(),
      });
      message.success('Category updated successfully');
      editForm.resetFields();
      setEditModalVisible(false);
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      message.error('Failed to update category');
      setLoading(false);
    }
  };

  // Handle delete category
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'categories', selectedCategory.id));
      message.success('Category deleted successfully');
      setDeleteModalVisible(false);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      message.error('Failed to delete category');
      setLoading(false);
    }
  };

  // Filter categories based on search text
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Table columns
  const columns = [
    {
      title: 'Category ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <span className="text-sm text-gray-600">{text}</span>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: any) => (
        <span>{createdAt && createdAt.toDate ? new Date(createdAt.toDate()).toLocaleString() : 'N/A'}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: CategoryType) => (
        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            className="bg-blue-500 hover:bg-blue-600"
            onClick={() => {
              setSelectedCategory(record);
              editForm.setFieldsValue({
                name: record.name,
                description: record.description,
              });
              setEditModalVisible(true);
            }}
          >
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => {
              setSelectedCategory(record);
              setDeleteModalVisible(true);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeaders
        className="flex items-center justify-between px-8 xl:px-[15px] pt-2 pb-6 sm:pb-[30px] bg-transparent sm:flex-col"
        title="Categories"
        routes={PageRoutes}
      />
      <main className="min-h-[715px] lg:min-h-[580px] px-8 xl:px-[15px] pb-[30px] bg-transparent">
        <Row gutter={25}>
          <Col sm={24} xs={24}>
            <Card className="h-full">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="p-[25px]">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-dark dark:text-white/[.87] text-[18px] font-semibold">Categories Management</h2>
                    <div className="flex items-center gap-4">
                      <Input
                        placeholder="Search categories..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-64"
                      />
                      <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={() => setModalVisible(true)}
                        className="bg-primary hover:bg-primary-hover flex items-center"
                      >
                        Add Category
                      </Button>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex justify-center items-center h-60">
                      <Spin size="large" />
                    </div>
                  ) : (
                    <Table
                      dataSource={filteredCategories}
                      columns={columns}
                      rowKey="id"
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '25', '50', '100'],
                      }}
                      className="w-full"
                    />
                  )}
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </main>

      {/* Add Category Modal */}
      <Modal
        title="Add New Category"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleAddCategory}>
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea rows={4} placeholder="Enter description" />
          </Form.Item>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading} className="bg-primary hover:bg-primary-hover">
              Add Category
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        title="Edit Category"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdateCategory}>
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea rows={4} placeholder="Enter description" />
          </Form.Item>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setEditModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading} className="bg-primary hover:bg-primary-hover">
              Update Category
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Category"
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        onOk={handleDeleteCategory}
        okText="Delete"
        okButtonProps={{ danger: true, loading: loading }}
      >
        <p>Are you sure you want to delete this category?</p>
        <p className="text-red-500 mt-2">This action cannot be undone.</p>
      </Modal>
    </>
  );
}

export default Categories; 