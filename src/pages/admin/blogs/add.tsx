import { useState, useEffect } from 'react';
<<<<<<< HEAD
import FirebaseFileUploader from '@/components/FirebaseFileUploader';
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
  Switch
} from 'antd';
import {
=======
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
  Modal
} from 'antd';
import { 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
  UploadOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  PictureOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { PageHeaders } from '../../../components/page-headers/index';
<<<<<<< HEAD
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp, setDoc, doc } from 'firebase/firestore';
=======
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
import { db, app } from '../../../authentication/firebase';
import { getDownloadURL, ref, uploadBytes, getStorage } from 'firebase/storage';
import { Editor } from '@tinymce/tinymce-react';
import Protected from '../../../components/Protected/Protected';
import { useRouter } from 'next/router';
<<<<<<< HEAD
import { storage } from '@/lib/firebase-secondary';
import { listAll, ref as storageRef } from "firebase/storage"


=======

// Initialize Firebase Storage
let storage: any = null;
// Storage should only be initialized on the client side
if (typeof window !== "undefined") {
  storage = getStorage(app);
}
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12

const { Option } = Select;

function AddBlog() {
  const router = useRouter();
  const [form] = Form.useForm();
<<<<<<< HEAD

  // State variables
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<{ [key: string]: any }>({});
=======
  
  // State variables
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
  const [imageLoading, setImageLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [seoImageUrl, setSeoImageUrl] = useState('');
<<<<<<< HEAD
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
=======
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const [showArchive, setShowArchive] = useState(false);
  const [showSeoArchive, setShowSeoArchive] = useState(false);
  const [archiveImages, setArchiveImages] = useState<{ name: string; url: string; fullPath: string }[]>([]);

  const [selectedArchiveImage, setSelectedArchiveImage] = useState('');
  const [selectedSeoArchiveImage, setSelectedSeoArchiveImage] = useState('');
=======
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12

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
<<<<<<< HEAD
      fetchArchiveImages();
    }
  }, []);

=======
      fetchArchive();
    }
  }, []);
  
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
  useEffect(() => {
    setCategorySlug(newCategory.toLowerCase().replace(/ /g, '-'));
  }, [newCategory]);

  useEffect(() => {
    setTagSlug(newTag.toLowerCase().replace(/ /g, '-'));
  }, [newTag]);

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

<<<<<<< HEAD
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
=======
  const fetchArchive = async () => {
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
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12

  const handleImageUpload = async (file: File) => {
    setImageLoading(true);
    try {
      if (!storage) {
        throw new Error("Firebase Storage is not available");
      }
      const slug = form.getFieldValue('slug') || `blog-${Date.now()}`;
<<<<<<< HEAD
      const storageRef = ref(storage, `prathaviTravelsMedia/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      setImageUrl(downloadURL);
      fetchArchiveImages(); // Refresh archive images
=======
      const storageRef = ref(storage, `blogs/${slug}/images/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setImageUrl(downloadURL);
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
      const storageRef = ref(storage, `prathaviTravelsMedia/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      setSeoImageUrl(downloadURL);
      fetchArchiveImages(); // Refresh archive images
=======
      const storageRef = ref(storage, `blogs/${slug}/seo/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setSeoImageUrl(downloadURL);
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
      return downloadURL;
    } catch (error) {
      console.error("Error uploading SEO image:", error);
      message.error("Failed to upload SEO image");
    } finally {
      setImageLoading(false);
    }
  };

<<<<<<< HEAD
  const handleArchiveImageSelect = (url: string) => {
    setSelectedArchiveImage(url);
    setImageUrl(url);
  };

  const handleSeoArchiveImageSelect = (url: string) => {
    setSelectedSeoArchiveImage(url);
    setSeoImageUrl(url);
  };

=======
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
  const handleArchiveImageUpload = async (file: File) => {
    try {
      if (!storage) {
        throw new Error("Firebase Storage is not available");
      }
<<<<<<< HEAD
      const storageRef = ref(storage, `/blogs/images/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

=======
      const storageRef = ref(storage, `/archive/images/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
      const archiveRef = collection(db, "archive");
      await addDoc(archiveRef, {
        ImageUrl: downloadURL,
      });
<<<<<<< HEAD

=======
      
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
      setArchive([...archive, { ImageUrl: downloadURL }]);
      message.success("Image saved to archive successfully!");
      return downloadURL;
    } catch (error) {
      console.error("Error saving image to archive:", error);
      message.error("Error saving image to archive. Please try again.");
    }
  };

  const handleAddCategory = async () => {
    if (typeof window === "undefined" || newCategory.trim() === "") return;

    try {
<<<<<<< HEAD
      const categoryId = `CID${Date.now().toString().slice(-6)}`;
      const categoriesRef = doc(db, "categories", categoryId);

      const categoryData = {
        categoryID: categoryId,
        name: newCategory,
        slug: categorySlug,
        description: categoryDescription,
        content: "", // Empty content initially
        imageURL: "", // Empty image URL initially
        isFeatured: false,
        seoDetails: {
          title: "",
          description: "",
          keywords: [""],
          imageURL: ""
        },
        tags: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(categoriesRef, categoryData);

      setCategories([
        ...categories,
        {
          id: categoryId,
          categoryID: categoryId,
=======
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
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
      const tagId = `TID${Date.now().toString().slice(-6)}`;
      const tagsRef = doc(db, "tags", tagId);

      const tagData = {
=======
      const tagsRef = collection(db, "tags");
      const docRef = await addDoc(tagsRef, {
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
        name: newTag,
        slug: tagSlug,
        description: tagDescription,
        createdAt: serverTimestamp(),
<<<<<<< HEAD
      };

      await setDoc(tagsRef, tagData);

      setTags([
        ...tags,
        {
          id: tagId,
=======
      });
      setTags([
        ...tags,
        {
          id: docRef.id,
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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

  const handleSlugGeneration = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    form.setFieldsValue({ slug });
  };

<<<<<<< HEAD
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

  // Custom handler for featured image upload success
  const handleFeaturedImageUploadSuccess = (url: string) => {
    setImageUrl(url);
    message.success("Featured image uploaded successfully!");
  };

  // Custom handler for SEO image upload success
  const handleSeoImageUploadSuccess = (url: string) => {
    setSeoImageUrl(url);
    message.success("SEO image uploaded successfully!");
  };

  const handleSubmit = async (values: any) => {
    const selectedCategoryName = form.getFieldValue('category');
    const category = categories.find(cat => cat.name === selectedCategoryName);
    setSelectedCategory(category);
    if (typeof window === "undefined") return;

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
=======
  const handleSubmit = async (values: any) => {
    if (typeof window === "undefined") return;

    try {
      const blogData = {
        title: values.title,
        slug: values.slug,
        summary: values.summary,
        content: editorContent,
        category: values.category,
        image: imageUrl,
        isFeatured: values.isFeatured || 'No',
        tags: selectedTags,
        seoTitle: values.seoTitle || "",
        seoDescription: values.seoDescription || "",
        seoKeywords: seoKeywords,
        seoImage: seoImageUrl,
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

<<<<<<< HEAD
      await setDoc(doc(db, "blogs", blogId), blogData);
=======
      await addDoc(collection(db, "blogs"), blogData);
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
      message.success("Blog created successfully");
      router.push('/admin/blogs');
    } catch (error) {
      console.error("Error saving blog:", error);
      message.error("Failed to save blog");
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
<<<<<<< HEAD

=======
                  
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                  >
                    <div className="mb-8">
                      <h3 className="text-base text-primary dark:text-primary mb-4 font-medium flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
<<<<<<< HEAD
                          <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
=======
                          <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
                            <Input
                              placeholder="Enter blog title"
                              onChange={handleSlugGeneration}
                              className="py-2"
=======
                            <Input 
                              placeholder="Enter blog title" 
                              onChange={handleSlugGeneration}
                              className="py-2" 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={<span className="text-dark dark:text-white/[.87] font-medium">Slug</span>}
                            name="slug"
                            rules={[{ required: true, message: 'Please enter blog slug' }]}
                          >
<<<<<<< HEAD
                            <Input
                              placeholder="blog-post-slug"
=======
                            <Input 
                              placeholder="blog-post-slug" 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
                              className="py-2"
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={24}>
                        <Col span={12}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-dark dark:text-white/[.87] font-medium">Category</span>
<<<<<<< HEAD
                            <Button
                              type="link"
                              icon={<PlusOutlined />}
=======
                            <Button 
                              type="link" 
                              icon={<PlusOutlined />} 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
                            <Select
                              placeholder="Select category"
                              className="w-full"
                              dropdownStyle={{ borderRadius: '6px' }}
                              onChange={handleCategoryChange}
=======
                            <Select 
                              placeholder="Select category"
                              className="w-full"
                              dropdownStyle={{ borderRadius: '6px' }}
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
                              onChange={(value) => setIsFeatured(value === "Yes")}
=======
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
                        <Button
                          type="link"
                          icon={<PlusOutlined />}
=======
                        <Button 
                          type="link" 
                          icon={<PlusOutlined />} 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
                          value={Object.values(selectedTags).map(tag => tag.name)}
                          onChange={handleTagsChange}
=======
                          value={selectedTags}
                          onChange={setSelectedTags}
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
                            <div className="space-y-3">
                              <div className="flex gap-4 mb-4">
                                <Button
                                  onClick={() => setShowArchive(!showArchive)}
                                  icon={<PictureOutlined />}
                                  className="border-primary text-primary hover:bg-primary hover:text-white"
                                >
                                  {showArchive ? 'Hide Archive' : 'Show Archive'}
                                </Button>
                                <Button
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
                                  icon={<UploadOutlined />}
                                  loading={imageLoading}
                                  className="bg-primary text-white hover:bg-primary-hb"
                                >
                                  {imageLoading ? 'Uploading...' : 'Upload Image'}
                                </Button>
                              </div>

                              {showArchive && (
                                <div className="border rounded-md p-3 max-h-60 overflow-y-auto">
                                  <div className="grid grid-cols-3 gap-2">
                                    {archiveImages.map((image, index) => (
                                      <div
                                        key={index}
                                        className={`cursor-pointer border-2 rounded-md overflow-hidden ${selectedArchiveImage === image.url ? 'border-primary' : 'border-gray-200'}`}
                                        onClick={() => handleArchiveImageSelect(image.url)}
                                      >
                                        <img
                                          src={image.url}
                                          alt={image.name}
                                          className="w-full h-20 object-cover"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  {archiveImages.length === 0 && (
                                    <p className="text-center text-gray-500 py-4">No archive images found</p>
                                  )}
                                </div>
                              )}

                              {imageUrl && (
                                <div className="mt-2">
                                  <img
                                    src={imageUrl}
                                    alt="Preview"
                                    className="max-h-32 rounded-md border"
                                  />
=======
                            <div 
                              className="border border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:border-primary transition-colors duration-300"
                              onClick={() => handleOpenImageDialog('main')}
                            >
                              {imageUrl ? (
                                <div className="relative inline-block group">
                                  <img 
                                    src={imageUrl} 
                                    alt="blog" 
                                    className="mx-auto h-32 object-contain transition-opacity duration-300" 
                                  />
                                  <div className="absolute inset-0 bg-black/20 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded">
                                    <span className="text-white font-medium">Change Image</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col justify-center items-center h-32">
                                  <PictureOutlined style={{ fontSize: '32px', color: '#d9d9d9' }} />
                                  <p className="mt-2 text-gray-500">Upload Featured Image</p>
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
                          <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h13zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z" />
                          <path d="M3 5.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8zm0 2.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z" />
=======
                          <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h13zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z"/>
                          <path d="M3 5.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8zm0 2.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z"/>
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
                        </svg>
                        Content
                      </h3>
                      <Form.Item>
                        <Editor
<<<<<<< HEAD
                          apiKey="vk693p6lgtcyd2xpc283y9knpg1zphq39p5uqwd5y4coapxo"
=======
                          apiKey="cluzl6f3pdaveewms6exdzpvcygpa23rgrx0whym6svjop94"
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                          <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
=======
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                          <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
                        </svg>
                        SEO Information
                      </h3>
                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item
                            label={<span className="text-dark dark:text-white/[.87] font-medium">SEO Title</span>}
                            name="seoTitle"
                          >
<<<<<<< HEAD
                            <Input
                              placeholder="SEO title (leave empty to use main title)"
                              className="py-2"
                              onChange={(e) => setSeoTitle(e.target.value)}
                            />
=======
                            <Input placeholder="SEO title (leave empty to use main title)" className="py-2" />
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label={<span className="text-dark dark:text-white/[.87] font-medium">SEO Description</span>}
                            name="seoDescription"
                          >
<<<<<<< HEAD
                            <Input.TextArea
                              rows={2}
                              placeholder="SEO description"
                              onChange={(e) => setSeoDescription(e.target.value)}
                            />
=======
                            <Input.TextArea rows={2} placeholder="SEO description" />
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
                        <div className="space-y-3">
                          <div className="flex gap-4 mb-4">
                            <Button
                              onClick={() => setShowSeoArchive(!showSeoArchive)}
                              icon={<PictureOutlined />}
                              className="border-primary text-primary hover:bg-primary hover:text-white"
                            >
                              {showSeoArchive ? 'Hide Archive' : 'Show Archive'}
                            </Button>
                            <Button
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0];
                                  if (file) handleSeoImageUpload(file);
                                };
                                input.click();
                              }}
                              icon={<UploadOutlined />}
                              loading={imageLoading}
                              className="bg-primary text-white hover:bg-primary-hb"
                            >
                              {imageLoading ? 'Uploading...' : 'Upload Image'}
                            </Button>
                          </div>

                          {showSeoArchive && (
                            <div className="border rounded-md p-3 max-h-60 overflow-y-auto">
                              <div className="grid grid-cols-3 gap-2">
                                {archiveImages.map((image, index) => (
                                  <div
                                    key={index}
                                    className={`cursor-pointer border-2 rounded-md overflow-hidden ${selectedSeoArchiveImage === image.url ? 'border-primary' : 'border-gray-200'}`}
                                    onClick={() => handleSeoArchiveImageSelect(image.url)}
                                  >
                                    <img
                                      src={image.url}
                                      alt={image.name}
                                      className="w-full h-20 object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                              {archiveImages.length === 0 && (
                                <p className="text-center text-gray-500 py-4">No archive images found</p>
                              )}
                            </div>
                          )}

                          {seoImageUrl && (
                            <div className="mt-2">
                              <img
                                src={seoImageUrl}
                                alt="SEO Preview"
                                className="max-h-32 rounded-md border"
                              />
=======
                        <div 
                          className="border border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:border-primary transition-colors duration-300"
                          onClick={() => handleOpenImageDialog('seo')}
                        >
                          {seoImageUrl ? (
                            <div className="relative inline-block group">
                              <img 
                                src={seoImageUrl} 
                                alt="seo" 
                                className="mx-auto h-32 object-contain transition-opacity duration-300" 
                              />
                              <div className="absolute inset-0 bg-black/20 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded">
                                <span className="text-white font-medium">Change Image</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col justify-center items-center h-32">
                              <PictureOutlined style={{ fontSize: '32px', color: '#d9d9d9' }} />
                              <p className="mt-2 text-gray-500">Upload SEO Image</p>
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
                            </div>
                          )}
                        </div>
                      </Form.Item>
                    </div>

                    <div className="flex justify-end mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <Space size="middle">
<<<<<<< HEAD
                        <Button
                          className="px-5 h-10 shadow-none hover:bg-gray-50 dark:hover:bg-white/10"
=======
                        <Button 
                          className="px-5 h-10 shadow-none hover:bg-gray-50 dark:hover:bg-white/10" 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
                          onClick={() => router.push('/admin/blogs')}
                        >
                          Cancel
                        </Button>
<<<<<<< HEAD
                        <Button
                          type="primary"
                          htmlType="submit"
=======
                        <Button 
                          type="primary" 
                          htmlType="submit" 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
                          className="px-5 h-10 shadow-none bg-primary hover:bg-primary-hbr"
                        >
                          Create Blog
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

<<<<<<< HEAD

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
            <Button type="primary" onClick={handleAddCategory}>
              OK
            </Button>
          </div>
        }
=======
      {/* Category Dialog */}
      <Modal
        title="Add New Category"
        open={categoryDialogOpen}
        onCancel={() => setCategoryDialogOpen(false)}
        onOk={handleAddCategory}
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
        width="95%"
        style={{ maxWidth: '500px' }}
        className="responsive-modal"
      >
<<<<<<< HEAD

        <Divider className="my-2" />

        <Form layout="vertical" className="p-2">
          <Form.Item label="Category Name" required className="p-2">
=======
        <Form layout="vertical">
          <Form.Item label="Category Name" required>
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter category name"
            />
          </Form.Item>
<<<<<<< HEAD
          <Form.Item label="Slug" className="p-2">
=======
          <Form.Item label="Slug">
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
            <Input
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              placeholder="category-slug"
            />
          </Form.Item>
<<<<<<< HEAD
          <Form.Item label="Description" className="p-2">
=======
          <Form.Item label="Description">
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              {"Add New Tag"}
            </span>
          </div>
        }
        open={tagDialogOpen}
        onCancel={() => setTagDialogOpen(false)}
        onOk={handleAddTag}
        footer={
          <div className="flex justify-end gap-2 pr-6 pb-4">
            <Button onClick={() => setTagDialogOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={handleAddTag}>
              OK
            </Button>
          </div>
        }
=======
        title="Add New Tag"
        open={tagDialogOpen}
        onCancel={() => setTagDialogOpen(false)}
        onOk={handleAddTag}
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
        width="95%"
        style={{ maxWidth: '500px' }}
        className="responsive-modal"
      >
<<<<<<< HEAD
        <Form layout="vertical" className='p-3'>
          <Form.Item label={<span className="text-dark dark:text-white/[.87] font-medium">Tag Name</span>}
            name="name"
            rules={[{ required: true, message: 'Please enter tag name!' }]} required>
            <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Enter tag name" />
          </Form.Item>
          <Form.Item label={<span className="text-dark dark:text-white/[.87] font-medium">Slug</span>}
            name="slug"
            rules={[{ required: true, message: 'Please enter tag slug!' }]}
            tooltip="The slug is used in the URL. It must be unique and contain only lowercase letters, numbers, and hyphens.">
            <Input value={tagSlug} onChange={(e) => setTagSlug(e.target.value)} placeholder="tag-slug" />
          </Form.Item>
          <Form.Item label={<span className="text-dark dark:text-white/[.87] font-medium">Description</span>}
            name="description"
            rules={[{ required: true, message: 'Please enter tag description!' }]}>
=======
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
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD

        <Divider>Or Select from Archive</Divider>

=======
        
        <Divider>Or Select from Archive</Divider>
        
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
        <div className="grid grid-cols-4 gap-4 mt-4 max-h-[400px] overflow-y-auto">
          {archive.map((item, index) => (
            <div
              key={index}
              className="cursor-pointer border p-2 rounded hover:border-primary"
              onClick={() => handleSetArchiveImage(item.ImageUrl)}
            >
<<<<<<< HEAD
              <img
                src={item.ImageUrl}
                alt="Archive item"
                className="w-full h-24 object-cover"
=======
              <img 
                src={item.ImageUrl} 
                alt="Archive item" 
                className="w-full h-24 object-cover" 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
              />
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}

export default Protected(AddBlog, ["admin"]); 