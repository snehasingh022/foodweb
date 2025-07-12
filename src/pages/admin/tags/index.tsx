import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Input,
  Button,
  Space,
  Modal,
  Form,
  message,
  Spin,
  Tooltip
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  setDoc,
} from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import Protected from '../../../components/Protected/Protected';

// Define Tag interface
interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: any;
  updatedAt: any;
  key: string;
}

function Tags() {
  // State declarations
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Fetch tags from Firestore
  const fetchTags = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "tags"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const tagsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        key: doc.id,
        name: doc.data().name || '',
        slug: doc.data().slug || '',
        description: doc.data().description || '',
        createdAt: doc.data().createdAt,
        updatedAt: doc.data().updatedAt,
      }));

      setTags(tagsData);
    } catch (error) {
      console.error("Error fetching tags:", error);
      message.error("Failed to fetch tags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  // Handle tag name change and generate slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    form.setFieldsValue({ slug });
  };

  // Add new tag
  const handleAddTag = async (values: any) => {
    try {
      const tagId = `TID${Date.now().toString().slice(-6)}`;
      await setDoc(doc(db, "tags", tagId), {
        name: values.name,
        slug: values.slug,
        description: values.description,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      message.success("Tag added successfully");
      setModalVisible(false);
      form.resetFields();
      fetchTags();
    } catch (error) {
      console.error("Error adding tag:", error);
      message.error("Failed to add tag");
    }
  };

  // Edit tag
  const handleEditTag = async (values: any) => {
    if (!selectedTag) return;

    try {
      const tagRef = doc(db, "tags", selectedTag.id);
      await updateDoc(tagRef, {
        name: values.name,
        slug: values.slug,
        description: values.description,
        updatedAt: serverTimestamp(),
      });

      message.success("Tag updated successfully");
      setModalVisible(false);
      form.resetFields();
      fetchTags();
    } catch (error) {
      console.error("Error updating tag:", error);
      message.error("Failed to update tag");
    }
  };

  // Delete tag
  const handleDeleteTag = async () => {
    if (!selectedTag) return;

    try {
      await deleteDoc(doc(db, "tags", selectedTag.id));
      message.success("Tag deleted successfully");
      setDeleteModalVisible(false);
      fetchTags();
    } catch (error) {
      console.error("Error deleting tag:", error);
      message.error("Failed to delete tag");
    }
  };

  // Filter tags based on search text
  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchText.toLowerCase()) ||
    tag.slug.toLowerCase().includes(searchText.toLowerCase()) ||
    tag.description.toLowerCase().includes(searchText.toLowerCase()) ||
    tag.id.toLowerCase().includes(searchText.toLowerCase())
  );

  // Table columns
  const columns = [
    {
      title: 'Tag ID',
      dataIndex: 'id',
      key: 'id',
      width: '200px',
      ellipsis: true,
    },
    {
      title: 'Tag Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Tag, b: Tag) => a.name.localeCompare(b.name),
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
      ellipsis: true,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: any) => createdAt ? new Date(createdAt.toDate()).toLocaleString() : 'N/A',
      sorter: (a: Tag, b: Tag) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime();
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: string, record: Tag) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              className="text-green-600 hover:text-green-800"
              onClick={() => {
                setSelectedTag(record);
                setEditMode(true);
                // Populate form with the selected tag data
                form.setFieldsValue({
                  name: record.name,
                  slug: record.slug,
                  description: record.description,
                });
                setModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => {
                setSelectedTag(record);
                setDeleteModalVisible(true);
              }}
              className="text-red-600 hover:text-red-800"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditMode(false);
    form.resetFields();
  };

  const handleSubmit = async (values: any) => {
    if (editMode) {
      await handleEditTag(values);
    } else {
      await handleAddTag(values);
    }
    setEditMode(false);
  };

  const openAddModal = () => {
    setEditMode(false);
    form.resetFields();
    setModalVisible(true);
  };

  return (
    <>
      <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] pt-6 bg-transparent">
        <Row gutter={25} className="mb-5">
          <Col xs={24}>
            <div className="flex justify-between items-center mb-5 flex-wrap gap-3 p-5">
              <div className="flex-1">
                <h1 className="text-[24px] font-medium text-dark dark:text-white/[.87]">Tag Management</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="primary"
                  onClick={openAddModal}
                  icon={<PlusOutlined />}
                  className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                >
                  Add Tag
                </Button>
                <Input
                  placeholder="Search tags..."
                  prefix={<SearchOutlined />}
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
                    onClick={fetchTags}
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
                  <div className="overflow-x-auto">
                    <Table
                      dataSource={filteredTags}
                      columns={columns}
                      pagination={{ pageSize: 10 }}
                      loading={loading}
                      className="[&>div>div>div>div>div>.ant-table-content>table>thead>tr>th]:bg-regularBG dark:[&>div>div>div>div>div>.ant-table-content>table>thead>tr>th]:bg-[#323440] [&>div>div>div>div>div>.ant-table-content>table>thead>tr>th]:font-medium"
                      bordered={false}
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
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              {editMode ? "Edit Tag" : "Add New Tag"}
            </span>
          </div>
        }
        open={modalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width="95%"
        style={{ maxWidth: '600px' }}
        className="responsive-modal"
        bodyStyle={{ padding: '24px' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="px-2 pt-1"
        >
          <div className="mb-6">
            <Form.Item
              label={<span className="text-dark dark:text-white/[.87] font-medium">Tag Name</span>}
              name="name"
              rules={[{ required: true, message: 'Please enter tag name!' }]}
            >
              <Input
                prefix={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-gray-400" viewBox="0 0 16 16">
                  <path d="M3.5 2a.5.5 0 0 0-.5.5v5a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 .5-.5v-5a.5.5 0 0 0-.5-.5h-5zm1 .5H8v4H4.5v-4zM11 1a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h10zm-1 2H2v9h8v-9z" />
                </svg>}
                placeholder="Enter tag name"
                onChange={handleNameChange}
                className="py-2"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-dark dark:text-white/[.87] font-medium">Slug</span>}
              name="slug"
              rules={[{ required: true, message: 'Please enter tag slug!' }]}
              tooltip="The slug is used in the URL. It must be unique and contain only lowercase letters, numbers, and hyphens."
            >
              <Input
                prefix={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-gray-400" viewBox="0 0 16 16">
                  <path d="M6.354 5.5H4a3 3 0 0 0 0 6h3a3 3 0 0 0 2.83-4H9q-.13 0-.25.031A2 2 0 0 1 7 10.5H4a2 2 0 1 1 0-4h1.535c.218-.376.495-.714.82-1z" />
                  <path d="M9 5.5a3 3 0 0 0-2.83 4h1.098A2 2 0 0 1 9 6.5h3a2 2 0 1 1 0 4h-1.535a4.02 4.02 0 0 1-.82 1H12a3 3 0 1 0 0-6H9z" />
                </svg>}
                placeholder="tag-slug"
                className="py-2"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-dark dark:text-white/[.87] font-medium">Description</span>}
              name="description"
              rules={[{ required: true, message: 'Please enter tag description!' }]}
            >
              <Input.TextArea
                placeholder="Enter a description for this tag"
                rows={4}
                className="text-base"
              />
            </Form.Item>
          </div>

          <div className="flex justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Space size="middle">
              <Button
                onClick={handleModalCancel}
                className="px-5 h-10 shadow-none hover:bg-gray-50 dark:hover:bg-white/10 mb-6 mr-6"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="px-5 h-10 shadow-none mb-6 mr-6"
              >
                {editMode ? "Update Tag" : "Add Tag"}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              Confirm Delete
            </span>
          </div>
        }
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        onOk={handleDeleteTag}
        okText="Delete"
        okButtonProps={{ danger: true, className: "mr-4 mb-4" }} // margin to OK button
        cancelButtonProps={{ className: "mb-4" }} // margin to Cancel button
      >
        <p className="p-3">
          Are you sure you want to delete this tag? This action cannot be undone.
        </p>
      </Modal>

    </>
  );
}

export default Protected(Tags, ["admin", "tours+media","partner"]);