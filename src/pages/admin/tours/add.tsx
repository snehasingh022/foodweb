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
import { PageHeaders } from '../../../components/page-headers/index';
import {
    collection,
    getDocs,
    addDoc,
    query,
    orderBy,
    serverTimestamp,
    setDoc,  // Added missing import
    doc      // Added missing import
} from 'firebase/firestore';
import { db, app } from '../../../authentication/firebase';
import { getDownloadURL, ref, uploadBytes, getStorage } from 'firebase/storage';
import { Editor } from '@tinymce/tinymce-react';
import Protected from '../../../components/Protected/Protected';
import { useRouter } from 'next/router';

// Initialize Firebase Storage
let storage: any = null;
// Storage should only be initialized on the client side
if (typeof window !== "undefined") {
    storage = getStorage(app);
}

const { Option } = Select;

function AddTour() {
    const router = useRouter();
    const [form] = Form.useForm();

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
            breadcrumbName: 'Add Tour',
        },
    ];

    useEffect(() => {
        // Only fetch data on the client side
        if (typeof window !== "undefined") {
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
            const slug = form.getFieldValue('slug') || `tour-${Date.now()}`; // Fixed string interpolation
            const storageRef = ref(storage, `tour/${slug}/images/${file.name}`); // Fixed string interpolation
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
            const storageRef = ref(storage, `/archive/images/${file.name}`); // Fixed string interpolation
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

    // Modified handleItineraryImageUpload function
    const handleItineraryImageUpload = async (day: string, file: File) => {
        try {
            setImageLoading(true);
            if (!storage) {
                throw new Error("Firebase Storage is not available");
            }
            const slug = form.getFieldValue('slug') || `tour-${Date.now()}`; // Fixed string interpolation
            const storageRef = ref(storage, `tour/${slug}/itinerary/day${day}/${file.name}`); // Fixed string interpolation
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
        if (typeof window === "undefined") return;

        try {
            // Process itineraries
            const processedItineraries: { [key: string]: any } = {};
            if (values.itineraries) {
                values.itineraries.forEach((itinerary: any, index: number) => {
                    const dayKey = `Day${index + 1}`; // Fixed string interpolation
                    processedItineraries[dayKey] = {
                        title: itinerary.title,
                        description: itinerary.description,
                        imageURL: itineraryImages[`${index + 1}`] || [] // Fixed string interpolation
                    };
                });
            }

            // Process tags
            const processedTags: { [key: string]: any } = {};
            Object.entries(selectedTags).forEach(([tagId, tagData]) => {
                processedTags[tagId] = tagData;
            });

            // Generate custom tour ID
            const tourId = `TRID${Date.now().toString().slice(-6)}`; // Fixed string interpolation

            // Create tour data
            const tourData = {
                title: values.title,
                slug: values.slug,
                description: editorContent.replace(/<\/?[^>]+(>|$)/g, ""), // Strip HTML
                categoryDetails: {
                    categoryID: values.categoryID || "",
                    name: values.categoryName || "",
                    slug: values.categorySlug || "",
                    description: values.categoryDescription || "",
                    createdAt: serverTimestamp()
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
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            // Save with custom ID
            await setDoc(doc(db, "tours", tourId), tourData);
            message.success("Tour created successfully");
            router.push("/admin/tours");

        } catch (error) {
            console.error("Error saving tour:", error);
            message.error("Failed to save tour");
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
                newItineraries.push({ title: `Day ${i + 1}`, description: '' }); // Fixed string interpolation
            }
            form.setFieldsValue({ itineraries: newItineraries });

        } else if (value < currentItineraries.length) {
            const newItineraries = currentItineraries.slice(0, value);
            form.setFieldsValue({ itineraries: newItineraries });

            const newItineraryImages = { ...itineraryImages };
            for (let i = value; i < currentItineraries.length; i++) {
                delete newItineraryImages[`${i + 1}`]; // Fixed string interpolation
            }
            setItineraryImages(newItineraryImages);
        }
    };



    return (
        <>
            <PageHeaders
                className="flex items-center justify-between px-4 sm:px-8 xl:px-[15px] pt-2 pb-4 sm:pb-6 bg-transparent sm:flex-row flex-col gap-4"
                title="Add Tour"
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
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Category</span>}
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
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {tags.map((tag) => (
                                                            <Tag
                                                                key={tag.id}
                                                                className={`px-3 py-1 rounded-full cursor-pointer ${selectedTags[tag.id] ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
                                                                    }`}
                                                                onClick={() => {
                                                                    if (selectedTags[tag.id]) {
                                                                        handleRemoveSelectedTag(tag.id);
                                                                    } else {
                                                                        handleAddSelectedTag(tag.id, {
                                                                            name: tag.name,
                                                                            slug: tag.slug,
                                                                            description: tag.description
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                {tag.name}
                                                            </Tag>
                                                        ))}
                                                    </div>
                                                </Col>
                                            </Row>

                                            <Row gutter={24}>
                                                <Col span={12}>
                                                    <Form.Item label={<span className="text-dark dark:text-white/[.87] font-medium">Featured Image</span>}>
                                                        <Form.Item label="">
                                                            <FirebaseFileUploader
                                                                storagePath="tours/images" // Customize storage path
                                                                accept="image/*" // Only accept images
                                                                maxSizeMB={10} // Adjust max file size
                                                                onUploadSuccess={(url) => setImageUrl(url)} // Capture the download URL
                                                                onUploadError={(error) => message.error("Image upload failed!")}
                                                                disabled={false}
                                                            />
                                                            {imageUrl && (
                                                                <div className="mt-2">
                                                                    <img
                                                                        src={imageUrl}
                                                                        alt="Preview"
                                                                        className="max-h-32 rounded-md border"
                                                                    />
                                                                </div>
                                                            )}
                                                        </Form.Item>
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        </div>

                                        <div className="mb-8">

                                            <Form.Item
                                                label={<span className="text-dark dark:text-white/[.87] font-medium">Description</span>}
                                                name="summary"
                                            >
                                                <Input.TextArea rows={3} placeholder="Write a brief summary of the blog" className="text-base" />
                                            </Form.Item>
                                        </div>

                                        <div className="mb-8">
                                            <h3 className="text-dark dark:text-white/[.87] font-medium text-base mb-4 flex items-center gap-2">
                                                Itinerary
                                            </h3>
                                            <Form.List name="itineraries">
                                                {(fields, { add, remove }) => (
                                                    <>
                                                        {fields.map(({ key, name, ...restField }, index) => (
                                                            <div key={key} className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg relative">

                                                                <h4 className="text-dark dark:text-white/[.87] font-medium mb-3">Day {index + 1}</h4>
                                                                <Row gutter={24}>
                                                                    <Col span={24}>
                                                                        <Form.Item
                                                                            {...restField}
                                                                            name={[name, 'title']}
                                                                            label={<span className="text-dark dark:text-white/[.87] font-medium">Title</span>}
                                                                            rules={[{ required: true, message: 'Please enter day title' }]}
                                                                        >
                                                                            <Input placeholder="Enter day title" />
                                                                        </Form.Item>
                                                                    </Col>
                                                                </Row>
                                                                <Row gutter={24}>
                                                                    <Col span={24}>
                                                                        <Form.Item
                                                                            {...restField}
                                                                            name={[name, 'description']}
                                                                            label={<span className="text-dark dark:text-white/[.87] font-medium">Description</span>}
                                                                            rules={[{ required: true, message: 'Please enter day description' }]}
                                                                        >
                                                                            <Input.TextArea rows={3} placeholder="Enter day description" />
                                                                        </Form.Item>
                                                                    </Col>
                                                                </Row>
                                                                <Row gutter={24}>
                                                                    <Col span={24}>
                                                                        <div className="mb-2">
                                                                            <span className="text-dark dark:text-white/[.87] font-medium">Images</span>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-4">
                                                                            {/* Display existing images */}
                                                                            {(itineraryImages[`${index + 1}`] || []).map((url, imgIndex) => (
                                                                                <div
                                                                                    key={imgIndex}
                                                                                    className="relative w-32 h-32 border border-gray-200 rounded-md overflow-hidden group"
                                                                                >
                                                                                    <img
                                                                                        src={url || "/placeholder.svg"}
                                                                                        alt={`Day ${index + 1} image ${imgIndex + 1}`}
                                                                                        className="w-full h-full object-cover"
                                                                                    />
                                                                                    <div
                                                                                        className="absolute inset-0 bg-black/50 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                                                        onClick={() => {
                                                                                            const newImages = { ...itineraryImages };
                                                                                            const dayImages = [...(newImages[`${index + 1}`] || [])];
                                                                                            dayImages.splice(imgIndex, 1);
                                                                                            newImages[`${index + 1}`] = dayImages;
                                                                                            setItineraryImages(newImages);
                                                                                        }}
                                                                                    >
                                                                                        <MinusCircleOutlined style={{ fontSize: '20px', color: 'white' }} />
                                                                                    </div>
                                                                                </div>
                                                                            ))}

                                                                            {/* Upload new image button */}
                                                                            <div
                                                                                className="w-32 h-32 border border-dashed border-gray-300 rounded-md p-2 text-center cursor-pointer hover:border-primary transition-colors duration-300 flex flex-col justify-center items-center"
                                                                                onClick={() => {
                                                                                    // Create a hidden file input and trigger it
                                                                                    const input = document.createElement('input');
                                                                                    input.type = 'file';
                                                                                    input.accept = 'image/*';
                                                                                    input.onchange = (e) => {
                                                                                        const target = e.target as HTMLInputElement;
                                                                                        const file = target.files?.[0];
                                                                                        if (file) {
                                                                                            handleItineraryImageUpload(`${index + 1}`, file);
                                                                                        }
                                                                                    };
                                                                                    input.click();
                                                                                }}
                                                                            >
                                                                                <PictureOutlined style={{ fontSize: '24px', color: '#d9d9d9' }} />
                                                                                <p className="mt-2 text-gray-500 text-sm">Add Image</p>
                                                                            </div>
                                                                        </div>
                                                                    </Col>
                                                                </Row>
                                                            </div>
                                                        ))}

                                                    </>
                                                )}
                                            </Form.List>
                                        </div>
                                        <div className="flex justify-end mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                            <Space size="middle">
                                                <Button
                                                    className="px-5 h-10 shadow-none hover:bg-gray-50 dark:hover:bg-white/10"
                                                    onClick={() => router.push('/admin/tours')}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="primary"
                                                    htmlType="submit"
                                                    className="px-5 h-10 shadow-none bg-primary hover:bg-primary-hbr"
                                                >
                                                    Create Tour
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
                title="Add New Category"
                open={categoryDialogOpen}
                onCancel={() => setCategoryDialogOpen(false)}
                onOk={handleAddCategory}
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
                // Remove or comment out the footer={null} line
                // footer={null}
                width="95%"
                style={{ maxWidth: '600px' }}
                className="responsive-modal"
                bodyStyle={{ padding: '24px' }}
                // Optionally, you can customize the OK and Cancel button texts
                okText="Add Tag"
                cancelText="Cancel"
            >
                <Form layout="vertical">
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
                                src={item.ImageUrl || "/placeholder.svg"}
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

export default Protected(AddTour, ["admin"]);
