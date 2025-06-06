import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Input,
  Button,
  Form,
  Select,
  Tag,
  Divider,
  Upload,
  message,
  Space,
  Modal,
  Switch,
  Tabs
} from 'antd';
import {
  PlusOutlined,
  ArrowLeftOutlined,
  PictureOutlined,
  CloudUploadOutlined,
  FileImageOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { PageHeaders } from '../../../components/page-headers/index';
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { db, app } from '../../../authentication/firebase';
import { getDownloadURL, ref, uploadBytes, getStorage } from 'firebase/storage';
import { Editor } from '@tinymce/tinymce-react';
import Protected from '../../../components/Protected/Protected';
import { useRouter } from 'next/router';
import { storage } from '@/lib/firebase-secondary';
import { listAll, ref as storageRef } from "firebase/storage"
import { convertImageToWebP } from '../../../components/imageConverter';

const { Option } = Select;
const { TabPane } = Tabs;

function AddBlog() {
  const router = useRouter();
  const [form] = Form.useForm();

  // State variables
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<{ [key: string]: any }>({});
  const [imageLoading, setImageLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [seoImageUrl, setSeoImageUrl] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [tagSlug, setTagSlug] = useState('');
  const [tagDescription, setTagDescription] = useState('');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageType, setImageType] = useState(''); // 'main' or 'seo'
  const [mediaImages, setMediaImages] = useState<any[]>([]);
  const [selectedArchiveImage, setSelectedArchiveImage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [tagLoading, setTagLoading] = useState(false);
  const [blogSubmitLoading, setBlogSubmitLoading] = useState(false);
  const [archiveOrUpload, setArchiveOrUpload] = useState<'upload' | 'archive'>('upload');

  const PageRoutes = [
    {
      path: '/admin',
      breadcrumbName: 'Dashboard',
    },
    {
      path: '/admin/blogs',
      breadcrumbName: 'Blogs',
    },
    {
      path: '',
      breadcrumbName: 'Add Blog',
    },
  ];

  useEffect(() => {
    // Only fetch data on the client side
    if (typeof window !== "undefined") {
      fetchCategories();
      fetchTags();
      fetchMediaImages();
    }
  }, []);

  useEffect(() => {
    setCategorySlug(newCategory.toLowerCase().replace(/ /g, '-'));
  }, [newCategory]);

  useEffect(() => {
    setTagSlug(newTag.toLowerCase().replace(/ /g, '-'));
  }, [newTag]);

  // Fetch media images from Firestore
  const fetchMediaImages = async () => {
    try {
      const q = query(collection(db, "media"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const mediaData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMediaImages(mediaData);
    } catch (error) {
      console.error("Error fetching media images:", error);
      message.error("Failed to fetch media images");
    }
  };

  const fetchCategories = async () => {
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

  // Updated image upload function that also saves to media collection
  const handleImageUpload = async (file: File) => {
    setImageLoading(true);
    try {
      if (!storage) {
        throw new Error("Firebase Storage is not available");
      }

      const webpFile = await convertImageToWebP(file);
      const storageRef = ref(storage, `prathviTravelsMedia/media/${webpFile.name}`);
      await uploadBytes(storageRef, webpFile);
      const downloadURL = await getDownloadURL(storageRef);

      // Generate media ID
      const mediaId = `MID${Date.now()}`;

      // Save to media collection in Firestore
      await setDoc(doc(db, "media", mediaId), {
        name: webpFile.name,
        image: downloadURL,
        createdAt: serverTimestamp(),
      });

      // Set the image URL based on type
      if (imageType === 'main') {
        setImageUrl(downloadURL);
      } else if (imageType === 'seo') {
        setSeoImageUrl(downloadURL);
      }

      // Refresh media images
      fetchMediaImages();
      setImageModalOpen(false);
      message.success("Image uploaded successfully!");

      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      message.error("Failed to upload image");
    } finally {
      setImageLoading(false);
    }
  };

  // Handle archive image selection
  const handleArchiveImageSelect = (imageUrl: string) => {
    setSelectedArchiveImage(imageUrl);
    if (imageType === 'main') {
      setImageUrl(imageUrl);
    } else if (imageType === 'seo') {
      setSeoImageUrl(imageUrl);
    }
    setImageModalOpen(false);
  };

  // Open image modal
  const handleOpenImageModal = (type: 'main' | 'seo') => {
    setImageType(type);
    setSelectedArchiveImage('');
    setImageModalOpen(true);
  };

  const handleTagDialogOpen = () => {
    setNewTag("");
    setTagSlug("");
    setTagDescription("");
    setTagDialogOpen(true);
  };

  const handleAddCategory = async () => {
    if (typeof window === "undefined" || newCategory.trim() === "") return;

    setCategoryLoading(true);
    try {
      const categoryId = `CID${Date.now().toString().slice(-6)}`;

      const categoriesRef = collection(db, "categories");
      const docRef = await setDoc(doc(db, 'categories', categoryId), {
        name: newCategory,
        slug: categorySlug,
        description: categoryDescription,
        createdAt: serverTimestamp(),
      });
      setCategories([
        ...categories,
        {
          id: categoryId,
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
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (typeof window === "undefined" || newTag.trim() === "") return;

    setTagLoading(true);
    try {
      const tagId = `TID${Date.now().toString().slice(-6)}`;
      const tagsRef = doc(db, "tags", tagId);

      const tagData = {
        name: newTag,
        slug: tagSlug,
        description: tagDescription,
        createdAt: serverTimestamp(),
      };

      await setDoc(tagsRef, tagData);

      setTags([
        ...tags,
        {
          id: tagId,
          name: newTag,
          slug: tagSlug,
          description: tagDescription,
        },
      ]);

      // Reset form values - this is the important part
      setNewTag("");
      setTagSlug("");
      setTagDescription("");
      setTagDialogOpen(false);
      message.success("Tag added successfully!");
    } catch (error) {
      console.error("Error adding tag:", error);
      message.error("Error adding tag. Please try again.");
    } finally {
      setTagLoading(false);
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

  const handleSlugGeneration = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    form.setFieldsValue({ slug });
  };

  const handleCategoryChange = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    setSelectedCategory(category);
  };

  const handleTagsChange = (selectedTagNames: string[]) => {
    const tagsMap: { [key: string]: any } = {};
    selectedTagNames.forEach(tagName => {
      const tag = tags.find(t => t.name === tagName);
      if (tag) {
        tagsMap[tag.id] = {
          name: tag.name,
          slug: tag.slug,
          description: tag.description
        };
      }
    });
    setSelectedTags(tagsMap);
  };

  const handleSubmit = async (values: any) => {
    const selectedCategoryName = form.getFieldValue('category');
    const category = categories.find(cat => cat.name === selectedCategoryName);
    setSelectedCategory(category);
    if (typeof window === "undefined") return;

    setBlogSubmitLoading(true);
    try {
      const blogId = `BLID${Date.now().toString().slice(-6)}`;

      // Prepare category details
      const categoryDetails = selectedCategory ? {
        categoryID: selectedCategory.categoryID || selectedCategory.id,
        name: selectedCategory.name,
        slug: selectedCategory.slug,
        description: selectedCategory.description,
        createdAt: selectedCategory.createdAt,
      } : null;

      const blogData = {
        title: values.title,
        slug: values.slug,
        description: values.summary || "", // Using summary as description
        content: editorContent,
        categoryDetails: categoryDetails,
        imageURL: imageUrl,
        isFeatured: isFeatured,
        seoDetails: {
          title: seoTitle || values.title, // Use seoTitle or fallback to main title
          description: seoDescription,
          keywords: seoKeywords.length > 0 ? seoKeywords : [""],
          imageURL: seoImageUrl
        },
        tags: selectedTags,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "blogs", blogId), blogData);
      message.success("Blog created successfully");
      router.push('/admin/blogs');
    } catch (error) {
      console.error("Error saving blog:", error);
      message.error("Failed to save blog");
    } finally {
      setBlogSubmitLoading(false);
    }
  };


  return (
    <>
      <PageHeaders
        className="flex items-center justify-between px-4 sm:px-8 xl:px-[15px] pt-2 pb-4 sm:pb-6 bg-transparent sm:flex-row flex-col gap-4"
        title="Add Blog"
        routes={PageRoutes}
      />
      <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] bg-transparent">
        <Row gutter={25}>
          <Col sm={24} xs={24}>
            <Card className="h-full">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="p-4 sm:p-[25px]">
                  <div className="flex justify-between items-center mb-6">
                    <Button
                      type="default"
                      onClick={() => router.push('/admin/blogs')}
                      icon={<ArrowLeftOutlined />}
                      className="flex items-center"
                    >
                      Back to Blogs
                    </Button>
                  </div>

                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                  >
                    <div className="mb-8">
                      <h3 className="text-base text-primary dark:text-primary mb-4 font-medium flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                        </svg>
                        Basic Information
                      </h3>
                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item
                            label={<span className="text-dark dark:text-white/[.87] font-medium">Title</span>}
                            name="title"
                            rules={[{ required: true, message: 'Please enter blog title' }]}
                          >
                            <Input
                              placeholder="Enter blog title"
                              onChange={handleSlugGeneration}
                              className="py-2"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={<span className="text-dark dark:text-white/[.87] font-medium">Slug</span>}
                            name="slug"
                            rules={[{ required: true, message: 'Please enter blog slug' }]}
                          >
                            <Input
                              placeholder="blog-post-slug"
                              className="py-2"
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={24}>
                        <Col span={12}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-dark dark:text-white/[.87] font-medium">Category</span>
                            <Button
                              type="link"
                              icon={<PlusOutlined />}
                              onClick={() => setCategoryDialogOpen(true)}
                              size="small"
                              className="text-primary"
                            >
                              Add New
                            </Button>
                          </div>
                          <Form.Item
                            name="category"
                          >
                            <Select
                              placeholder="Select category"
                              className="w-full"
                              dropdownStyle={{ borderRadius: '6px' }}
                              onChange={handleCategoryChange}
                            >
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
                            label={<span className="text-dark dark:text-white/[.87] font-medium">Featured</span>}
                            name="isFeatured"
                            initialValue="No"
                          >
                            <Select
                              className="w-full"
                              dropdownStyle={{ borderRadius: '6px' }}
                              onChange={(value) => setIsFeatured(value === "Yes")}
                            >
                              <Select.Option value="Yes">Yes</Select.Option>
                              <Select.Option value="No">No</Select.Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        label={<span className="text-dark dark:text-white/[.87] font-medium">Summary</span>}
                        name="summary"
                      >
                        <Input.TextArea rows={3} placeholder="Write a brief summary of the blog" className="text-base" />
                      </Form.Item>

                      <div className="flex justify-between items-center mb-2">
                        <span className="text-dark dark:text-white/[.87] font-medium">Tags</span>
                        <Button
                          type="link"
                          icon={<PlusOutlined />}
                          onClick={() => handleTagDialogOpen()}
                          size="small"
                          className="text-primary"
                        >
                          Add New
                        </Button>
                      </div>
                      <Form.Item>
                        <Select
                          mode="multiple"
                          placeholder="Select tags"
                          value={Object.values(selectedTags).map(tag => tag.name)}
                          onChange={handleTagsChange}
                          style={{ width: '100%' }}
                          optionLabelProp="label"
                          className="w-full"
                          dropdownStyle={{ borderRadius: '6px' }}
                        >
                          {tags.map((tag) => (
                            <Select.Option key={tag.id} value={tag.name} label={tag.name}>
                              {tag.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item label={<span className="text-dark dark:text-white/[.87] font-medium">Featured Image</span>}>
                            <div className="space-y-3">
                              <Button
                                onClick={() => handleOpenImageModal('main')}
                                icon={<PictureOutlined />}
                                className="bg-primary text-white hover:bg-primary-hb w-1/4"
                              >
                                Select Image
                              </Button>

                              {imageUrl && (
                                <div className="mt-2">
                                  <img
                                    src={imageUrl}
                                    alt="Preview"
                                    className="max-h-32 rounded-md border"
                                  />
                                </div>
                              )}
                            </div>
                          </Form.Item>
                        </Col>
                      </Row>

                    </div>

                    <div className="mb-8">
                      <h3 className="text-base text-primary dark:text-primary mb-4 font-medium flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h13zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z" />
                          <path d="M3 5.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8zm0 2.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z" />
                        </svg>
                        Content
                      </h3>
                      <Form.Item>
                        <Editor
                          apiKey="vk693p6lgtcyd2xpc283y9knpg1zphq39p5uqwd5y4coapxo"
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
                    </div>

                    <div className="mb-8">
                      <h3 className="text-base text-primary dark:text-primary mb-4 font-medium flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                          <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                        </svg>
                        SEO Information
                      </h3>
                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item
                            label={<span className="text-dark dark:text-white/[.87] font-medium">SEO Title</span>}
                            name="seoTitle"
                          >
                            <Input
                              placeholder="SEO title (leave empty to use main title)"
                              className="py-2"
                              onChange={(e) => setSeoTitle(e.target.value)}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={<span className="text-dark dark:text-white/[.87] font-medium">SEO Description</span>}
                            name="seoDescription"
                          >
                            <Input.TextArea
                              rows={2}
                              placeholder="SEO description"
                              onChange={(e) => setSeoDescription(e.target.value)}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item label={<span className="text-dark dark:text-white/[.87] font-medium">SEO Keywords</span>}>
                        <Input
                          placeholder="Type keyword and press Enter"
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          onKeyPress={handleKeywordInputKeyPress}
                          className="py-2"
                        />
                        <div className="flex flex-wrap gap-1 mt-2">
                          {seoKeywords.map((keyword, index) => (
                            <Tag
                              key={index}
                              closable
                              onClose={() => handleDeleteKeyword(keyword)}
                              className="m-1 py-1 px-3"
                            >
                              {keyword}
                            </Tag>
                          ))}
                        </div>
                      </Form.Item>

                      <Form.Item label={<span className="text-dark dark:text-white/[.87] font-medium">SEO Image</span>}>
                        <div className="space-y-3">
                          <Button
                            onClick={() => handleOpenImageModal('seo')}
                            icon={<PictureOutlined />}
                            className="bg-primary text-white hover:bg-primary-hb w-1/10"
                          >
                            Select SEO Image
                          </Button>

                          {seoImageUrl && (
                            <div className="mt-2">
                              <img
                                src={seoImageUrl}
                                alt="SEO Preview"
                                className="max-h-32 rounded-md border"
                              />
                            </div>
                          )}
                        </div>
                      </Form.Item>
                    </div>

                    <div className="flex justify-end mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <Space size="middle">
                        <Button
                          className="px-5 h-10 shadow-none hover:bg-gray-50 dark:hover:bg-white/10"
                          onClick={() => router.push('/admin/blogs')}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="primary"
                          htmlType="submit"
                          className="px-5 h-10 shadow-none bg-primary hover:bg-primary-hbr"
                          loading={blogSubmitLoading}
                        >
                          {blogSubmitLoading ? 'Creating...' : 'Create Blog'}
                        </Button>
                      </Space>
                    </div>
                  </Form>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </main>


      {/* Category Dialog */}
      <Modal
        title={
          <div className="flex items-center gap-2 px-2 py-1">
            <span className="text-lg font-medium">Add New Category</span>
          </div>
        }
        open={categoryDialogOpen}
        onCancel={() => setCategoryDialogOpen(false)}
        footer={
          <div className="flex justify-end gap-2 pr-6 pb-4">
            <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={handleAddCategory} loading={categoryLoading}>
              {categoryLoading ? 'Adding...' : 'OK'}
            </Button>
          </div>
        }
        width="95%"
        style={{ maxWidth: '500px' }}
        className="responsive-modal"
      >

        <Divider className="my-2" />

        <Form layout="vertical" className="p-2">
          <Form.Item label="Category Name" required className="p-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter category name"
            />
          </Form.Item>
          <Form.Item label="Slug" className="p-2">
            <Input
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              placeholder="category-slug"
            />
          </Form.Item>
          <Form.Item label="Description" className="p-2">
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
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              Add New Tag
            </span>
          </div>
        }
        open={tagDialogOpen}
        onCancel={() => {
          // Clear form fields when canceling
          setNewTag("");
          setTagSlug("");
          setTagDescription("");
          setTagDialogOpen(false);
        }}
        footer={
          <div className="flex justify-end gap-2 pr-6 pb-4">
            <Button
              onClick={() => {
                // Clear form fields when clicking Cancel
                setNewTag("");
                setTagSlug("");
                setTagDescription("");
                setTagDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="primary" onClick={handleAddTag} loading={tagLoading}>
              {tagLoading ? 'Adding...' : 'Add Tag'}
            </Button>
          </div>
        }
        width="95%"
        style={{ maxWidth: '500px' }}
        className="responsive-modal"
      >
        <Form layout="vertical" className='p-3'>
          <Form.Item
            label={<span className="text-dark dark:text-white/[.87] font-medium">Tag Name</span>}
            required
          >
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Enter tag name"
            />
          </Form.Item>
          <Form.Item label="Slug" className="p-2">
            <Input
              value={tagSlug}
              onChange={(e) => setTagSlug(e.target.value)}
              placeholder="tag-slug"
            />
          </Form.Item>
          <Form.Item
            label={<span className="text-dark dark:text-white/[.87] font-medium">Description</span>}
            required
          >
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
        title={<h3 className="text-lg font-semibold px-4 py-2">Select {imageType === 'main' ? 'Featured' : 'SEO'} Image</h3>}
        open={imageModalOpen}
        onCancel={() => setImageModalOpen(false)}
        footer={null}
        width="95%"
        style={{ maxWidth: '1000px' }}
        bodyStyle={{ padding: '16px 24px 24px' }}
        className="responsive-modal"
      >
        <Tabs
          defaultActiveKey="upload"
          onChange={(key) => setArchiveOrUpload(key as 'upload' | 'archive')}
          className="mt-2"
          items={[
            {
              key: 'upload',
              label: (
                <span className="flex items-center">
                  <CloudUploadOutlined className="mr-2" />
                  Upload New Image
                </span>
              ),
              children: (
                <div className="flex items-center justify-center bg-gray-50 dark:bg-white/10 border-2 border-dashed border-gray-300 dark:border-white/30 hover:border-primary rounded-lg p-12 cursor-pointer transition-colors duration-300 mt-4">
                  <label htmlFor="modal-image-upload" className="cursor-pointer text-center">
                    <CloudUploadOutlined className="text-5xl mb-5 text-gray-400" />
                    <p className="text-gray-700 dark:text-white/80 font-medium mb-2">Click to upload an image</p>
                    <p className="text-sm text-gray-500 dark:text-white/60 mb-5">PNG, JPG or JPEG (max. 2MB)</p>
                    <Button
                      type="primary"
                      icon={<CloudUploadOutlined />}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleImageUpload(file);
                        };
                        input.click();
                      }}
                      className="bg-primary hover:bg-primary-hbr"
                      loading={imageLoading}
                    >
                      {imageLoading ? 'Uploading...' : 'Select File'}
                    </Button>
                  </label>
                </div>
              ),
            },
            {
              key: 'archive',
              label: (
                <span className="flex items-center">
                  <FileImageOutlined className="mr-2" />
                  Choose from Archive
                </span>
              ),
              children: (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-5 px-1">
                    <h4 className="text-dark dark:text-white/[.87] font-medium">Image Archive</h4>
                    <label htmlFor="modal-archive-upload" className="cursor-pointer">
                      <input
                        id="modal-archive-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                      />
                    </label>
                  </div>

                  <div className="border border-gray-200 dark:border-white/10 rounded-md">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-5 max-h-96 overflow-y-auto">
                      {mediaImages.length > 0 ? (
                        mediaImages.map((media) => (
                          <div
                            key={media.id}
                            className={`cursor-pointer border rounded p-2 transition-all ${selectedArchiveImage === media.image
                              ? 'border-primary ring-2 ring-primary/20'
                              : 'hover:border-primary'
                              }`}
                            onClick={() => handleArchiveImageSelect(media.image)}
                          >
                            <img
                              src={media.image}
                              alt={media.name}
                              className="w-full max-h-40 object-contain"
                            />
                          </div>
                        ))
                      ) : (
                        <div className="col-span-4 text-center py-8 text-gray-500 dark:text-white/60">
                          <PictureOutlined className="text-4xl mb-2" />
                          <p>No images in archive</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Modal>

    </>
  );
}

export default Protected(AddBlog, ["admin", "tours+media"]); 