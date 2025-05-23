import { useState, useEffect } from 'react';
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
    DatePicker,
    Switch,
    InputNumber
} from 'antd';
import {
    UploadOutlined,
    PlusOutlined,
    ArrowLeftOutlined,
    PictureOutlined,
    LoadingOutlined,
    MinusCircleOutlined
} from '@ant-design/icons';
import { PageHeaders } from '../../../../components/page-headers/index';
import {
    collection,
    getDocs,
    addDoc,
    query,
    orderBy,
    serverTimestamp,
    setDoc,
    doc,
    getDoc,
    updateDoc
} from 'firebase/firestore';
import { db, app } from '../../../../authentication/firebase';
import { getDownloadURL, ref, uploadBytes, getStorage } from 'firebase/storage';
import { Editor } from '@tinymce/tinymce-react';
import Protected from '../../../../components/Protected/Protected';
import { useRouter } from 'next/router';
import moment from 'moment';

// Initialize Firebase Storage
let storage: any = null;
// Storage should only be initialized on the client side
if (typeof window !== "undefined") {
    storage = getStorage(app);
}

const { Option } = Select;

function EditTour() {
    const router = useRouter();
    const { id } = router.query; // Get the tour ID from the URL
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);

    // State variables
    const [categories, setCategories] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    const [selectedTags, setSelectedTags] = useState<{ [key: string]: any }>({});
    const [imageLoading, setImageLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [editorContent, setEditorContent] = useState('');
    const [keywordInput, setKeywordInput] = useState('');
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
    const [itineraryImages, setItineraryImages] = useState<{ [key: string]: string[] }>({});
    const [tourData, setTourData] = useState<any>(null);

    const PageRoutes = [
        {
            path: '/admin',
            breadcrumbName: 'Dashboard',
        },
        {
            path: '/admin/tours',
            breadcrumbName: 'Tours',
        },
        {
            path: '',
            breadcrumbName: 'Edit Tour',
        },
    ];

    useEffect(() => {
        // Only fetch data on the client side when ID is available
        if (typeof window !== "undefined" && id) {
            fetchTourData();
            fetchCategories();
            fetchTags();
            fetchArchive();
        }
    }, [id]);

    useEffect(() => {
        setCategorySlug(newCategory.toLowerCase().replace(/ /g, '-'));
    }, [newCategory]);

    useEffect(() => {
        setTagSlug(newTag.toLowerCase().replace(/ /g, '-'));
    }, [newTag]);

    // Fetch the tour data based on ID
    const fetchTourData = async () => {
        try {
            setLoading(true);
            const tourDocRef = doc(db, "tours", id as string);
            const tourSnapshot = await getDoc(tourDocRef);

            if (tourSnapshot.exists()) {
                const data = tourSnapshot.data();
                setTourData(data);

                // Set form values
                form.setFieldsValue({
                    title: data.title,
                    slug: data.slug,
                    location: data.location || "",
                    numberOfDays: data.numberofDays || 0,
                    numberOfNights: data.numberofNights || 0,
                    price: data.price || 0,
                    tourType: data.tourType || "domestic",
                    flightIncluded: data.flightIncluded || false,
                    isFeatured: data.isFeatured || false,
                    isStartDate: data.isStartDate || false,
                    status: data.status || "active",
                    categoryID: data.categoryDetails?.categoryID || "",
                    categoryName: data.categoryDetails?.name || "",
                    categorySlug: data.categoryDetails?.slug || "",
                    categoryDescription: data.categoryDetails?.description || "",
                    startDate: data.startDate ? moment(data.startDate.toDate()) : null,
                    summary: data.description || "",
                });

                // Set itineraries
                const itinerariesArray = [];
                if (data.itenaries) {
                    // Convert the itineraries object to an array for Form.List
                    for (let i = 1; i <= Object.keys(data.itenaries).length; i++) {
                        const dayKey = `Day${i}`;
                        if (data.itenaries[dayKey]) {
                            itinerariesArray.push({
                                title: data.itenaries[dayKey].title,
                                description: data.itenaries[dayKey].description
                            });

                            // Set itinerary images
                            if (data.itenaries[dayKey].imageURL) {
                                setItineraryImages(prev => ({
                                    ...prev,
                                    [`${i}`]: data.itenaries[dayKey].imageURL
                                }));
                            }
                        }
                    }
                }
                form.setFieldsValue({ itineraries: itinerariesArray });

                // Set selected tags
                if (data.tags) {
                    setSelectedTags(data.tags);
                }

                // Set image URL
                if (data.imageURL) {
                    setImageUrl(data.imageURL);
                }

                // Set editor content
                if (data.description) {
                    setEditorContent(data.description);
                }
            } else {
                message.error("Tour not found");
                router.push('/admin/tours');
            }
        } catch (error) {
            console.error("Error fetching tour data:", error);
            message.error("Failed to fetch tour data");
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

    const handleImageUpload = async (file: File) => {
        setImageLoading(true);
        try {
            if (!file) {
                setImageLoading(false);
                return;
            }
            if (!storage) {
                throw new Error("Firebase Storage is not available");
            }
            const slug = form.getFieldValue('slug') || `tour-${Date.now()}`;
            const storageRef = ref(storage, `tour/${slug}/images/${file.name}`);
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

    const handleAddCategory = async () => {
        if (typeof window === "undefined" || newCategory.trim() === "") return;

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
        const tagId = `TID${Date.now().toString().slice(-6)}`;

            const tagsRef = collection(db, "tags");
            const docRef = await setDoc(doc(db, "tags", tagId), {
                name: newTag,
                slug: tagSlug,
                description: tagDescription,
                createdAt: serverTimestamp(),
            });
            setTags([
                ...tags,
                {
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

    const handleSetArchiveImage = (url: string) => {
        if (imageType === 'main') {
            setImageUrl(url);
        }
        setImageDialogOpen(false);
    };

    const handleOpenImageDialog = (type: string) => {
        setImageType(type);
        setImageDialogOpen(true);
    };

    const handleItineraryImageUpload = async (day: string, file: File) => {
        try {
            setImageLoading(true);
            if (!storage) {
                throw new Error("Firebase Storage is not available");
            }
            const slug = form.getFieldValue('slug') || `tour-${Date.now()}`;
            const storageRef = ref(storage, `tour/${slug}/itinerary/day${day}/${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            setItineraryImages(prev => {
                const dayImages = prev[day] || [];
                return {
                    ...prev,
                    [day]: [...dayImages, downloadURL]
                };
            });

            message.success("Itinerary image uploaded successfully");
            return downloadURL;
        } catch (error) {
            console.error("Error uploading itinerary image:", error);
            message.error("Failed to upload itinerary image");
        } finally {
            setImageLoading(false);
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

    const handleSubmit = async (values: any) => {
        if (typeof window === "undefined" || !id) return;

        try {
            setLoading(true);

            // Process itineraries
            const processedItineraries: { [key: string]: any } = {};
            if (values.itineraries) {
                values.itineraries.forEach((itinerary: any, index: number) => {
                    const dayKey = `Day${index + 1}`;
                    processedItineraries[dayKey] = {
                        title: itinerary.title,
                        description: itinerary.description,
                        imageURL: itineraryImages[`${index + 1}`] || []
                    };
                });
            }

            // Process tags
            const processedTags: { [key: string]: any } = {};
            Object.entries(selectedTags).forEach(([tagId, tagData]) => {
                processedTags[tagId] = tagData;
            });

            // Create tour data for update
            const updatedTourData = {
                title: values.title,
                slug: values.slug,
                description: editorContent.replace(/<\/?[^>]+(>|$)/g, ""), // Strip HTML
                categoryDetails: {
                    categoryID: values.categoryID || "",
                    name: values.categoryName || "",
                    slug: values.categorySlug || "",
                    description: values.categoryDescription || "",
                    createdAt: tourData.categoryDetails?.createdAt || serverTimestamp()
                },
                imageURL: imageUrl,
                isFeatured: values.isFeatured || false,
                isStartDate: values.isStartDate || false,
                itenaries: processedItineraries,
                location: values.location || "",
                numberofDays: values.numberOfDays || 0,
                numberofNights: values.numberOfNights || 0,
                price: values.price || 0,
                startDate: values.startDate ? values.startDate.toDate() : null,
                status: values.status || "active",
                tags: processedTags,
                tourType: values.tourType || "domestic",
                flightIncluded: values.flightIncluded || false,
                updatedAt: serverTimestamp(),
                // Preserve original creation date
                createdAt: tourData.createdAt || serverTimestamp(),
            };

            // Update the document
            const tourDocRef = doc(db, "tours", id as string);
            await updateDoc(tourDocRef, updatedTourData);

            message.success("Tour updated successfully");
            router.push("/admin/tours");

        } catch (error) {
            console.error("Error updating tour:", error);
            message.error("Failed to update tour");
        } finally {
            setLoading(false);
        }
    };

    // Function to add a tag to selected tags
    const handleAddSelectedTag = (tagId: string, tagData: any) => {
        setSelectedTags(prev => ({
            ...prev,
            [tagId]: tagData
        }));
    };

    // Function to remove a tag from selected tags
    const handleRemoveSelectedTag = (tagId: string) => {
        const newSelectedTags = { ...selectedTags };
        delete newSelectedTags[tagId];
        setSelectedTags(newSelectedTags);
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

    const handleNumberOfDaysChange = (value: number | null) => {
        if (!value || value <= 0) return;

        const currentItineraries = form.getFieldValue('itineraries') || [];

        if (value > currentItineraries.length) {
            const newItineraries = [...currentItineraries];
            for (let i = currentItineraries.length; i < value; i++) {
                newItineraries.push({ title: `Day ${i + 1}`, description: '' });
            }
            form.setFieldsValue({ itineraries: newItineraries });

        } else if (value < currentItineraries.length) {
            const newItineraries = currentItineraries.slice(0, value);
            form.setFieldsValue({ itineraries: newItineraries });

            const newItineraryImages = { ...itineraryImages };
            for (let i = value; i < currentItineraries.length; i++) {
                delete newItineraryImages[`${i + 1}`];
            }
            setItineraryImages(newItineraryImages);
        }
    };

    if (loading && !tourData) {
        return (
            <div className="flex justify-center items-center h-screen">
                <LoadingOutlined style={{ fontSize: 24 }} spin />
                <span className="ml-2">Loading tour data...</span>
            </div>
        );
    }

    return (
        <>
            <PageHeaders
                className="flex items-center justify-between px-4 sm:px-8 xl:px-[15px] pt-2 pb-4 sm:pb-6 bg-transparent sm:flex-row flex-col gap-4"
                title="Edit Tour"
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
                                            onClick={() => router.push('/admin/tours')}
                                            icon={<ArrowLeftOutlined />}
                                            className="flex items-center"
                                        >
                                            Back to Tours
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
                                                        rules={[{ required: true, message: 'Please enter tour title' }]}
                                                    >
                                                        <Input
                                                            placeholder="Enter tour title"
                                                            onChange={handleSlugGeneration}
                                                            className="py-2"
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Slug</span>}
                                                        name="slug"
                                                        rules={[{ required: true, message: 'Please enter tour slug' }]}
                                                    >
                                                        <Input
                                                            placeholder="tour-slug"
                                                            className="py-2"
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Row gutter={24}>
                                                <Col span={8}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Start Date</span>}
                                                        name="startDate"
                                                    >
                                                        <DatePicker
                                                            className="w-full py-2"
                                                            format="YYYY-MM-DD"
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Use Start Date</span>}
                                                        name="isStartDate"
                                                        valuePropName="checked"
                                                        initialValue={false}
                                                    >
                                                        <Switch className='bg-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none' />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Status</span>}
                                                        name="status"
                                                        initialValue="active"
                                                    >
                                                        <Select className="w-full">
                                                            <Option value="active">Active</Option>
                                                            <Option value="inactive">Inactive</Option>
                                                            <Option value="draft">Draft</Option>
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Row gutter={24}>
                                                <Col span={8}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Number of Days</span>}
                                                        name="numberOfDays"
                                                        rules={[{ required: true, message: 'Please enter number of days' }]}
                                                    >
                                                        <InputNumber
                                                            className="w-full py-2"
                                                            min={1}
                                                            placeholder="Number of days"
                                                            onChange={handleNumberOfDaysChange}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Number of Nights</span>}
                                                        name="numberOfNights"
                                                        rules={[{ required: true, message: 'Please enter number of nights' }]}
                                                    >
                                                        <InputNumber
                                                            className="w-full py-2"
                                                            min={0}
                                                            placeholder="Number of nights"
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Price (₹)</span>}
                                                        name="price"
                                                        rules={[{ required: true, message: 'Please enter tour price' }]}
                                                    >
                                                        <InputNumber
                                                            className="w-full py-2"
                                                            min={0}
                                                            placeholder="Enter price"
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Row gutter={24}>
                                                <Col span={8}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Location</span>}
                                                        name="location"
                                                        rules={[{ required: true, message: 'Please enter tour location' }]}
                                                    >
                                                        <Input
                                                            placeholder="Enter tour location"
                                                            className="py-2"
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Tour Type</span>}
                                                        name="tourType"
                                                        initialValue="domestic"
                                                    >
                                                        <Select className="w-full">
                                                            <Option value="domestic">Domestic</Option>
                                                            <Option value="international">International</Option>
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Flight Included</span>}
                                                        name="flightIncluded"
                                                        valuePropName="checked"
                                                        initialValue={false}
                                                    >
                                                        <Switch className='bg-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none' />
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Row gutter={24}>
                                                <Col span={8}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Featured</span>}
                                                        name="isFeatured"
                                                        valuePropName="checked"
                                                        initialValue={false}
                                                    >
                                                        <Switch className='bg-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none' />
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
                                            </Row>


                                            <Row gutter={24}>
                                                <Col span={24}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <label className="text-dark dark:text-white/[.87] font-medium">
                                                            Tags
                                                        </label>
                                                        <Button
                                                            type="link"
                                                            onClick={() => setTagDialogOpen(true)}
                                                            size="small"
                                                            className="text-primary"
                                                            icon={<PlusOutlined />}
                                                        >
                                                            Add New
                                                        </Button>
                                                    </div>
                                                    <Form.Item
                                                        name="tagID"
                                                        rules={[{ required: true, message: "Please select a tag" }]}
                                                    >
                                                        <div className="flex flex-wrap gap-2 mb-2">
                                                            {Object.entries(selectedTags).map(([tagId, tagData]: [string, any]) => (
                                                                <Tag
                                                                    key={tagId}
                                                                    closable
                                                                    onClose={() => handleRemoveSelectedTag(tagId)}
                                                                    className="py-1"
                                                                >
                                                                    {tagData.name}
                                                                </Tag>
                                                            ))}
                                                        </div>
                                                        <Select
                                                            placeholder="Select tags"
                                                            className="w-full"
                                                            mode="multiple"
                                                            dropdownStyle={{ borderRadius: "6px" }}
                                                            value={[]}
                                                            onChange={(_, options) => {
                                                                if (Array.isArray(options) && options.length > 0) {
                                                                    const lastOption = options[options.length - 1];
                                                                    handleAddSelectedTag(lastOption.key as string, {
                                                                        name: lastOption.label,
                                                                        slug: tags.find(tag => tag.id === lastOption.key)?.slug || "",
                                                                        description: tags.find(tag => tag.id === lastOption.key)?.description || ""
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            {tags.map(tag => (
                                                                <Select.Option key={tag.id} value={tag.id} label={tag.name}>
                                                                    {tag.name}
                                                                </Select.Option>
                                                            ))}
                                                        </Select>
                                                        <Button
                                                            type="link"
                                                            onClick={() => setTagDialogOpen(true)}
                                                            icon={<PlusOutlined />}
                                                            className="p-0 mt-2"
                                                        >
                                                            Add New
                                                        </Button>
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        </div>

                                        <div className="mb-8">
                                            <h3 className="text-base text-primary dark:text-primary mb-4 font-medium flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                                    <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z" />
                                                </svg>
                                                Tour Description
                                            </h3>
                                            <Row gutter={24}>
                                                <Col span={24}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Summary</span>}
                                                        name="summary"
                                                        rules={[{ required: true, message: 'Please enter tour summary' }]}
                                                    >
                                                        <Input.TextArea rows={3} placeholder="Enter tour summary" />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        </div>

                                        <div className="mb-8">
                                            <h3 className="text-base text-primary dark:text-primary mb-4 font-medium flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                                                    <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z" />
                                                </svg>
                                                Featured Image
                                            </h3>
                                            <Row gutter={24}>
                                                <Col span={12}>
                                                    <div className="mb-4">
                                                        <div className="text-dark dark:text-white/[.87] font-medium mb-1">Tour Image</div>
                                                        {imageUrl ? (
                                                            <div className="relative group">
                                                                <img
                                                                    src={imageUrl}
                                                                    alt="Tour"
                                                                    className="w-full h-48 object-cover rounded-md"
                                                                />
                                                                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <Button
                                                                        type="primary"
                                                                        danger
                                                                        onClick={() => setImageUrl('')}
                                                                    >
                                                                        Remove
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col gap-2">
                                                                <Upload
                                                                    name="image"
                                                                    listType="picture-card"
                                                                    className="avatar-uploader"
                                                                    showUploadList={false}
                                                                    beforeUpload={(file) => {
                                                                        handleImageUpload(file);
                                                                        return false;
                                                                    }}
                                                                >
                                                                    <div className="flex flex-col items-center justify-center">
                                                                        {imageLoading ? <LoadingOutlined /> : <PictureOutlined />}
                                                                        <div className="mt-2">Upload</div>
                                                                    </div>
                                                                </Upload>
                                                                <Button
                                                                    type="default"
                                                                    onClick={() => handleOpenImageDialog('main')}
                                                                    className="flex items-center justify-center"
                                                                >
                                                                    <span>Select from Archive</span>
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>

                                        <div className="mb-8">
                                            <h3 className="text-base text-primary dark:text-primary mb-4 font-medium flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M0 2.5A1.5 1.5 0 0 1 1.5 1h11A1.5 1.5 0 0 1 14 2.5v10.528c0 .3-.05.654-.238.972h.738a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 1 1 0v9a1.5 1.5 0 0 1-1.5 1.5H1.497A1.497 1.497 0 0 1 0 13.5v-11zM12 14c.37 0 .654-.211.853-.442.092-.1.147-.205.173-.308a1.4 1.4 0 0 0 .02-.267V2.5a.5.5 0 0 0-.5-.5h-11a.5.5 0 0 0-.5.5V14h11z" />
                                                    <path d="M15.5 8a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1 0-1h5a.5.5 0 0 1 .5.5zm0-4a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1 0-1h5a.5.5 0 0 1 .5.5zm0 8a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1 0-1h5a.5.5 0 0 1 .5.5z" />
                                                </svg>
                                                Itinerary
                                            </h3>
                                            <Form.List name="itineraries">
                                                {(fields, { add, remove }) => (
                                                    <>
                                                        {fields.map(({ key, name, ...restField }) => (
                                                            <div key={key} className="mb-4 p-4 border border-gray-200 rounded-md">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <h4 className="text-dark dark:text-white/[.87] font-medium">Day {name + 1}</h4>
                                                                    <Button
                                                                        type="text"
                                                                        danger
                                                                        icon={<MinusCircleOutlined />}
                                                                        onClick={() => remove(name)}
                                                                    />
                                                                </div>
                                                                <Row gutter={24}>
                                                                    <Col span={24} className="mb-4">
                                                                        <Form.Item
                                                                            {...restField}
                                                                            name={[name, 'title']}
                                                                            rules={[{ required: true, message: 'Please enter day title' }]}
                                                                            className="mb-2"
                                                                            label={<span className="text-dark dark:text-white/[.87] font-medium">Title</span>}
                                                                        >
                                                                            <Input placeholder="Day title" />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col span={24} className="mb-4">
                                                                        <Form.Item
                                                                            {...restField}
                                                                            name={[name, 'description']}
                                                                            rules={[{ required: true, message: 'Please enter day description' }]}
                                                                            className="mb-2"
                                                                            label={<span className="text-dark dark:text-white/[.87] font-medium">Description</span>}
                                                                        >
                                                                            <Input.TextArea rows={3} placeholder="Day description" />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col span={24}>
                                                                        <div className="mb-2">
                                                                            <div className="text-dark dark:text-white/[.87] font-medium mb-1">Images</div>
                                                                            <div className="flex flex-wrap gap-2 mb-2">
                                                                                {(itineraryImages[`${name + 1}`] || []).map((url, index) => (
                                                                                    <div key={index} className="relative group">
                                                                                        <img
                                                                                            src={url}
                                                                                            alt={`Day ${name + 1}`}
                                                                                            className="w-24 h-24 object-cover rounded-md"
                                                                                        />
                                                                                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                            <Button
                                                                                                type="primary"
                                                                                                danger
                                                                                                size="small"
                                                                                                onClick={() => {
                                                                                                    const newImages = [...(itineraryImages[`${name + 1}`] || [])];
                                                                                                    newImages.splice(index, 1);
                                                                                                    setItineraryImages({
                                                                                                        ...itineraryImages,
                                                                                                        [`${name + 1}`]: newImages
                                                                                                    });
                                                                                                }}
                                                                                            >
                                                                                                Remove
                                                                                            </Button>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                            <Upload
                                                                                name="itineraryImage"
                                                                                listType="picture-card"
                                                                                className="avatar-uploader"
                                                                                showUploadList={false}
                                                                                beforeUpload={(file) => {
                                                                                    handleItineraryImageUpload(`${name + 1}`, file);
                                                                                    return false;
                                                                                }}
                                                                            >
                                                                                <div className="flex flex-col items-center justify-center">
                                                                                    {imageLoading ? <LoadingOutlined /> : <PictureOutlined />}
                                                                                    <div className="mt-2">Upload</div>
                                                                                </div>
                                                                            </Upload>
                                                                        </div>
                                                                    </Col>
                                                                </Row>
                                                            </div>
                                                        ))}
                                                        <Form.Item>
                                                            <Button
                                                                type="dashed"
                                                                onClick={() => add()}
                                                                block
                                                                icon={<PlusOutlined />}
                                                            >
                                                                Add Day
                                                            </Button>
                                                        </Form.Item>
                                                    </>
                                                )}
                                            </Form.List>
                                        </div>

                                        <div className="flex justify-end mt-8">
                                            <Space>
                                                <Button
                                                    type="default"
                                                    onClick={() => router.push('/admin/tours')}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="primary"
                                                    htmlType="submit"
                                                    loading={loading}
                                                >
                                                    Update Tour
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

            {/* Add New Category Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
                            Add New Category
                        </span>
                    </div>
                }
                open={categoryDialogOpen}
                onCancel={() => setCategoryDialogOpen(false)}
                footer={
                    <div className="flex justify-end gap-2 pr-6 pb-4">
                        <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
                        <Button
                            type="primary"
                            onClick={handleAddCategory}
                            disabled={!newCategory.trim()}
                        >
                            Add Category
                        </Button>
                    </div>
                }
                width="95%"
                style={{ maxWidth: '500px' }}
                className="responsive-modal"
            >
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


            {/* Add New Tag Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
                            Add New Tag
                        </span>
                    </div>
                }
                open={tagDialogOpen}
                onCancel={() => setTagDialogOpen(false)}
                footer={
                    <div className="flex justify-end gap-2 pr-6 pb-4">
                        <Button onClick={() => setTagDialogOpen(false)}>Cancel</Button>
                        <Button
                            type="primary"
                            onClick={handleAddTag}
                            disabled={!newTag.trim()}
                        >
                            Add Tag
                        </Button>
                    </div>
                }
                width="95%"
                style={{ maxWidth: '500px' }}
                className="responsive-modal"
            >
                <Form layout="vertical" className="p-3">
                    <Form.Item
                        label={
                            <span className="text-dark dark:text-white/[.87] font-medium">
                                Tag Name
                            </span>
                        }
                        name="name"
                        rules={[{ required: true, message: 'Please enter tag name!' }]}
                        required
                    >
                        <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Enter tag name"
                        />
                    </Form.Item>
                    <Form.Item
                        label={
                            <span className="text-dark dark:text-white/[.87] font-medium">
                                Slug
                            </span>
                        }
                        name="slug"
                        rules={[{ required: true, message: 'Please enter tag slug!' }]}
                        tooltip="The slug is used in the URL. It must be unique and contain only lowercase letters, numbers, and hyphens."
                    >
                        <Input
                            value={tagSlug}
                            onChange={(e) => setTagSlug(e.target.value)}
                            placeholder="tag-slug"
                        />
                    </Form.Item>
                    <Form.Item
                        label={
                            <span className="text-dark dark:text-white/[.87] font-medium">
                                Description
                            </span>
                        }
                        name="description"
                        rules={[{ required: true, message: 'Please enter tag description!' }]}
                    >
                        <Input.TextArea
                            value={tagDescription}
                            onChange={(e) => setTagDescription(e.target.value)}
                            placeholder="Enter tag description"
                            rows={3}
                        />
                    </Form.Item>
                </Form>
            </Modal>


            {/* Select Image from Archive Modal */}
            <Modal
                title="Select Image from Archive"
                open={imageDialogOpen}
                onCancel={() => setImageDialogOpen(false)}
                footer={null}
                width={800}
            >
                <div className="my-4">
                    <Upload
                        name="archiveImage"
                        listType="picture-card"
                        className="avatar-uploader"
                        showUploadList={false}
                        beforeUpload={(file) => {
                            handleArchiveImageUpload(file);
                            return false;
                        }}
                    >
                        <div className="flex flex-col items-center justify-center">
                            {imageLoading ? <LoadingOutlined /> : <PlusOutlined />}
                            <div className="mt-2">Upload to Archive</div>
                        </div>
                    </Upload>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[400px] overflow-auto">
                    {archive.map((item, index) => (
                        <div
                            key={index}
                            className="cursor-pointer border border-gray-200 rounded-md overflow-hidden hover:border-blue-500 transition-colors"
                            onClick={() => handleSetArchiveImage(item.ImageUrl)}
                        >
                            <img
                                src={item.ImageUrl}
                                alt={`Archive ${index}`}
                                className="w-full h-32 object-cover"
                            />
                        </div>
                    ))}
                </div>
            </Modal>
        </>
    );
}

export default Protected(EditTour, ["admin"]);
