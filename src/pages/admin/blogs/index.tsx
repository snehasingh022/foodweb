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
  PictureOutlined
} from '@ant-design/icons';
import { PageHeaders } from '../../../components/page-headers/index';
import { collection, getDocs, doc, deleteDoc, query, orderBy, addDoc, updateDoc, serverTimestamp, FieldValue, where } from 'firebase/firestore';
import { db, app } from '../../../authentication/firebase';
import { getDownloadURL, ref, uploadBytes, getStorage, deleteObject } from 'firebase/storage';
import { Editor } from '@tinymce/tinymce-react';

// Initialize Firebase Storage
let storage: any = null;
// Storage should only be initialized on the client side
if (typeof window !== "undefined") {
  storage = getStorage(app);
}

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
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  seoImage?: string;
  tags?: string[];
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
  
  // New states for enhanced functionality
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [seoImage, setSeoImage] = useState<any>(null);
  const [seoImageUrl, setSeoImageUrl] = useState('');
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [newTag, setNewTag] = useState('');
  const [tagSlug, setTagSlug] = useState('');
  const [tagDescription, setTagDescription] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageType, setImageType] = useState(''); // 'main' or 'seo'
  const [archive, setArchive] = useState<any[]>([]);

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
    // Only fetch data on the client side
    if (typeof window !== "undefined") {
      fetchBlogs();
      fetchCategories();
      fetchTags();
      fetchArchive();
    }
  }, []);
  
  useEffect(() => {
    setCategorySlug(newCategory.toLowerCase().replace(/ /g, '-'));
  }, [newCategory]);

  useEffect(() => {
    setTagSlug(newTag.toLowerCase().replace(/ /g, '-'));
  }, [newTag]);

  const fetchCategories = async () => {
    if (typeof window === "undefined") return;
    
    try {
      const q = query(collection(db, "categories"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const categoriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
      message.error("Failed to fetch categories");
    }
  };

  const fetchTags = async () => {
    if (typeof window === "undefined") return;
    
    try {
      const q = query(collection(db, "tags"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const tagsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTags(tagsData);
    } catch (error) {
      console.error("Error fetching tags:", error);
      message.error("Failed to fetch tags");
    }
  };

  const fetchArchive = async () => {
    if (typeof window === "undefined") return;
    
    try {
      const archiveRef = collection(db, "archive");
      const querySnapshot = await getDocs(archiveRef);
      const archiveData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setArchive(archiveData);
    } catch (error) {
      console.error("Error fetching archive:", error);
    }
  };

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
    setCurrentBlog(blog);
    setEditMode(true);
    form.setFieldsValue({
      title: blog.title,
      slug: blog.slug,
      summary: blog.summary || '',
      category: blog.category || '',
      content: blog.content || '',
      isFeatured: blog.isFeatured || 'No',
      seoTitle: blog.seoTitle || '',
      seoDescription: blog.seoDescription || '',
    });
    setImageUrl(blog.image || '');
    setEditorContent(blog.content || '');
    setSelectedTags(blog.tags || []);
    setSeoTitle(blog.seoTitle || '');
    setSeoDescription(blog.seoDescription || '');
    setSeoKeywords(blog.seoKeywords || []);
    setSeoImageUrl(blog.seoImage || '');
    setModalVisible(true);
  };

  const handleAdd = () => {
    setCurrentBlog(null);
    setEditMode(false);
    form.resetFields();
    setImageUrl('');
    setSeoImageUrl('');
    setEditorContent('');
    setSelectedTags([]);
    setSeoKeywords([]);
    setModalVisible(true);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const handleImageUpload = async (file: File) => {
    setImageLoading(true);
    try {
      if (!storage) {
        throw new Error("Firebase Storage is not available");
      }
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

  const handleSeoImageUpload = async (file: File) => {
    setImageLoading(true);
    try {
      if (!storage) {
        throw new Error("Firebase Storage is not available");
      }
      const slug = form.getFieldValue('slug') || `blog-${Date.now()}`;
      const storageRef = ref(storage, `blogs/${slug}/seo/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setSeoImageUrl(downloadURL);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading SEO image:", error);
      message.error("Failed to upload SEO image");
    } finally {
      setImageLoading(false);
    }
  };

  const handleArchiveImageUpload = async (file: File) => {
    try {
      if (!storage) {
        throw new Error("Firebase Storage is not available");
      }
      const storageRef = ref(storage, `/archive/images/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      const archiveRef = collection(db, "archive");
      await addDoc(archiveRef, {
        ImageUrl: downloadURL,
      });
      
      setArchive([...archive, { ImageUrl: downloadURL }]);
      message.success("Image saved to archive successfully!");
      return downloadURL;
    } catch (error) {
      console.error("Error saving image to archive:", error);
      message.error("Error saving image to archive. Please try again.");
    }
  };

  const handleSetArchiveImage = (url: string) => {
    if (imageType === 'main') {
      setImageUrl(url);
    } else if (imageType === 'seo') {
      setSeoImageUrl(url);
    }
    setImageDialogOpen(false);
  };

  const handleOpenImageDialog = (type: string) => {
    setImageType(type);
    setImageDialogOpen(true);
  };

  const handleAddCategory = async () => {
    if (typeof window === "undefined" || newCategory.trim() === "") return;

    try {
      const categoriesRef = collection(db, "categories");
      const docRef = await addDoc(categoriesRef, {
        name: newCategory,
        slug: categorySlug,
        description: categoryDescription,
        createdAt: serverTimestamp(),
      });
      setCategories([
        ...categories,
        {
          id: docRef.id,
          name: newCategory,
          slug: categorySlug,
          description: categoryDescription,
        },
      ]);
      setNewCategory("");
      setCategorySlug("");
      setCategoryDescription("");
      setCategoryDialogOpen(false);
      message.success("Category added successfully!");
    } catch (error) {
      console.error("Error adding category:", error);
      message.error("Error adding category. Please try again.");
    }
  };

  const handleAddTag = async () => {
    if (typeof window === "undefined" || newTag.trim() === "") return;

    try {
      const tagsRef = collection(db, "tags");
      const docRef = await addDoc(tagsRef, {
        name: newTag,
        slug: tagSlug,
        description: tagDescription,
        createdAt: serverTimestamp(),
      });
      setTags([
        ...tags,
        {
          id: docRef.id,
          name: newTag,
          slug: tagSlug,
          description: tagDescription,
        },
      ]);
      setNewTag("");
      setTagSlug("");
      setTagDescription("");
      setTagDialogOpen(false);
      message.success("Tag added successfully!");
    } catch (error) {
      console.error("Error adding tag:", error);
      message.error("Error adding tag. Please try again.");
    }
  };

  const handleKeywordInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && keywordInput.trim()) {
      e.preventDefault();
      setSeoKeywords([...seoKeywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const handleDeleteKeyword = (keywordToDelete: string) => {
    setSeoKeywords(
      seoKeywords.filter((keyword) => keyword !== keywordToDelete)
    );
  };

  const handleSubmit = async (values: any) => {
    if (typeof window === "undefined") return;

    try {
      const blogData: {
        title: string;
        slug: string;
        summary?: string;
        content: string;
        category?: string;
        image: string;
        isFeatured: string;
        tags: string[];
        seoTitle: string;
        seoDescription: string;
        seoKeywords: string[];
        seoImage: string;
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
        tags: selectedTags,
        seoTitle: values.seoTitle || "",
        seoDescription: values.seoDescription || "",
        seoKeywords: seoKeywords,
        seoImage: seoImageUrl,
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
        className="flex items-center justify-between px-4 sm:px-8 xl:px-[15px] pt-2 pb-4 sm:pb-6 bg-transparent sm:flex-row flex-col gap-4"
        title="Blogs"
        routes={PageRoutes}
      />
      <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] bg-transparent">
        <Row gutter={25}>
          <Col sm={24} xs={24}>
            <Card className="h-full">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="p-4 sm:p-[25px]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-dark dark:text-white/[.87] text-[16px] font-semibold">Blog Management</h2>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <Input
                        placeholder="Search blogs..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full sm:w-64"
                      />
                      <Button
                        type="primary"
                        onClick={handleAdd}
                        icon={<PlusOutlined />}
                        className="w-full sm:w-auto"
                      >
                        Add Blog
                      </Button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table
                      dataSource={blogs.filter(blog => 
                        blog.title.toLowerCase().includes(searchText.toLowerCase()) ||
                        blog.slug.toLowerCase().includes(searchText.toLowerCase()) ||
                        blog.summary?.toLowerCase().includes(searchText.toLowerCase())
                      )}
                      columns={columns.map(col => ({
                        ...col,
                        responsive: col.dataIndex === 'title' || col.key === 'action' 
                          ? ['xs', 'sm', 'md', 'lg', 'xl'] as any
                          : col.dataIndex === 'slug' || col.dataIndex === 'isFeatured'
                            ? ['sm', 'md', 'lg', 'xl'] as any
                            : ['md', 'lg', 'xl'] as any,
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
        title={editMode ? "Edit Blog" : "Add New Blog"}
        open={modalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width="95%"
        style={{ maxWidth: '1200px' }}
        className="responsive-modal"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          <Divider orientation="left">Basic Information</Divider>
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
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Category</span>
                <Button 
                  type="link" 
                  icon={<PlusOutlined />} 
                  onClick={() => setCategoryDialogOpen(true)}
                  size="small"
                >
                  Add New
                </Button>
              </div>
              <Form.Item
                name="category"
              >
                <Select placeholder="Select category">
                  {categories.map((cat) => (
                    <Select.Option key={cat.id} value={cat.name}>
                      {cat.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Featured"
                name="isFeatured"
                initialValue="No"
              >
                <Select>
                  <Select.Option value="Yes">Yes</Select.Option>
                  <Select.Option value="No">No</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Summary"
            name="summary"
          >
            <Input.TextArea rows={3} placeholder="Brief summary of the blog" />
          </Form.Item>

          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Tags</span>
            <Button 
              type="link" 
              icon={<PlusOutlined />} 
              onClick={() => setTagDialogOpen(true)}
              size="small"
            >
              Add New
            </Button>
          </div>
          <Form.Item>
            <Select
              mode="multiple"
              placeholder="Select tags"
              value={selectedTags}
              onChange={setSelectedTags}
              style={{ width: '100%' }}
              optionLabelProp="label"
            >
              {tags.map((tag) => (
                <Select.Option key={tag.id} value={tag.name} label={tag.name}>
                  {tag.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Featured Image">
                <div 
                  className="border border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:border-primary"
                  onClick={() => handleOpenImageDialog('main')}
                >
                  {imageUrl ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img 
                        src={imageUrl} 
                        alt="blog" 
                        className="mx-auto h-32 object-contain" 
                        style={{ transition: 'opacity 0.3s ease' }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '0.5'} 
                        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                      />
                      <div style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%', 
                        backgroundColor: 'hsla(346, 100%, 92%, 0.425)', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        transition: 'opacity 0.7s ease',
                        opacity: 0,
                      }}
                      onMouseOver={(e) => e.currentTarget.style.opacity = '1'} 
                      onMouseOut={(e) => e.currentTarget.style.opacity = '0'}>
                        <div style={{ fontSize: '20px' }}>Edit</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col justify-center items-center h-32">
                      <PictureOutlined style={{ fontSize: '32px', color: '#d9d9d9' }} />
                      <p className="mt-2">Upload Image</p>
                    </div>
                  )}
                </div>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Content"
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

          <Divider orientation="left">SEO Information</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="SEO Title"
                name="seoTitle"
              >
                <Input placeholder="SEO title (leave empty to use main title)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="SEO Description"
                name="seoDescription"
              >
                <Input.TextArea rows={2} placeholder="SEO description" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="SEO Keywords">
            <Input
              placeholder="Type keyword and press Enter"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={handleKeywordInputKeyPress}
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {seoKeywords.map((keyword, index) => (
                <Tag
                  key={index}
                  closable
                  onClose={() => handleDeleteKeyword(keyword)}
                  className="m-1"
                >
                  {keyword}
                </Tag>
              ))}
            </div>
          </Form.Item>

          <Form.Item label="SEO Image">
            <div 
              className="border border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:border-primary"
              onClick={() => handleOpenImageDialog('seo')}
            >
              {seoImageUrl ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img 
                    src={seoImageUrl} 
                    alt="seo" 
                    className="mx-auto h-32 object-contain" 
                    style={{ transition: 'opacity 0.3s ease' }}
                    onMouseOver={(e) => e.currentTarget.style.opacity = '0.5'} 
                    onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                  />
                  <div style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%', 
                    backgroundColor: 'hsla(346, 100%, 92%, 0.425)', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    transition: 'opacity 0.7s ease',
                    opacity: 0,
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '1'} 
                  onMouseOut={(e) => e.currentTarget.style.opacity = '0'}>
                    <div style={{ fontSize: '20px' }}>Edit</div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col justify-center items-center h-32">
                  <PictureOutlined style={{ fontSize: '32px', color: '#d9d9d9' }} />
                  <p className="mt-2">Upload SEO Image</p>
                </div>
              )}
            </div>
          </Form.Item>

          <div className="flex justify-end mt-4">
            <Button className="mr-2" onClick={handleModalCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" className="bg-primary hover:bg-primary-hbr">
              {editMode ? 'Update' : 'Create'} Blog
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Category Dialog */}
      <Modal
        title="Add New Category"
        open={categoryDialogOpen}
        onCancel={() => setCategoryDialogOpen(false)}
        footer={null}
        width="95%"
        style={{ maxWidth: '500px' }}
        className="responsive-modal"
      >
        <Form layout="vertical">
          <Form.Item label="Category Name" required>
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter category name"
            />
          </Form.Item>
          <Form.Item label="Slug">
            <Input
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              placeholder="category-slug"
            />
          </Form.Item>
          <Form.Item label="Description">
            <Input.TextArea
              value={categoryDescription}
              onChange={(e) => setCategoryDescription(e.target.value)}
              placeholder="Category description"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Tag Dialog */}
      <Modal
        title="Add New Tag"
        open={tagDialogOpen}
        onCancel={() => setTagDialogOpen(false)}
        footer={null}
        width="95%"
        style={{ maxWidth: '500px' }}
        className="responsive-modal"
      >
        <Form layout="vertical">
          <Form.Item label="Tag Name" required>
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Enter tag name"
            />
          </Form.Item>
          <Form.Item label="Slug">
            <Input
              value={tagSlug}
              onChange={(e) => setTagSlug(e.target.value)}
              placeholder="tag-slug"
            />
          </Form.Item>
          <Form.Item label="Description">
            <Input.TextArea
              value={tagDescription}
              onChange={(e) => setTagDescription(e.target.value)}
              placeholder="Tag description"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Image Dialog */}
      <Modal
        title="Select from Archive"
        open={imageDialogOpen}
        onCancel={() => setImageDialogOpen(false)}
        footer={null}
        width="95%"
        style={{ maxWidth: '1000px' }}
        className="responsive-modal"
      >
        <div className="flex justify-center gap-4 mb-4">
          <Upload
            name="image"
            showUploadList={false}
            beforeUpload={(file) => {
              if (imageType === 'main') {
                handleImageUpload(file);
              } else {
                handleSeoImageUpload(file);
              }
              handleArchiveImageUpload(file);
              setImageDialogOpen(false);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />} type="primary" className="bg-primary hover:bg-primary-hbr">
              Upload New Image
            </Button>
          </Upload>
        </div>
        
        <Divider>Or Select from Archive</Divider>
        
        <div className="grid grid-cols-4 gap-4 mt-4 max-h-[400px] overflow-y-auto">
          {archive.map((item, index) => (
            <div
              key={index}
              className="cursor-pointer border p-2 rounded hover:border-primary"
              onClick={() => handleSetArchiveImage(item.ImageUrl)}
            >
              <img 
                src={item.ImageUrl} 
                alt="Archive item" 
                className="w-full h-24 object-cover" 
              />
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}

export default Blogs; 