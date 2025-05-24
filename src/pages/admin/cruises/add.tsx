"use client"

import type React from "react"
import FirebaseFileUploader from '@/components/FirebaseFileUploader';
import { listAll, ref as storageRef } from "firebase/storage"
import { useState, useEffect } from "react"
import { Row, Col, Card, Input, Button, Form, Select, Divider, Upload, message, Space, Modal, DatePicker } from "antd"
import { UploadOutlined, PlusOutlined, ArrowLeftOutlined, PictureOutlined } from "@ant-design/icons"
import { PageHeaders } from "../../../components/page-headers/index"
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp, setDoc, doc } from "firebase/firestore"
import { db, app } from "../../../authentication/firebase"
import { getDownloadURL, ref, uploadBytes, getStorage } from "firebase/storage"
import Protected from "../../../components/Protected/Protected"
import { useRouter } from "next/router"
import { storage } from "@/lib/firebase-secondary";

const { Option } = Select

function AddCruise() {
    const router = useRouter()
    const [form] = Form.useForm()

    // State variables
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
    const [imageDialogOpen, setImageDialogOpen] = useState(false)
    const [imageType, setImageType] = useState("") // 'main' or 'seo'
    const [archiveImages, setArchiveImages] = useState<any[]>([])
    const [showArchive, setShowArchive] = useState(false)
    const [selectedArchiveImage, setSelectedArchiveImage] = useState("")
    const [videoLoading, setVideoLoading] = useState(false)
    const [videoUrl, setVideoUrl] = useState("")

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
            const storageReference = storageRef(storage, `prathaviTravelsMedia/${file.name}`);
            await uploadBytes(storageReference, file);
            const downloadURL = await getDownloadURL(storageReference);
            setImageUrl(downloadURL);
            message.success("Image uploaded successfully!");
        } catch (error) {
            console.error("Error uploading image:", error);
            message.error("Failed to upload image. Please try again.");
        } finally {
            setImageLoading(false);
        }
    };

    // Replace the existing handleVideoUpload function
    const handleVideoUpload = async (file: File) => {
        try {
            if (!storage) {
                throw new Error("Firebase Storage is not available");
            }
            setVideoLoading(true);
            const storageReference = storageRef(storage, `prathaviTravelsMedia/${file.name}`);
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

    // Add this function for handling archive image selection
    const handleArchiveImageSelect = (imageUrl: string) => {
        setImageUrl(imageUrl);
        setSelectedArchiveImage(imageUrl);
        setShowArchive(false);
        message.success("Archive image selected!");
    }

    const handleAddCategory = async () => {
        if (typeof window === "undefined" || newCategory.trim() === "") return

        try {
            const categoriesRef = collection(db, "categories")
            const docRef = await addDoc(categoriesRef, {
                name: newCategory,
                slug: categorySlug,
                description: categoryDescription,
                createdAt: serverTimestamp(),
            })
            setCategories([
                ...categories,
                {
                    id: docRef.id,
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
        }
    }

    const handleAddTag = async () => {
        if (typeof window === "undefined" || newTag.trim() === "") return

        try {
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
        }
    }

    const handleOpenImageDialog = (type: string) => {
        setImageType(type)
        setImageDialogOpen(true)
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
            const cruiseId = `CRID${Date.now().toString().slice(-6)}`;

            const cruiseData = {
                title: values.title,
                slug: values.slug,
                description: values.description,
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
                numberofDays: Number.parseInt(values.numberofDays) || 0,
                numberofNights: Number.parseInt(values.numberofNights) || 0,
                price: values.price || "0", // Store as string
                startDate: values.startDate ? values.startDate.toDate() : null,
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
            message.error("Failed to save cruise");
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
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Start Date</span>}
                                                        name="startDate"
                                                        rules={[{ required: true, message: "Please select start date" }]}
                                                    >
                                                        <DatePicker className="w-full py-2" format="YYYY-MM-DD" />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">End Date</span>}
                                                        name="endDate"
                                                        rules={[{ required: true, message: "Please select end date" }]}
                                                    >
                                                        <DatePicker className="w-full py-2" format="YYYY-MM-DD" />
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Row gutter={24}>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Price (₹)</span>}
                                                        name="price"
                                                        rules={[{ required: true, message: "Please enter cruise price" }]}
                                                    >
                                                        <Input type="number" placeholder="Enter price" className="py-2" />
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Row gutter={24}>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Location</span>}
                                                        name="location"
                                                        rules={[{ required: true, message: "Please enter cruise location" }]}
                                                    >
                                                        <Input placeholder="Enter cruise location" className="py-2" />
                                                    </Form.Item>
                                                </Col>
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
                                            </Row>

                                            <Row gutter={24}>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Number of Days</span>}
                                                        name="numberofDays"
                                                        rules={[{ required: true, message: "Please enter number of days" }]}
                                                    >
                                                        <Input type="number" placeholder="Enter number of days" className="py-2" />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={
                                                            <span className="text-dark dark:text-white/[.87] font-medium">Number of Nights</span>
                                                        }
                                                        name="numberofNights"
                                                        rules={[{ required: true, message: "Please enter number of nights" }]}
                                                    >
                                                        <Input type="number" placeholder="Enter number of nights" className="py-2" />
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Row gutter={24}>
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
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Image</span>}
                                                    >
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
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Row gutter={24}>
                                                <Col span={12}>
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
                                                            >
                                                                {videoLoading ? 'Uploading...' : 'Upload Video'}
                                                            </Button>
                                                        </Upload>
                                                        {videoFileName && (
                                                            <div className="mt-2 text-gray-600 dark:text-gray-300">
                                                                Selected Video: <span className="font-medium">{videoFileName}</span>
                                                            </div>
                                                        )}
                                                        {videoUrl && (
                                                            <div className="mt-2 text-gray-600 dark:text-gray-300">
                                                                Video URL: <span className="font-medium text-xs break-all">{videoUrl}</span>
                                                            </div>
                                                        )}
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        </div>

                                        <div className="mb-8">

                                            <Form.Item
                                                label={<span className="text-dark dark:text-white/[.87] font-medium">Description</span>}
                                                name="description"
                                            >
                                                <Input.TextArea rows={3} placeholder="Write a brief summary of the blog" className="text-base" />
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
                                                >
                                                    Create Cruise
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
                        <Button type="primary" onClick={handleAddCategory}>
                            OK
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
                        <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
                        <Button type="primary" onClick={handleAddCategory}>
                            OK
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
        </>
    )
}

export default Protected(AddCruise, ["admin"])
