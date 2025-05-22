import React, { useState, useEffect } from 'react';
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
  Select,
  Tag,
  Divider,
  Spin,
  Checkbox
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  LoadingOutlined,
  CloudUploadOutlined,
  PictureOutlined,
  PaperClipOutlined
} from '@ant-design/icons';
import { PageHeaders } from '../../../components/page-headers/index';
import { collection, getDocs, doc, deleteDoc, query, orderBy, addDoc, updateDoc, serverTimestamp, FieldValue, where } from 'firebase/firestore';
import { db, app } from '../../../authentication/firebase';
import { getDownloadURL, ref, uploadBytes, getStorage, deleteObject } from 'firebase/storage';
import { Editor } from '@tinymce/tinymce-react';
import Protected from '../../../components/Protected/Protected';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Initialize Firebase Storage
let storage: any = null;
// Storage should only be initialized on the client side
if (typeof window !== "undefined") {
  storage = getStorage(app);
}

const { TextArea } = Input;
const { Title, Text } = Typography;
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
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  seoImage?: string;
  tags?: string[];
}

function Blogs() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<Blog | null>(null);

  useEffect(() => {
    // Only fetch data on the client side
    if (typeof window !== "undefined") {
      fetchBlogs();
    }
  }, []);

  const fetchBlogs = async () => {
    if (typeof window === "undefined") return;

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
    if (typeof window === "undefined") return;

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
    router.push(`/admin/blogs/edit/${blog.id}`);
  };

  const handleView = (blog: Blog) => {
    setCurrentBlog(blog);
    setDetailModalVisible(true);
  };

  const handleOpenImage = (imageUrl: string) => {
    window.open(imageUrl, '_blank');
  };

  const columns = [
    {
      title: 'Blog ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <span className="text-sm text-gray-600">{text}</span>,
    },
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
      render: (text: string, record: any) => (
        <div className="flex items-center">
          {record.imageURL && (
            <img
              src={record.imageURL}
              alt={text}
              className="w-10 h-10 object-cover rounded mr-3"
            />
          )}
          <div>
            <span className="font-medium">{text}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'categoryDetails',
      key: 'category',
      render: (categoryDetails: any) => categoryDetails?.name || 'No Category',
    },
    {
      title: 'Featured',
      dataIndex: 'isFeatured',
      key: 'isFeatured',
      render: (isFeatured: boolean) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          isFeatured ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {isFeatured ? 'Yes' : 'No'}
        </span>
      ),
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
              onClick={() => handleView(record)}
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

  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(searchText.toLowerCase()) ||
    blog.slug.toLowerCase().includes(searchText.toLowerCase()) ||
    blog.summary?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <>
      <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] pt-6 bg-transparent">
        <Row gutter={25} className="mb-5">
          <Col xs={24}>
            <div className="flex justify-between items-center mb-5 flex-wrap gap-3 p-5">
              <div className="flex-1">
                <h1 className="text-[24px] font-medium text-dark dark:text-white/[.87]">Blog Management</h1>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/admin/blogs/add">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                  >
                    Add Blog
                  </Button>
                </Link>
                <Input
                  placeholder="Search blogs..."
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
                    onClick={fetchBlogs}
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
                      dataSource={filteredBlogs}
                      columns={columns}
                      pagination={{ pageSize: 10 }}
                      loading={loading}
                      rowKey="id"
                      className="[&>div>div>div>div>div>.ant-table-content>table>thead>tr>th]:bg-regularBG dark:[&>div>div>div>div>div>.ant-table-content>table>thead>tr>th]:bg-[#323440] [&>div>div>div>div>div>.ant-table-content>table>thead>tr>th]:font-medium"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </main>

      {/* Blog Detail Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
                <Text strong className="text-base mt-10 ml-2">Blog Details</Text>
            </span>
          </div>
        }
        open={detailModalVisible && currentBlog !== null}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button
            key="back"
            size="large"
            onClick={() => setDetailModalVisible(false)}
            className="min-w-[100px] font-medium mb-4"
          >
            Close
          </Button>,
          <Button
            key="edit"
            type="primary"
            size="large"
            icon={<EditOutlined />}
            onClick={() => {
              setDetailModalVisible(false);
              if (currentBlog) handleEdit(currentBlog);
            }}
            className="min-w-[160px] font-medium mb-4 mr-4"
          >
            Edit Blog
          </Button>
        ]}
        width={800}
        className="blog-detail-modal"
        bodyStyle={{ padding: '20px 24px' }}
        maskClosable={false}
      >
        {currentBlog ? (
          <div className="p-4 bg-white dark:bg-[#1b1e2b] rounded-lg shadow-sm">
            <div className="mb-6">
              {currentBlog.image && (
                <div className="mb-6 flex justify-center">
                  <div className="relative" style={{ maxWidth: '100%', maxHeight: '300px', overflow: 'hidden' }}>
                    <img
                      src={currentBlog.image}
                      alt={currentBlog.title}
                      className="object-contain max-h-80 rounded-lg cursor-pointer"
                      onClick={() => handleOpenImage(currentBlog.image || '')}
                    />
                    <Tooltip title="View Full Image">
                      <Button
                        icon={<EyeOutlined />}
                        className="absolute bottom-2 right-2 bg-white/80 hover:bg-white"
                        onClick={() => handleOpenImage(currentBlog.image || '')}
                      />
                    </Tooltip>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm">Title:</Text>
                  <div className="mt-1">
                    <Text strong className="text-base">{currentBlog.title}</Text>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm">Slug:</Text>
                  <div className="mt-1">
                    <Text strong className="text-base">{currentBlog.slug}</Text>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm">Category:</Text>
                  <div className="mt-1">
                    <Text strong className="text-base">{currentBlog.category || 'N/A'}</Text>
                  </div>
                </div>
                <div className="border-b pb-2">
                  <Text type="secondary" className="text-sm">Featured:</Text>
                  <div className="mt-1">
                    <Text strong className="text-base">{currentBlog.isFeatured || 'No'}</Text>
                  </div>
                </div>
              </div>
              {currentBlog.tags && currentBlog.tags.length > 0 && (
                <div className="mb-6 border-b pb-4">
                  <Text type="secondary" className="text-sm">Tags:</Text>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {currentBlog.tags.map((tag, index) => (
                      <Tag key={index} color="blue">{tag}</Tag>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6 border-b pb-4">
                <Text type="secondary" className="text-sm">Summary:</Text>
                <div className="mt-2 p-3 bg-regularBG dark:bg-[#323440] rounded-md border border-gray-100 dark:border-gray-700">
                  <Text className="text-base whitespace-pre-line">{currentBlog.summary || 'No summary available'}</Text>
                </div>
              </div>

              {/* SEO Section */}
              <div className="mb-6">
                <Text type="secondary" className="text-sm font-medium">SEO Information:</Text>
                <div className="grid grid-cols-2 gap-6 mt-3">
                  <div className="border-b pb-2">
                    <Text type="secondary" className="text-sm">SEO Title:</Text>
                    <div className="mt-1">
                      <Text strong className="text-base">{currentBlog.seoTitle || 'N/A'}</Text>
                    </div>
                  </div>
                  <div className="border-b pb-2">
                    <Text type="secondary" className="text-sm">SEO Description:</Text>
                    <div className="mt-1">
                      <Text strong className="text-base">{currentBlog.seoDescription || 'N/A'}</Text>
                    </div>
                  </div>
                </div>

                {currentBlog.seoKeywords && currentBlog.seoKeywords.length > 0 && (
                  <div className="mt-4 border-b pb-4">
                    <Text type="secondary" className="text-sm">SEO Keywords:</Text>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {currentBlog.seoKeywords.map((keyword, index) => (
                        <Tag key={index} color="green">{keyword}</Tag>
                      ))}
                    </div>
                  </div>
                )}

                {currentBlog.seoImage && (
                  <div className="mt-4 border-b pb-4">
                    <Text type="secondary" className="text-sm">SEO Image:</Text>
                    <div className="mt-2 flex justify-start">
                      <div className="relative" style={{ maxWidth: '100%', maxHeight: '150px', overflow: 'hidden' }}>
                        <img
                          src={currentBlog.seoImage}
                          alt="SEO Image"
                          className="object-contain max-h-40 rounded-lg cursor-pointer"
                          onClick={() => handleOpenImage(currentBlog.seoImage || '')}
                        />
                        <Tooltip title="View Full Image">
                          <Button
                            icon={<EyeOutlined />}
                            className="absolute bottom-2 right-2 bg-white/80 hover:bg-white"
                            onClick={() => handleOpenImage(currentBlog.seoImage || '')}
                          />
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {currentBlog.content && (
                <div>
                  <Text type="secondary" className="text-sm">Content:</Text>
                  <div className="mt-2 p-5 bg-regularBG dark:bg-[#323440] rounded-md border border-gray-100 dark:border-gray-700 overflow-auto max-h-96">
                    <div
                      className="blog-content text-base"
                      dangerouslySetInnerHTML={{ __html: currentBlog.content }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center p-10">
            <Spin size="large" />
          </div>
        )}
      </Modal>
    </>
  );
}

export default Protected(Blogs, ["admin"]);