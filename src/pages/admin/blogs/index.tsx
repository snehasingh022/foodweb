import { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Input, 
  Button, 
  Table, 
  Space, 
  Modal, 
  message, 
  Tooltip,
  Typography,
  Form,
  Upload,
  Select
} from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  UploadOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { PageHeaders } from '../../../components/page-headers/index';
import { collection, getDocs, doc, deleteDoc, query, orderBy, addDoc, updateDoc, serverTimestamp, FieldValue } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import { getDownloadURL, ref, uploadBytes, getStorage } from 'firebase/storage';
import { Editor } from '@tinymce/tinymce-react';

// Initialize Firebase Storage
const storage = getStorage();

const { TextArea } = Input;
const { Title } = Typography;
const { Option } = Select;

// Blog interface
interface Blog {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  category?: string;
  image?: string;
  isFeatured?: string;
  createdAt?: any;
  updatedAt?: any;
  key: string;
}

function Blogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<Blog | null>(null);
  const [form] = Form.useForm();
  const [imageLoading, setImageLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [editorContent, setEditorContent] = useState('');

  const PageRoutes = [
    {
      path: '/admin',
      breadcrumbName: 'Dashboard',
    },
    {
      path: '',
      breadcrumbName: 'Blogs',
    },
  ];

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const blogsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        key: doc.id,
      })) as Blog[];
      setBlogs(blogsData);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      message.error("Failed to fetch blogs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this blog?',
      content: 'This action cannot be undone',
      okText: 'Yes, delete it',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteDoc(doc(db, "blogs", id));
          message.success("Blog deleted successfully");
          fetchBlogs();
        } catch (error) {
          console.error("Error deleting blog:", error);
          message.error("Failed to delete blog");
        }
      }
    });
  };

  const handleEdit = (blog: Blog) => {
    setCurrentBlog(blog);
    setEditMode(true);
    form.setFieldsValue({
      title: blog.title,
      slug: blog.slug,
      summary: blog.summary || '',
      category: blog.category || '',
      content: blog.content || '',
      isFeatured: blog.isFeatured || 'No',
    });
    setImageUrl(blog.image || '');
    setEditorContent(blog.content || '');
    setModalVisible(true);
  };

  const handleAdd = () => {
    setCurrentBlog(null);
    setEditMode(false);
    form.resetFields();
    setImageUrl('');
    setEditorContent('');
    setModalVisible(true);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const handleImageUpload = async (file: File) => {
    setImageLoading(true);
    try {
      const slug = form.getFieldValue('slug') || `blog-${Date.now()}`;
      const storageRef = ref(storage, `blogs/${slug}/images/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setImageUrl(downloadURL);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      message.error("Failed to upload image");
    } finally {
      setImageLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const blogData: {
        title: string;
        slug: string;
        summary?: string;
        content: string;
        category?: string;
        image: string;
        isFeatured: string;
        updatedAt: FieldValue;
        createdAt?: FieldValue;
      } = {
        title: values.title,
        slug: values.slug,
        summary: values.summary,
        content: editorContent,
        category: values.category,
        image: imageUrl,
        isFeatured: values.isFeatured,
        updatedAt: serverTimestamp(),
      };

      if (!editMode) {
        blogData.createdAt = serverTimestamp();
        await addDoc(collection(db, "blogs"), blogData);
        message.success("Blog created successfully");
      } else if (currentBlog) {
        await updateDoc(doc(db, "blogs", currentBlog.id), blogData);
        message.success("Blog updated successfully");
      }

      setModalVisible(false);
      form.resetFields();
      fetchBlogs();
    } catch (error) {
      console.error("Error saving blog:", error);
      message.error("Failed to save blog");
    }
  };

  const handleSlugGeneration = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    form.setFieldsValue({ slug });
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      filteredValue: [searchText],
      onFilter: (value: any, record: Blog) => {
        return (
          record.title.toLowerCase().includes(String(value).toLowerCase()) ||
          (record.summary?.toLowerCase() || '').includes(String(value).toLowerCase()) ||
          (record.category?.toLowerCase() || '').includes(String(value).toLowerCase())
        );
      },
      render: (text: string, record: Blog) => (
        <div className="flex items-center">
          {record.image && (
            <img 
              src={record.image} 
              alt={text} 
              className="w-10 h-10 object-cover rounded mr-3"
            />
          )}
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Featured',
      dataIndex: 'isFeatured',
      key: 'isFeatured',
      render: (text: string) => text || 'No'
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: any) => date ? new Date(date.toDate()).toLocaleDateString() : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Blog) => (
        <Space size="middle">
          <Tooltip title="View">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              className="text-blue-600 hover:text-blue-800"
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
              className="text-green-600 hover:text-green-800"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button 
              type="text" 
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record.id)}
              className="text-red-600 hover:text-red-800"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const uploadButton = (
    <div>
      {imageLoading ? <LoadingOutlined /> : <UploadOutlined />}
      <div className="mt-2">Upload</div>
    </div>
  );

  return (
    <>
      <PageHeaders
        className="flex items-center justify-between px-8 xl:px-[15px] pt-2 pb-6 sm:pb-[30px] bg-transparent sm:flex-col"
        title="Blogs"
        routes={PageRoutes}
      />
      <main className="min-h-[715px] lg:min-h-[580px] px-8 xl:px-[15px] pb-[30px] bg-transparent">
        <Row gutter={25}>
          <Col sm={24} xs={24}>
            <Card className="h-full">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="p-[25px] flex justify-between items-center border-b border-regular dark:border-white/10">
                  <h2 className="text-dark dark:text-white/[.87] text-[18px] font-semibold mb-0">Blog Management</h2>
                  <div className="flex gap-4">
                    <Input
                      placeholder="Search blogs..."
                      prefix={<SearchOutlined className="text-light dark:text-white/60" />}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="w-64"
                    />
                    <Button 
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAdd}
                      className="bg-primary hover:bg-primary-hbr"
                    >
                      Add Blog
                    </Button>
                  </div>
                </div>
                <div className="p-[25px]">
                  <Table 
                    columns={columns} 
                    dataSource={blogs} 
                    loading={loading}
                    pagination={{ 
                      pageSize: 10,
                      showSizeChanger: true,
                      pageSizeOptions: ['10', '20', '50']
                    }}
                    className="dark:text-white/[.87]"
                  />
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </main>

      <Modal
        title={editMode ? "Edit Blog" : "Add New Blog"}
        open={modalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Title"
                name="title"
                rules={[{ required: true, message: 'Please enter blog title' }]}
              >
                <Input placeholder="Blog title" onChange={handleSlugGeneration} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Slug"
                name="slug"
                rules={[{ required: true, message: 'Please enter blog slug' }]}
              >
                <Input placeholder="blog-post-slug" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Category"
                name="category"
              >
                <Input placeholder="Blog category" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Featured"
                name="isFeatured"
                initialValue="No"
              >
                <Select>
                  <Option value="Yes">Yes</Option>
                  <Option value="No">No</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Summary"
            name="summary"
          >
            <TextArea rows={3} placeholder="Brief summary of the blog" />
          </Form.Item>

          <Form.Item
            label="Featured Image"
          >
            <div className="flex items-center">
              <Upload
                name="image"
                listType="picture-card"
                className="avatar-uploader mr-4"
                showUploadList={false}
                beforeUpload={(file) => {
                  handleImageUpload(file);
                  return false;
                }}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="blog" style={{ width: '100%' }} />
                ) : (
                  uploadButton
                )}
              </Upload>
              {imageUrl && (
                <Button 
                  danger 
                  onClick={() => setImageUrl('')}
                  className="ml-4"
                >
                  Remove Image
                </Button>
              )}
            </div>
          </Form.Item>

          <Form.Item
            label="Content"
            name="content"
          >
            <Editor
              apiKey="cluzl6f3pdaveewms6exdzpvcygpa23rgrx0whym6svjop94"
              value={editorContent}
              init={{
                height: 400,
                menubar: true,
                plugins: [
                  'advlist autolink lists link image charmap print preview anchor',
                  'searchreplace visualblocks code fullscreen',
                  'insertdatetime media table paste code help wordcount'
                ],
                toolbar:
                  'undo redo | formatselect | bold italic backcolor | \
                  alignleft aligncenter alignright alignjustify | \
                  bullist numlist outdent indent | removeformat | help'
              }}
              onEditorChange={(content) => setEditorContent(content)}
            />
          </Form.Item>

          <div className="flex justify-end mt-4">
            <Button className="mr-2" onClick={handleModalCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" className="bg-primary hover:bg-primary-hbr">
              {editMode ? 'Update' : 'Create'} Blog
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}

export default Blogs; 