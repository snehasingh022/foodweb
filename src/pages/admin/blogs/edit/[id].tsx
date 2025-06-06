import { useState, useEffect } from 'react';
import { listAll, ref as storageRef } from "firebase/storage"
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
  Spin,
  Tabs
} from 'antd';
import {
  UploadOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  PictureOutlined,
  CloudUploadOutlined,
  FileImageOutlined,
} from '@ant-design/icons';
import { PageHeaders } from '../../../../components/page-headers/index';
import { collection, getDocs, query, orderBy, serverTimestamp, getDoc, doc, updateDoc, addDoc, setDoc } from 'firebase/firestore';
import { db, app } from '../../../../authentication/firebase';
import { getDownloadURL, ref, uploadBytes, getStorage } from 'firebase/storage';
import { Editor } from '@tinymce/tinymce-react';
import Protected from '../../../../components/Protected/Protected';
import { useRouter } from 'next/router'
import { storage } from '@/lib/firebase-secondary';
import { convertImageToWebP } from '@/components/imageConverter';

const { Option } = Select;
const { TabPane } = Tabs;

function EditBlog() {
  const router = useRouter();
  const { id } = router.query;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [formChanged, setFormChanged] = useState(false);
  const [unsavedChangesModalVisible, setUnsavedChangesModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [navigationPath, setNavigationPath] = useState('');

  // State variables
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [seoImageUrl, setSeoImageUrl] = useState('');
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [tagSlug, setTagSlug] = useState('');
  const [tagDescription, setTagDescription] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageType, setImageType] = useState(''); // 'main' or 'seo'
  const [archive, setArchive] = useState<any[]>([]);
  const [blogData, setBlogData] = useState<any>(null);
  const [selectedArchiveImage, setSelectedArchiveImage] = useState('');
  const [selectedSeoArchiveImage, setSelectedSeoArchiveImage] = useState('');
  const [archiveImages, setArchiveImages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [isTagLoading, setIsTagLoading] = useState(false);

  // New state for modal-based image uploader
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [seoImageModalVisible, setSeoImageModalVisible] = useState(false);
  const [mediaImages, setMediaImages] = useState<any[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [uploadingToMedia, setUploadingToMedia] = useState(false);
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
      breadcrumbName: 'Edit Blog',
    },
  ];

  useEffect(() => {
    // Listen for beforeunload event to prevent accidental navigation
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formChanged) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formChanged]);

  // Listen for route changes within the Next.js app
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (formChanged) {
        // Store the URL user wants to navigate to
        setNavigationPath(url);
        // Show warning modal
        setUnsavedChangesModalVisible(true);
        // Prevent navigation
        router.events.emit('routeChangeError');
        throw 'routeChange aborted';
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [formChanged, router.events]);

  useEffect(() => {
    // Only fetch data on the client side and if id is available
    if (typeof window !== "undefined" && id) {
      fetchBlogData();
      fetchCategories();
      fetchTags();
      fetchArchiveImages();
      fetchMediaImages();
    }
  }, [id]);

  useEffect(() => {
    setCategorySlug(newCategory.toLowerCase().replace(/ /g, '-'));
  }, [newCategory]);

  useEffect(() => {
    setTagSlug(newTag.toLowerCase().replace(/ /g, '-'));
  }, [newTag]);

  const handleConfirmNavigation = () => {
    setUnsavedChangesModalVisible(false);
    setFormChanged(false);
    // Navigate to the previously attempted URL
    if (navigationPath) {
      router.push(navigationPath);
    } else {
      router.push('/admin/blogs');
    }
  };

  // Fetch images from media collection in Firestore
  const fetchMediaImages = async () => {
    try {
      setMediaLoading(true);
      const q = query(collection(db, "media"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const imagesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMediaImages(imagesData);
    } catch (error) {
      console.error("Error fetching media images:", error);
      message.error("Failed to fetch media images");
    } finally {
      setMediaLoading(false);
    }
  };

  // Store image data in media collection
  const storeImageInMedia = async (imageUrl: string, fileName: string) => {
    try {
      const mediaRef = collection(db, "media");
      await addDoc(mediaRef, {
        image: imageUrl,
        name: fileName,
        createdAt: serverTimestamp(),
      });
      console.log("Image data stored in media collection");
    } catch (error) {
      console.error("Error storing image in media collection:", error);
    }
  };

  // Updated image upload function that stores in database
  const handleImageUploadToStorage = async (file: File, isForSeo: boolean = false) => {
    setUploadingToMedia(true);
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

      if (isForSeo) {
        setSeoImageUrl(downloadURL);
        setSeoImageModalVisible(false);
      } else {
        setImageUrl(downloadURL);
        setImageModalVisible(false);
      }

      setFormChanged(true);

      // Refresh media images
      fetchMediaImages();

      message.success("Image uploaded and stored successfully!");
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      message.error("Failed to upload image");
    } finally {
      setUploadingToMedia(false);
    }
  };

  const fetchBlogData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const blogDocRef = doc(db, "blogs", id as string);
      const blogDocSnap = await getDoc(blogDocRef);

      if (blogDocSnap.exists()) {
        const data = blogDocSnap.data();
        setBlogData({ id: blogDocSnap.id, ...data });

        // Extract category name from categoryDetails map
        const categoryName = data.categoryDetails?.name || '';

        // Extract tag names from tags map
        const tagNames = data.tags ? Object.values(data.tags).map((tag: any) => tag.name) : [];

        // Set form values based on your database schema
        form.setFieldsValue({
          title: data.title || '',
          slug: data.slug || '',
          summary: data.description || '', // Using description as summary
          category: categoryName,
          isFeatured: data.isFeatured ? 'Yes' : 'No',
          seoTitle: data.seoDetails?.title || '',
          seoDescription: data.seoDetails?.description || '',
        });

        // Set other state values
        setImageUrl(data.imageURL || '');
        setEditorContent(data.content || '');
        setSelectedTags(tagNames);

        // Handle SEO keywords - filter out empty strings
        const keywords = data.seoDetails?.keywords || [];
        const filteredKeywords = keywords.filter((keyword: string) => keyword.trim() !== '');
        setSeoKeywords(filteredKeywords);

        setSeoImageUrl(data.seoDetails?.imageURL || '');

        // Set selected archive images if they match current images
        setSelectedArchiveImage(data.imageURL || '');
        setSelectedSeoArchiveImage(data.seoDetails?.imageURL || '');

      } else {
        message.error("Blog not found");
        router.push('/admin/blogs');
      }
    } catch (error) {
      console.error("Error fetching blog data:", error);
      message.error("Failed to fetch blog data");
    } finally {
      setLoading(false);
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

  const fetchArchiveImages = async () => {
    try {
      if (!storage) return;
      const archiveRef = storageRef(storage, 'prathaviTravelsMedia');
      const result = await listAll(archiveRef);

      const imagePromises = result.items.map(async (imageRef) => {
        const url = await getDownloadURL(imageRef);
        return {
          name: imageRef.name,
          url: url,
          fullPath: imageRef.fullPath
        };
      });

      const images = await Promise.all(imagePromises);
      setArchiveImages(images);
    } catch (error) {
      console.error("Error fetching archive images:", error);
      message.error("Failed to fetch archive images");
    }
  }

  // Handle media image selection
  const handleMediaImageSelect = (imageUrl: string, isForSeo: boolean = false) => {
    if (isForSeo) {
      setSeoImageUrl(imageUrl);
      setSeoImageModalVisible(false);
    } else {
      setImageUrl(imageUrl);
      setImageModalVisible(false);
    }
    setFormChanged(true);
  };

  const handleImageUpload = async (file: File) => {
    setImageLoading(true);
    try {
      if (!storage) {
        throw new Error("Firebase Storage is not available");
      }
      const storageRef = ref(storage, `prathviTravelsMedia/media/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Generate media ID
      const mediaId = `MID${Date.now()}`;

      // Save to media collection in Firestore
      await setDoc(doc(db, "media", mediaId), {
        name: file.name,
        image: downloadURL,
        createdAt: serverTimestamp(),
      });

      setImageUrl(downloadURL);
      setFormChanged(true);

      // Refresh archive images
      fetchArchiveImages();

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
      const storageRef = ref(storage, `prathviTravelMedia/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      setSeoImageUrl(downloadURL);
      setFormChanged(true);

      // Refresh archive images
      fetchArchiveImages();

      return downloadURL;
    } catch (error) {
      console.error("Error uploading SEO image:", error);
      message.error("Failed to upload SEO image");
    } finally {
      setImageLoading(false);
    }
  };

  const handleArchiveImageSelect = (imageUrl: string) => {
    setImageUrl(imageUrl);
    setSelectedArchiveImage(imageUrl);
    setFormChanged(true);
  };

  // Add function to handle archive image selection for SEO image
  const handleSeoArchiveImageSelect = (imageUrl: string) => {
    setSeoImageUrl(imageUrl);
    setSelectedSeoArchiveImage(imageUrl);
    setFormChanged(true);
  };

  const handleArchiveImageUpload = async (file: File) => {
    try {
      if (!storage) {
        throw new Error("Firebase Storage is not available");
      }
      const storageRef = ref(storage, `/prathaviTravelsMedia/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      setArchive([...archive, { ImageUrl: downloadURL }]);
      message.success("Image saved to archive successfully!");
      return downloadURL;
    } catch (error) {
      console.error("Error saving image to archive:", error);
      message.error("Error saving image to archive. Please try again.");
    }
  };

  const handleAddCategory = async () => {
    setIsCategoryLoading(true);
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
    } finally {
      setIsCategoryLoading(false);
    }
  };

  const handleAddTag = async () => {
    setIsTagLoading(true);
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
    } finally {
      setIsTagLoading(false)
    }
  };

  const handleKeywordInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && keywordInput.trim()) {
      e.preventDefault();
      setSeoKeywords([...seoKeywords, keywordInput.trim()]);
      setKeywordInput("");
      setFormChanged(true);
    }
  };

  const handleDeleteKeyword = (keywordToDelete: string) => {
    setSeoKeywords(
      seoKeywords.filter((keyword) => keyword !== keywordToDelete)
    );
    setFormChanged(true);
  };

  const handleSetArchiveImage = (url: string) => {
    if (imageType === 'main') {
      setImageUrl(url);
    } else if (imageType === 'seo') {
      setSeoImageUrl(url);
    }
    setImageDialogOpen(false);
    setFormChanged(true);
  };

  const handleOpenImageDialog = (type: string) => {
    setImageType(type);
    setImageDialogOpen(true);
  };

  const handleSlugGeneration = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    form.setFieldsValue({ slug });
    setFormChanged(true);
  };

  const handleFormValuesChange = () => {
    setFormChanged(true);
  };

  const handleSubmit = async (values: any) => {
    setIsLoading(true);
    if (typeof window === "undefined" || !id) return;

    try {
      const blogRef = doc(db, "blogs", id as string);

      // Find selected category details
      const selectedCategory = categories.find(cat => cat.name === values.category);

      // Prepare tags object - convert selected tag names back to the map format
      const tagsObject: any = {};
      selectedTags.forEach(tagName => {
        const tag = tags.find(t => t.name === tagName);
        if (tag) {
          tagsObject[tag.id] = {
            name: tag.name,
            slug: tag.slug,
            description: tag.description
          };
        }
      });

      const updatedBlogData = {
        title: values.title,
        slug: values.slug,
        description: values.summary, // Using summary as description
        content: editorContent,
        imageURL: imageUrl,
        isFeatured: values.isFeatured === 'Yes',
        categoryDetails: selectedCategory ? {
          categoryID: selectedCategory.id,
          name: selectedCategory.name,
          slug: selectedCategory.slug,
          description: selectedCategory.description,
          createdAt: selectedCategory.createdAt
        } : null,
        tags: tagsObject,
        seoDetails: {
          title: values.seoTitle || "",
          description: values.seoDescription || "",
          keywords: seoKeywords,
          imageURL: seoImageUrl,
        },
        updatedAt: serverTimestamp(),
      };

      await updateDoc(blogRef, updatedBlogData);
      setFormChanged(false);
      setSuccessModalVisible(true);
      message.success("Blog updated successfully");
      router.push('/admin/blogs');

    } catch (error) {
      console.error("Error updating blog:", error);
      message.error("Failed to update blog");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <PageHeaders
        className="flex items-center justify-between px-4 sm:px-8 xl:px-[15px] pt-2 pb-4 sm:pb-6 bg-transparent sm:flex-row flex-col gap-4"
        title="Edit Blog"
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
                          onClick={() => setTagDialogOpen(true)}
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
                          value={selectedTags}
                          onChange={setSelectedTags}
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
                          <Form.Item
                            label={<span className="text-dark dark:text-white/[.87] font-medium">Featured Image</span>}
                          >
                            <div className="space-y-3">
                              <Button
                                onClick={() => setImageModalVisible(true)}
                                icon={<PictureOutlined />}
                                className="bg-primary text-white hover:bg-primary-hb w-1/4"
                                block
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
                            <Input placeholder="SEO title (leave empty to use main title)" className="py-2" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={<span className="text-dark dark:text-white/[.87] font-medium">SEO Description</span>}
                            name="seoDescription"
                          >
                            <Input.TextArea rows={2} placeholder="SEO description" />
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
                            onClick={() => setSeoImageModalVisible(true)}
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
                          loading={isLoading}
                          className="px-5 h-10 shadow-none bg-primary hover:bg-primary-hbr"
                        >
                          {isLoading ? "Updating..." : "Update Blog"}
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
            <Button
              type="primary"
              htmlType="submit"
              loading={isCategoryLoading}
              onClick={handleAddCategory}
              className="px-5 h-10 shadow-none bg-primary hover:bg-primary-hbr"
            >
              {isCategoryLoading ? "Adding..." : "Add category"}
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
          <div className="flex items-center gap-2 px-2 py-1">
            <span className="text-lg font-medium">Add New Tag</span>
          </div>
        }
        open={tagDialogOpen}
        onCancel={() => setTagDialogOpen(false)}
        footer={
          <div className="flex justify-end gap-2 pr-6 pb-4">
            <Button onClick={() => setTagDialogOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isTagLoading}
              onClick={handleAddTag}
              className="px-5 h-10 shadow-none bg-primary hover:bg-primary-hbr"
            >
              {isTagLoading ? "Adding..." : "Add tag"}
            </Button>
          </div>
        }
        width="95%"
        style={{ maxWidth: '500px' }}
        className="responsive-modal"
      >
        <Divider className="my-2" />

        <Form layout="vertical" className="p-3">
          <Form.Item label="Tag Name" required className="p-2">
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
          <Form.Item label="Description" className="p-2">
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
        title={
          <h3 className="text-lg font-semibold px-4 py-2">
            Select Featured Image
          </h3>
        }
        open={imageModalVisible}
        onCancel={() => setImageModalVisible(false)}
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
                  <label htmlFor="modal-upload-image" className="cursor-pointer text-center">
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
                          if (file) handleImageUploadToStorage(file, false);
                        };
                        input.click();
                      }}
                      className="bg-primary hover:bg-primary-hbr"
                      loading={uploadingToMedia}
                    >
                      {uploadingToMedia ? 'Uploading...' : 'Select File'}
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
                          if (file) handleImageUploadToStorage(file, false);
                        }}
                      />
                    </label>
                  </div>

                  <div className="border border-gray-200 dark:border-white/10 rounded-md">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-5 max-h-96 overflow-y-auto">
                      {mediaLoading ? (
                        <div className="col-span-4 text-center py-8">
                          <Spin size="large" />
                        </div>
                      ) : mediaImages.length > 0 ? (
                        mediaImages.map((image) => (
                          <div
                            key={image.id}
                            className="cursor-pointer border rounded p-2 transition-all hover:border-primary"
                            onClick={() => handleMediaImageSelect(image.image, false)}
                          >
                            <img
                              src={image.image}
                              alt={image.name}
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



      {/* Image Selection Modal for SEO Image */}
      <Modal
        title={
          <h3 className="text-lg font-semibold px-4 py-2">
            Select SEO Image
          </h3>
        }
        open={seoImageModalVisible}
        onCancel={() => setSeoImageModalVisible(false)}
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
                          if (file) {
                            handleImageUploadToStorage(file, true).then(() => {
                              setSeoImageModalVisible(false);
                            });
                          }
                        };
                        input.click();
                      }}
                      className="bg-primary hover:bg-primary-hbr"
                      loading={uploadingToMedia}
                    >
                      {uploadingToMedia ? 'Uploading...' : 'Select File'}
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
                  </div>
                  <div className="border border-gray-200 dark:border-white/10 rounded-md">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-5 max-h-96 overflow-y-auto">
                      {mediaLoading ? (
                        <div className="col-span-4 text-center py-8">
                          <Spin size="large" />
                        </div>
                      ) : mediaImages.length > 0 ? (
                        mediaImages.map((image) => (
                          <div
                            key={image.id}
                            className="cursor-pointer border p-2 rounded hover:border-primary"
                            onClick={() => handleMediaImageSelect(image.image, true)}
                          >
                            <img
                              src={image.image}
                              alt={image.name}
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

export default Protected(EditBlog, ["admin", "tours+media"]);