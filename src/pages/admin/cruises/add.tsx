"use client"
import type React from "react"
import { listAll, ref as storageRef } from "firebase/storage"
import { useState, useEffect } from "react"
import { Row, Col, Card, Input, Button, Form, Select, Divider, Upload, message, Space, Tabs, Modal, DatePicker, Tag } from "antd"
import { UploadOutlined, PlusOutlined, ArrowLeftOutlined, PictureOutlined, CloudUploadOutlined, FileImageOutlined } from "@ant-design/icons"
import { PageHeaders } from "../../../components/page-headers/index"
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp, setDoc, doc } from "firebase/firestore"
import { db} from "../../../authentication/firebase"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import { Editor } from "@tinymce/tinymce-react"
import Protected from "../../../components/Protected/Protected"
import { useRouter } from "next/router"
import { storage } from "@/lib/firebase-secondary";
import { convertImageToWebP } from '../../../components/imageConverter';
const { RangePicker } = DatePicker;
import { Dayjs } from "dayjs"

function AddCruise() {
    const router = useRouter()
    const [form] = Form.useForm()
    const [categories, setCategories] = useState<any[]>([])
    const [tags, setTags] = useState<any[]>([])
    const [videoFileName, setVideoFileName] = useState<string>("");
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [imageLoading, setImageLoading] = useState(false)
    const [imageUrl, setImageUrl] = useState<string>('')
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
    const [newCategory, setNewCategory] = useState("")
    const [categorySlug, setCategorySlug] = useState("")
    const [categoryDescription, setCategoryDescription] = useState("")
    const [tagDialogOpen, setTagDialogOpen] = useState(false)
    const [newTag, setNewTag] = useState("")
    const [tagSlug, setTagSlug] = useState("")
    const [tagDescription, setTagDescription] = useState("")
    const [archiveImages, setArchiveImages] = useState<any[]>([])
    const [videoLoading, setVideoLoading] = useState(false)
    const [videoUrl, setVideoUrl] = useState("")
    const [mediaDialogOpen, setMediaDialogOpen] = useState(false)
    const [archiveMediaImages, setArchiveMediaImages] = useState<any[]>([])
    const [archiveOrUpload, setArchiveOrUpload] = useState<'upload' | 'archive'>('upload');
    const [sailingDates, setSailingDates] = useState<Array<[Dayjs, Dayjs]>>([]);
    const [dateInput, setDateInput] = useState<[Dayjs, Dayjs] | null>(null);
    const [categoryLoading, setCategoryLoading] = useState(false)
    const [tagLoading, setTagLoading] = useState(false)
    const [cruiseLoading, setCruiseLoading] = useState(false)
    const [editorContent, setEditorContent] = useState('')

    const PageRoutes = [
        {
            path: "/admin",
            breadcrumbName: "Dashboard",
        },
        {
            path: "/admin/cruises",
            breadcrumbName: "Cruises",
        },
        {
            path: "",
            breadcrumbName: "Add Cruise",
        },
    ]

    useEffect(() => {
        // Only fetch data on the client side
        if (typeof window !== "undefined") {
            fetchCategories()
            fetchTags()
            fetchArchiveImages()
            fetchMediaImages()
        }
    }, [])

    useEffect(() => {
        setCategorySlug(newCategory.toLowerCase().replace(/ /g, "-"))
    }, [newCategory])

    useEffect(() => {
        setTagSlug(newTag.toLowerCase().replace(/ /g, "-"))
    }, [newTag])

    const fetchCategories = async () => {
        try {
            const q = query(collection(db, "categories"), orderBy("createdAt", "desc"))
            const querySnapshot = await getDocs(q)
            const categoriesData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))
            setCategories(categoriesData)
        } catch (error) {
            console.error("Error fetching categories:", error)
            message.error("Failed to fetch categories")
        }
    }

    const fetchTags = async () => {
        try {
            const q = query(collection(db, "tags"), orderBy("createdAt", "desc"))
            const querySnapshot = await getDocs(q)
            const tagsData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))
            setTags(tagsData)
        } catch (error) {
            console.error("Error fetching tags:", error)
            message.error("Failed to fetch tags")
        }
    }

    const fetchMediaImages = async () => {
        try {
            const q = query(collection(db, "media"), orderBy("createdAt", "desc"))
            const querySnapshot = await getDocs(q)
            const mediaData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))
            setArchiveMediaImages(mediaData)
        } catch (error) {
            console.error("Error fetching media images:", error)
            message.error("Failed to fetch media images")
        }
    }

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

    const handleImageUpload = async (file: File) => {
        try {
            if (!storage) {
                throw new Error("Firebase Storage is not available");
            }
            setImageLoading(true);
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
            setImageUrl(downloadURL);
            message.success("Image uploaded successfully!");
        } catch (error) {
            console.error("Error uploading image:", error);
            message.error("Failed to upload image. Please try again.");
        } finally {
            setImageLoading(false);
        }
    };

    const handleMediaImageSelect = (imageUrl: string) => {
        setImageUrl(imageUrl);
        setMediaDialogOpen(false);
        message.success("Image selected from archive!");
    }

    const handleVideoUpload = async (file: File) => {
        try {
            if (!storage) {
                throw new Error("Firebase Storage is not available");
            }
            setVideoLoading(true);
            const storageReference = storageRef(storage, `prathviTravelsMedia/media/${file.name}`);
            await uploadBytes(storageReference, file);
            const downloadURL = await getDownloadURL(storageReference);
            form.setFieldsValue({ videoURL: downloadURL });
            setVideoFileName(file.name);
            setVideoUrl(downloadURL);
            message.success("Video uploaded successfully!");
        } catch (error) {
            console.error("Error uploading video:", error);
            message.error("Failed to upload video. Please try again.");
        } finally {
            setVideoLoading(false);
        }
    };

    const handleAddSailingDate = () => {
        if (dateInput && dateInput[0] && dateInput[1]) {
            setSailingDates([...sailingDates, dateInput]);
            setDateInput(null); // Reset input
        }
    };

    const handleDeleteSailingDate = (index: number) => {
        const updated = sailingDates.filter((_, i) => i !== index);
        setSailingDates(updated);
    };

    const handleAddCategory = async () => {
        if (typeof window === "undefined" || newCategory.trim() === "") return

        try {
            setCategoryLoading(true)
            const categoryId = `CID${Date.now().toString().slice(-6)}`;
            const categoriesRef = doc(db, "categories", categoryId);
            await setDoc(categoriesRef, {
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
            ])
            setNewCategory("")
            setCategorySlug("")
            setCategoryDescription("")
            setCategoryDialogOpen(false)
            message.success("Category added successfully!")
        } catch (error) {
            console.error("Error adding category:", error)
            message.error("Error adding category. Please try again.")
        } finally {
            setCategoryLoading(false)
        }
    }

    const handleAddTag = async () => {
        if (typeof window === "undefined" || newTag.trim() === "") return

        try {
            setTagLoading(true)
            const tagsRef = collection(db, "tags")
            const docRef = await addDoc(tagsRef, {
                name: newTag,
                slug: tagSlug,
                description: tagDescription,
                createdAt: serverTimestamp(),
            })
            setTags([
                ...tags,
                {
                    id: docRef.id,
                    name: newTag,
                    slug: tagSlug,
                    description: tagDescription,
                },
            ])
            setNewTag("")
            setTagSlug("")
            setTagDescription("")
            setTagDialogOpen(false)
            message.success("Tag added successfully!")
        } catch (error) {
            console.error("Error adding tag:", error)
            message.error("Error adding tag. Please try again.")
        } finally {
            setTagLoading(false)
        }
    }

    const handleSlugGeneration = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
        form.setFieldsValue({ slug })
    }

    const handleSubmit = async (values: any) => {
        if (typeof window === "undefined") return;

        try {
            setCruiseLoading(true)
            const cruiseId = `CRID${Date.now().toString().slice(-6)}`;

            const cruiseData = {
                title: values.title,
                slug: values.slug,
                description: editorContent || "",
                categoryDetails: {
                    categoryID: values.categoryID || "",
                    name: values.categoryName || "",
                    slug: values.categorySlug || "",
                    description: values.categoryDescription || "",
                    createdAt: serverTimestamp()
                },
                imageURL: imageUrl,
                isFeatured: values.isFeatured === "Yes", // Convert to boolean
                cruiseType: values.cruiseType || "domestic",
                location: values.location || "",
                status: values.status || "active",
                videoURL: values.videoURL || "",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await setDoc(doc(db, "cruises", cruiseId), cruiseData);
            message.success("Cruise created successfully");
            router.push("/admin/cruises");
        } catch (error) {
            console.error("Error saving cruise:", error);
            message.error("Failed to save cruise. Please try again.");
        } finally {
            setCruiseLoading(false)
        }
    };

    const handleCategoryChange = (value: string | number) => {
        const selectedCategory = categories.find(category => category.id === value);
        if (selectedCategory) {
            // Set the rest of the category details in the form
            form.setFieldsValue({
                categoryName: selectedCategory.name,
                categorySlug: selectedCategory.slug,
                categoryDescription: selectedCategory.description
            });
        }
    };


    return (
        <>
            <PageHeaders
                className="flex items-center justify-between px-4 sm:px-8 xl:px-[15px] pt-2 pb-4 sm:pb-6 bg-transparent sm:flex-row flex-col gap-4"
                title="Add Cruise"
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
                                            onClick={() => router.push("/admin/cruises")}
                                            icon={<ArrowLeftOutlined />}
                                            className="flex items-center"
                                        >
                                            Back to Cruises
                                        </Button>
                                    </div>

                                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                                        <div className="mb-8">
                                            <h3 className="text-base text-primary dark:text-primary mb-4 font-medium flex items-center gap-2">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="16"
                                                    height="16"
                                                    fill="currentColor"
                                                    viewBox="0 0 16 16"
                                                >
                                                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                                                </svg>
                                                Basic Information
                                            </h3>
                                            <Row gutter={24}>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Title</span>}
                                                        name="title"
                                                        rules={[{ required: true, message: "Please enter cruise title" }]}
                                                    >
                                                        <Input placeholder="Enter cruise title" onChange={handleSlugGeneration} className="py-2" />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Slug</span>}
                                                        name="slug"
                                                        rules={[{ required: true, message: "Please enter cruise slug" }]}
                                                    >
                                                        <Input placeholder="cruise-slug" className="py-2" />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                            <Row gutter={24}>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Status</span>}
                                                        name="status"
                                                        initialValue="active"
                                                    >
                                                        <Select className="w-full" dropdownStyle={{ borderRadius: "6px" }}>
                                                            <Select.Option value="active">Active</Select.Option>
                                                            <Select.Option value="inactive">Inactive</Select.Option>
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Location</span>}
                                                        name="location"
                                                        rules={[{ required: true, message: "Please enter cruise location" }]}
                                                    >
                                                        <Input placeholder="Enter cruise location" className="py-2" />
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Row gutter={24}>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Featured</span>}
                                                        name="isFeatured"
                                                        initialValue="No"
                                                    >
                                                        <Select className="w-full" dropdownStyle={{ borderRadius: "6px" }}>
                                                            <Select.Option value="Yes">Yes</Select.Option>
                                                            <Select.Option value="No">No</Select.Option>
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Cruise Type</span>}
                                                        name="cruiseType"
                                                        initialValue="domestic"
                                                    >
                                                        <Select className="w-full" dropdownStyle={{ borderRadius: "6px" }}>
                                                            <Select.Option value="domestic">Domestic</Select.Option>
                                                            <Select.Option value="international">International</Select.Option>
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Row gutter={24}>
                                                <Col span={12}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <label className="text-dark dark:text-white/[.87] font-medium">
                                                            Category
                                                        </label>
                                                        <Button
                                                            type="link"
                                                            onClick={() => setCategoryDialogOpen(true)}
                                                            size="small"
                                                            className="text-primary"
                                                            icon={<PlusOutlined />}
                                                        >
                                                            Add New
                                                        </Button>
                                                    </div>

                                                    <Form.Item
                                                        name="categoryID"
                                                        rules={[{ required: true, message: "Please select a category" }]}
                                                    >
                                                        <Select
                                                            className="w-full"
                                                            dropdownStyle={{ borderRadius: "6px" }}
                                                            onChange={handleCategoryChange}
                                                        >
                                                            {categories.map((category) => (
                                                                <Select.Option key={category.id} value={category.id}>
                                                                    {category.name}
                                                                </Select.Option>
                                                            ))}
                                                        </Select>
                                                    </Form.Item>
                                                    <Form.Item name="categoryName" hidden>
                                                        <Input />
                                                    </Form.Item>
                                                    <Form.Item name="categorySlug" hidden>
                                                        <Input />
                                                    </Form.Item>
                                                    <Form.Item name="categoryDescription" hidden>
                                                        <Input />
                                                    </Form.Item>

                                                </Col>
                                                <Col span={12}>
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
                                                            style={{ width: "100%" }}
                                                            optionLabelProp="label"
                                                            className="w-full"
                                                            dropdownStyle={{ borderRadius: "6px" }}
                                                        >
                                                            {tags.map((tag) => (
                                                                <Select.Option key={tag.id} value={tag.name} label={tag.name}>
                                                                    {tag.name}
                                                                </Select.Option>
                                                            ))}
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                            </Row>



                                            <Row gutter={24}>
                                                <Col span={4}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Image</span>}
                                                    >
                                                        <div className="space-y-3">
                                                            <Button
                                                                onClick={() => setMediaDialogOpen(true)}
                                                                icon={<PictureOutlined />}
                                                                className="bg-primary text-white hover:bg-primary-hb"
                                                                size="large"
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
                                                <Col span={6}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Video</span>}
                                                    >
                                                        <Upload
                                                            name="video"
                                                            accept="video/*"
                                                            showUploadList={false}
                                                            beforeUpload={(file) => {
                                                                handleVideoUpload(file);
                                                                return false;
                                                            }}
                                                        >
                                                            <Button
                                                                icon={<UploadOutlined />}
                                                                type="primary"
                                                                className="bg-primary hover:bg-primary-hbr"
                                                                loading={videoLoading}
                                                                size="large"

                                                            >
                                                                {videoLoading ? 'Uploading...' : 'Upload Video'}
                                                            </Button>
                                                        </Upload>

                                                        {videoUrl && (
                                                            <div className="mt-4">
                                                                <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                                                                    <video
                                                                        controls
                                                                        className="w-full max-w-md h-auto"
                                                                        style={{ maxHeight: '300px' }}
                                                                        preload="metadata"
                                                                    >
                                                                        <source src={videoUrl} type="video/mp4" />
                                                                        <source src={videoUrl} type="video/webm" />
                                                                        <source src={videoUrl} type="video/ogg" />
                                                                        Your browser does not support the video tag.
                                                                    </video>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Row gutter={24}>

                                            </Row>
                                        </div>

                                        <div className="mb-8">

                                            <Form.Item
                                                label={<span className="text-dark dark:text-white/[.87] font-medium">Description</span>}
                                                name="description"
                                            >
                                                <Editor
                                                    value={editorContent}
                                                    onEditorChange={(content) => setEditorContent(content)}
                                                    apiKey="vk693p6lgtcyd2xpc283y9knpg1zphq39p5uqwd5y4coapxo"
                                                    init={{
                                                        height: 300,
                                                        menubar: false,
                                                        plugins: [
                                                            'lists link image',
                                                            'charmap emoticons',
                                                            'table',
                                                            'code',
                                                            'help'
                                                        ],
                                                        toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | link image | help',
                                                        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                                                    }}
                                                />
                                            </Form.Item>
                                        </div>
                                        <div className="flex justify-end mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                            <Space size="middle">
                                                <Button
                                                    className="px-5 h-10 shadow-none hover:bg-gray-50 dark:hover:bg-white/10"
                                                    onClick={() => router.push("/admin/cruises")}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="primary"
                                                    htmlType="submit"
                                                    className="px-5 h-10 shadow-none bg-primary hover:bg-primary-hbr"
                                                    loading={cruiseLoading}
                                                    disabled={cruiseLoading}
                                                >
                                                    {cruiseLoading ? 'Creating Cruise...' : 'Create Cruise'}
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
                        <Button onClick={() => setCategoryDialogOpen(false)} disabled={categoryLoading}>Cancel</Button>
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

                <Form layout="vertical" className="p-3">
                    <Form.Item label="Category Name" required className="p-2">
                        <Input
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Enter category name"
                        />
                    </Form.Item>
                    <Form.Item label="Slug" className="p-2">
                        <Input value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} placeholder="category-slug" />
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
                            {"Add New Tag"}
                        </span>
                    </div>
                }
                open={tagDialogOpen}
                onCancel={() => setTagDialogOpen(false)}
                onOk={handleAddTag}
                footer={
                    <div className="flex justify-end gap-2 pr-6 pb-4">
                        <Button onClick={() => setTagDialogOpen(false)} disabled={tagLoading}>Cancel</Button>
                        <Button type="primary" onClick={handleAddTag} loading={tagLoading}>
                            {tagLoading ? 'Adding...' : 'OK'}
                        </Button>
                    </div>
                }
                width="95%"
                style={{ maxWidth: '500px' }}
                className="responsive-modal"
            >
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
                        <Input.TextArea
                            value={tagDescription}
                            onChange={(e) => setTagDescription(e.target.value)}
                            placeholder="Tag description"
                            rows={3}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={
                    <h3 className="text-lg font-semibold px-4 py-2">
                        Select Image
                    </h3>
                }
                open={mediaDialogOpen}
                onCancel={() => setMediaDialogOpen(false)}
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
                                                        handleImageUpload(file).then(() => {
                                                            setMediaDialogOpen(false);
                                                        });
                                                    }
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
                                            {archiveMediaImages.length > 0 ? (
                                                archiveMediaImages.map((media) => (
                                                    <div
                                                        key={media.id}
                                                        className="cursor-pointer border rounded p-2 transition-all hover:border-primary"
                                                        onClick={() => handleMediaImageSelect(media.image)}
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
    )
}

export default Protected(AddCruise, ["admin", "tours", "tours+media"])
