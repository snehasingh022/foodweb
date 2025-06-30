import { useState, useEffect } from 'react';
import { listAll, ref as storageRef } from "firebase/storage"
import { convertImageToWebP } from '@/components/imageConverter';
import {
    Row,
    Col,
    Card,
    Input,
    Button,
    Form,
    Select,
    Tag,
    message,
    Space,
    Modal,
    DatePicker,
    Switch,
    InputNumber,
    Tabs,
    Upload,
} from 'antd';
import {
    PlusOutlined,
    ArrowLeftOutlined,
    PictureOutlined,
    MinusCircleOutlined,
    FileImageOutlined,
    CloudUploadOutlined,
    UploadOutlined,
} from '@ant-design/icons';
import { PageHeaders } from '../../../components/page-headers/index';
import {
    collection,
    getDocs,
    query,
    orderBy,
    serverTimestamp,
    setDoc,
    doc
} from 'firebase/firestore';
import { db, app } from '../../../authentication/firebase';
import { getDownloadURL, uploadBytes } from 'firebase/storage';
import { Editor } from '@tinymce/tinymce-react';
import Protected from '../../../components/Protected/Protected';
import { useRouter } from 'next/router';
import { storage } from '@/lib/firebase-secondary';
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
    const [itineraryEditorContent, setItineraryEditorContent] = useState<{ [key: string]: string }>({});
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [categorySlug, setCategorySlug] = useState('');
    const [categoryDescription, setCategoryDescription] = useState('');
    const [tagDialogOpen, setTagDialogOpen] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [tagSlug, setTagSlug] = useState('');
    const [tagDescription, setTagDescription] = useState('');
    const [itineraryImages, setItineraryImages] = useState<{ [key: string]: string[] }>({});
    const [tagForm] = Form.useForm();
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [tagLoading, setTagLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
    const [archiveMediaImages, setArchiveMediaImages] = useState<any[]>([]);
    const [itineraryMediaDialogOpen, setItineraryMediaDialogOpen] = useState(false);
    const [currentItineraryIndex, setCurrentItineraryIndex] = useState(0);
    const [archiveOrUpload, setArchiveOrUpload] = useState<'upload' | 'archive'>('upload');
    const [dontInput, setDontInput] = useState<string>('');
    const [dontsInputs, setDontsInputs] = useState<string[]>([]);
    const [includedInput, setIncludedInput] = useState('');
    const [includedMoreInputs, setIncludedMoreInputs] = useState<string[]>([]);
    const [notIncludedInput, setNotIncludedInput] = useState('');
    const [notIncludedInputs, setNotIncludedInputs] = useState<string[]>([]);
    const [doInput, setDoInput] = useState<string>('');
    const [dosInputs, setDosInputs] = useState<string[]>([]);
    const [selectedTourType, setSelectedTourType] = useState('domestic'); // Add state for tour type

    // Video upload state variables
    const [videoLoading, setVideoLoading] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const [videoFileName, setVideoFileName] = useState('');

    const handleDoInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && doInput.trim()) {
            e.preventDefault();
            if (!dosInputs.includes(doInput.trim())) {
                setDosInputs([...dosInputs, doInput.trim()]);
            }
            setDoInput('');
        }
    };

    const handleDeleteDo = (doToDelete: string) => {
        setDosInputs(dosInputs.filter((item) => item !== doToDelete));
    };

    const handleDontInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && dontInput.trim()) {
            e.preventDefault();
            const trimmed = dontInput.trim();
            if (!dontsInputs.includes(trimmed)) {
                setDontsInputs([...dontsInputs, trimmed]);
                setDontInput('');
            }
        }
    };

    const handleDeleteDont = (dontToDelete: string) => {
        setDontsInputs(dontsInputs.filter((item) => item !== dontToDelete));
    };

    const handleIncludedInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && includedInput.trim()) {
            e.preventDefault();
            const trimmed = includedInput.trim();
            if (!includedMoreInputs.includes(trimmed)) {
                setIncludedMoreInputs([...includedMoreInputs, trimmed]);
                setIncludedInput('');
            }
        }
    };

    const handleNotIncludedInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && notIncludedInput.trim()) {
            e.preventDefault();
            const trimmed = notIncludedInput.trim();
            if (!notIncludedInputs.includes(trimmed)) {
                setNotIncludedInputs([...notIncludedInputs, trimmed]);
                setNotIncludedInput('');
            }
        }
    };

    const handleDeleteIncluded = (itemToDelete: string) => {
        setIncludedMoreInputs(includedMoreInputs.filter((item) => item !== itemToDelete));
    };

    const handleDeleteNotIncluded = (itemToDelete: string) => {
        setNotIncludedInputs(notIncludedInputs.filter((item) => item !== itemToDelete));
    };

    // Handle tour type change
    const handleTourTypeChange = (value: string) => {
        setSelectedTourType(value);
        // Clear themeType if switching to international
        if (value === 'international') {
            form.setFieldsValue({ themeType: undefined });
        }
    };

    // Video upload handler
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
            fetchMediaImages();
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

    const handleImageUpload = async (file: File) => {
        try {
            if (!storage) {
                throw new Error("Firebase Storage is not available");
            }
            setImageLoading(true);
            const webpFile = await convertImageToWebP(file);
            const storageReference = storageRef(storage, `prathaviTravelsMedia/media/${webpFile.name}`);
            await uploadBytes(storageReference, webpFile);
            const downloadURL = await getDownloadURL(storageReference);
            const mediaId = `MID${Date.now()}`;
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

    const handleAddCategory = async () => {
        if (typeof window === "undefined" || newCategory.trim() === "") return;

        try {
            setCategoryLoading(true);
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

    const handleMediaImageSelect = (imageUrl: string) => {
        setImageUrl(imageUrl);
        setMediaDialogOpen(false);
        message.success("Image selected from archive!");
    };

    const handleAddTag = async (values: any) => {
        if (typeof window === "undefined") return;

        try {
            setTagLoading(true);
            const tagId = `TID${Date.now().toString().slice(-6)}`;

            // Check if tag with same name or slug already exists
            const existingTag = tags.find(tag =>
                tag.name.toLowerCase() === values.name.toLowerCase() ||
                tag.slug === values.slug
            );

            if (existingTag) {
                message.error("A tag with this name or slug already exists!");
                return;
            }

            const tagsRef = collection(db, "tags");
            const docRef = await setDoc(doc(db, "tags", tagId), {
                name: values.name.trim(),
                slug: values.slug.trim(),
                description: values.description.trim(),
                createdAt: serverTimestamp(),
            });

            const newTagData = {
                id: tagId,
                name: values.name.trim(),
                slug: values.slug.trim(),
                description: values.description.trim(),
            };

            setTags([newTagData, ...tags]);

            setNewTag("");
            setTagSlug("");
            setTagDescription("");
            tagForm.resetFields();
            setTagDialogOpen(false);

            message.success("Tag added successfully!");
        } catch (error) {
            console.error("Error adding tag:", error);
            message.error("Error adding tag. Please try again.");
        } finally {
            setTagLoading(false);
        }
    };

    const handleItineraryMediaImageSelect = (imageUrl: string) => {
        setItineraryImages(prev => {
            const dayImages = prev[`${currentItineraryIndex + 1}`] || [];
            return {
                ...prev,
                [`${currentItineraryIndex + 1}`]: [...dayImages, imageUrl]
            };
        });
        setItineraryMediaDialogOpen(false);
        message.success("Archive image selected!");
    };

    const handleItineraryImageUpload = async (dayIndex: number, file: File) => {
        try {
            if (!storage) {
                throw new Error("Firebase Storage is not available");
            }
            setImageLoading(true);

            const webpFile = await convertImageToWebP(file);
            const storageReference = storageRef(storage, `prathaviTravelsMedia/media/${webpFile.name}`);
            await uploadBytes(storageReference, webpFile);
            const downloadURL = await getDownloadURL(storageReference);

            const mediaId = `MID${Date.now()}`;

            await setDoc(doc(db, "media", mediaId), {
                name: webpFile.name,
                image: downloadURL,
                createdAt: serverTimestamp(),
            });

            setItineraryImages(prev => {
                const dayImages = prev[`${dayIndex + 1}`] || [];
                return {
                    ...prev,
                    [`${dayIndex + 1}`]: [...dayImages, downloadURL]
                };
            });

            // Refresh media images
            fetchMediaImages();
            message.success("Itinerary image uploaded successfully");
            return downloadURL;
        } catch (error) {
            console.error("Error saving itinerary image:", error);
            message.error("Failed to save itinerary image");
        } finally {
            setImageLoading(false);
        }
    };

    const handleRemoveItineraryImage = (dayIndex: number, imageUrl: string) => {
        setItineraryImages(prev => {
            const dayImages = prev[`${dayIndex + 1}`] || [];
            return {
                ...prev,
                [`${dayIndex + 1}`]: dayImages.filter(img => img !== imageUrl)
            };
        });
        message.success("Image removed successfully");
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
            setSubmitLoading(true);

            // Process itineraries
            const processedItineraries: { [key: string]: any } = {};
            if (values.itineraries) {
                values.itineraries.forEach((itinerary: any, index: number) => {
                    const dayKey = `Day${index + 1}`;
                    processedItineraries[dayKey] = {
                        title: itinerary.title || `Day ${index + 1}`,
                        description: itineraryEditorContent[`day-${index + 1}`] || itinerary.description || '',
                        imageURL: itineraryImages[`${index + 1}`] || []
                    };
                });
            }

            // Process tags
            const processedTags: { [key: string]: any } = {};
            Object.entries(selectedTags).forEach(([tagId, tagData]) => {
                processedTags[tagId] = tagData;
            });

            const tourId = `TRID${Date.now().toString().slice(-6)}`;

            const tourData = {
                title: values.title || '',
                slug: values.slug || '',
                description: values.description || values.summary || '', 
                categoryDetails: {
                    categoryID: values.categoryID || "",
                    name: values.categoryName || "",
                    slug: values.categorySlug || "",
                    description: values.categoryDescription || "",
                    createdAt: serverTimestamp()
                },
                imageURL: imageUrl || '',
                videoURL: videoUrl || '', // Add video URL to tour data
                isFeatured: values.isFeatured || false,
                isStartDate: values.isStartDate || false,
                isOffered: values.isOffered || false,
                priceShow: values.priceShow || false,
                dos: dosInputs.filter(item => item.trim() !== ''),
                donts: dontsInputs.filter(item => item.trim() !== ''),
                included: {
                    breakfast: values.breakfast || false,
                    lunch: values.lunch || false,
                    dinner: values.dinner || false,
                    hotel: values.hotel || false,
                    flights: values.flights || false,
                    transfers: values.transfers || false,
                    sightseeing: values.sightseeing || false,
                },
                includedMore: includedMoreInputs.filter(item => item.trim() !== ''),
                notIncluded: notIncludedInputs.filter(item => item.trim() !== ''),
                itenaries: processedItineraries,
                location: values.location || "",
                numberofDays: values.numberOfDays || 0,
                numberofNights: values.numberOfNights || 0,
                price: values.price || 0,
                startDate: values.startDate ? values.startDate.toDate() : null,
                status: values.status || "active",
                tags: processedTags,
                tourType: values.tourType || "domestic",
                ...(values.tourType === 'domestic' && values.themeType ? { themeType: values.themeType } : {}),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            // Additional validation to ensure no undefined values
            const cleanedTourData = Object.fromEntries(
                Object.entries(tourData).map(([key, value]) => [
                    key,
                    value === undefined ? '' : value
                ])
            );

            await setDoc(doc(db, "tours", tourId), cleanedTourData);
            message.success("Tour created successfully");
            router.push("/admin/tours");

        } catch (error) {
            console.error("Error saving tour:", error);
            message.error("Failed to save tour");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleAddSelectedTag = (tagId: string, tagData: any) => {
        setSelectedTags(prev => ({
            ...prev,
            [tagId]: tagData
        }));
    };

    const handleRemoveSelectedTag = (tagId: string) => {
        const newSelectedTags = { ...selectedTags };
        delete newSelectedTags[tagId];
        setSelectedTags(newSelectedTags);
    };

    const handleCategoryChange = (value: string | number) => {
        const selectedCategory = categories.find(category => category.id === value);
        if (selectedCategory) {
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

            const newItineraryEditorContent = { ...itineraryEditorContent };
            for (let i = value; i < currentItineraries.length; i++) {
                delete newItineraryEditorContent[`day-${i + 1}`];
            }
            setItineraryEditorContent(newItineraryEditorContent);

            const newItineraryImages = { ...itineraryImages };
            for (let i = value; i < currentItineraries.length; i++) {
                delete newItineraryImages[`${i + 1}`];
            }
            setItineraryImages(newItineraryImages);
        }
    };

    const handleItineraryEditorChange = (content: string, index: number) => {
        setItineraryEditorContent(prev => ({
            ...prev,
            [`day-${index + 1}`]: content
        }));

        const itineraries = form.getFieldValue('itineraries');
        if (itineraries && itineraries[index]) {
            itineraries[index].description = content;
            form.setFieldsValue({ itineraries });
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
                                                    <Form.Item className="mb-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-dark dark:text-white/[.87] font-medium">Start Date</span>
                                                            <Form.Item
                                                                name="isStartDate"
                                                                valuePropName="checked"
                                                                initialValue={false}
                                                                noStyle
                                                            >
                                                                <Switch className="custom-switch" />
                                                            </Form.Item>
                                                        </div>
                                                    </Form.Item>
                                                    <Form.Item name="startDate" className="mb-4">
                                                        <DatePicker
                                                            className="w-full"
                                                            style={{ height: 40 }}
                                                            format="YYYY-MM-DD"
                                                        />
                                                    </Form.Item>
                                                </Col>

                                                <Col span={8}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium mt-1">Status</span>}
                                                        name="status"
                                                        initialValue="active"
                                                        className="mb-4 "
                                                    >
                                                        <Select
                                                            className="w-full custom-select-height mt-1"
                                                            dropdownStyle={{ borderRadius: "2px" }}
                                                            size="large"
                                                        >
                                                            <Option value="active">Active</Option>
                                                            <Option value="inactive">Inactive</Option>
                                                        </Select>
                                                    </Form.Item>
                                                </Col>

                                                <Col span={8}>
                                                    <Form.Item className="mb-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-dark dark:text-white/[.87] font-medium">Price (₹)</span>
                                                            <Form.Item
                                                                name="priceShow"
                                                                valuePropName="checked"
                                                                noStyle
                                                            >
                                                                <Switch className="custom-switch" />
                                                            </Form.Item>
                                                        </div>
                                                    </Form.Item>
                                                    <Form.Item
                                                        name="price"
                                                        rules={[{ required: true, message: 'Please enter tour price' }]}
                                                        className="mb-4"
                                                    >
                                                        <Input
                                                            className="w-full"
                                                            style={{ height: 40, width: '100%' }}
                                                            placeholder="Enter price"
                                                        />
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
                                            </Row>

                                            <Row gutter={24}>
                                                <Col span={8}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Tour Type</span>}
                                                        name="tourType"
                                                        rules={[{ required: true, message: 'Please select tour type!' }]}
                                                        initialValue="domestic"
                                                    >
                                                        <Select
                                                            className="w-full"
                                                            placeholder="Select tour type"
                                                            onChange={handleTourTypeChange}
                                                        >
                                                            <Option value="domestic">Domestic</Option>
                                                            <Option value="international">International</Option>
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <Form.Item label={<span className="text-dark dark:text-white/[.87] font-medium">Do's</span>}>
                                                        <Input
                                                            placeholder="Type a do and press Enter"
                                                            value={doInput}
                                                            onChange={(e) => setDoInput(e.target.value)}
                                                            onKeyPress={handleDoInputKeyPress}
                                                            className="py-2"
                                                        />
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {dosInputs.map((item, index) => (
                                                                <Tag
                                                                    key={index}
                                                                    closable
                                                                    onClose={() => handleDeleteDo(item)}
                                                                    className="m-1 py-1 px-3"
                                                                >
                                                                    {item}
                                                                </Tag>
                                                            ))}
                                                        </div>
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <Form.Item label={<span className="text-dark dark:text-white/[.87] font-medium">Don'ts</span>}>
                                                        <Input
                                                            placeholder="Type a don't and press Enter"
                                                            value={dontInput}
                                                            onChange={(e) => setDontInput(e.target.value)}
                                                            onKeyPress={handleDontInputKeyPress}
                                                            className="py-2"
                                                        />
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {dontsInputs.map((item, index) => (
                                                                <Tag
                                                                    key={index}
                                                                    closable
                                                                    onClose={() => handleDeleteDont(item)}
                                                                    className="m-1 py-1 px-3"
                                                                >
                                                                    {item}
                                                                </Tag>
                                                            ))}
                                                        </div>
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Row gutter={24}>
                                                <Col span={8}>
                                                    <Form.Item label={<span className="text-dark dark:text-white/[.87] font-medium">Additional Included Items</span>}>
                                                        <Input
                                                            placeholder="Type included item and press Enter"
                                                            value={includedInput}
                                                            onChange={(e) => setIncludedInput(e.target.value)}
                                                            onKeyPress={handleIncludedInputKeyPress}
                                                            className="py-2"
                                                        />
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {includedMoreInputs.map((item, index) => (
                                                                <Tag
                                                                    key={index}
                                                                    closable
                                                                    onClose={() => handleDeleteIncluded(item)}
                                                                    className="m-1 py-1 px-3"
                                                                >
                                                                    {item}
                                                                </Tag>
                                                            ))}
                                                        </div>
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <Form.Item label={<span className="text-dark dark:text-white/[.87] font-medium">Not Included Items</span>}>
                                                        <Input
                                                            placeholder="Type not included item and press Enter"
                                                            value={notIncludedInput}
                                                            onChange={(e) => setNotIncludedInput(e.target.value)}
                                                            onKeyPress={handleNotIncludedInputKeyPress}
                                                            className="py-2"
                                                        />
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {notIncludedInputs.map((item, index) => (
                                                                <Tag
                                                                    key={index}
                                                                    closable
                                                                    onClose={() => handleDeleteNotIncluded(item)}
                                                                    className="m-1 py-1 px-3"
                                                                >
                                                                    {item}
                                                                </Tag>
                                                            ))}
                                                        </div>
                                                    </Form.Item>
                                                </Col>
                                                <Col span={4}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Show in Featured</span>}
                                                        name="isFeatured"
                                                        valuePropName="checked"
                                                        initialValue={false}
                                                    >
                                                        <Switch className="custom-switch" />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={4}>
                                                    <Form.Item name="isOffered" valuePropName="checked" label="Show in Grab Offer">
                                                        <Switch className="custom-switch" />
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Row gutter={24}>
                                                <Col span={24}>
                                                    <Form.Item
                                                        label={
                                                            <span className="text-dark dark:text-white/[.87] font-medium">
                                                                Included Services
                                                            </span>
                                                        }
                                                    >
                                                        <Row gutter={50}>
                                                            {[
                                                                'breakfast',
                                                                'lunch',
                                                                'dinner',
                                                                'hotel',
                                                                'flights',
                                                                'transfers',
                                                                'sightseeing'
                                                            ].map((service) => (
                                                                <Col span={3} key={service}>
                                                                    <label className="block text-sm font-medium text-dark dark:text-white/[.87] mb-1 capitalize">
                                                                        {service}
                                                                    </label>
                                                                    <Form.Item name={service} valuePropName="checked" noStyle>
                                                                        <Switch className="custom-switch" />
                                                                    </Form.Item>
                                                                </Col>
                                                            ))}
                                                        </Row>
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

                                                    {/* Hidden Inputs */}
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
                                                {selectedTourType === 'domestic' && (
                                                    <Col span={8}>
                                                        <Form.Item
                                                            label={<span className="text-dark dark:text-white/[.87] font-medium">Theme Type</span>}
                                                            name="themeType"
                                                            rules={[
                                                                {
                                                                    required: selectedTourType === 'domestic',
                                                                    message: 'Please select theme type'
                                                                }
                                                            ]}
                                                        >
                                                            <Select className="w-full" placeholder="Select theme type">
                                                                <Option value="east">East & North East India</Option>
                                                                <Option value="west">Rajasthan, West & Central India</Option>
                                                                <Option value="north">North India</Option>
                                                                <Option value="south">South India</Option>
                                                            </Select>
                                                        </Form.Item>
                                                    </Col>
                                                )}
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
                                                <Col span={6}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Image</span>}
                                                    >
                                                        <div className="space-y-3">
                                                            <div className="flex gap-4 mb-4">
                                                                <Button
                                                                    onClick={() => setMediaDialogOpen(true)}
                                                                    icon={<PictureOutlined />}
                                                                    className="bg-primary text-white hover:bg-primary-hb"
                                                                    size="large"
                                                                >
                                                                    Select Image
                                                                </Button>
                                                            </div>

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
                                                                className="bg-primary hover:bg-primary-hbr "
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
                                                            <div key={key} className="border border-gray-200 p-4 rounded-md mb-4">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <h4 className="font-medium">Day {index + 1}</h4>
                                                                    <Button
                                                                        type="text"
                                                                        onClick={() => remove(name)}
                                                                        icon={<MinusCircleOutlined />}
                                                                        danger
                                                                    />
                                                                </div>
                                                                <Form.Item
                                                                    {...restField}
                                                                    name={[name, 'title']}
                                                                    label="Title"
                                                                    rules={[{ message: 'Please enter day title' }]}
                                                                >
                                                                    <Input placeholder={`Day ${index + 1} title`} />
                                                                </Form.Item>

                                                                <div className="mb-4">
                                                                    <label className="block text-dark dark:text-white/[.87] font-medium mb-2">
                                                                        Description
                                                                    </label>
                                                                    <Editor
                                                                        apiKey="vk693p6lgtcyd2xpc283y9knpg1zphq39p5uqwd5y4coapxo"
                                                                        value={itineraryEditorContent[`day-${index + 1}`] || ''}
                                                                        init={{
                                                                            height: 300,
                                                                            menubar: false,
                                                                            plugins: [
                                                                                'advlist autolink lists link image charmap print preview anchor',
                                                                                'searchreplace visualblocks code fullscreen',
                                                                                'insertdatetime media table paste code help wordcount'
                                                                            ],
                                                                            toolbar: 'undo redo | formatselect | bold italic backcolor | ' +
                                                                                'alignleft aligncenter alignright alignjustify | ' +
                                                                                'bullist numlist outdent indent | removeformat | help'
                                                                        }}
                                                                        onEditorChange={(content) => handleItineraryEditorChange(content, index)}
                                                                    />
                                                                    <Form.Item
                                                                        {...restField}
                                                                        name={[name, 'description']}
                                                                        hidden
                                                                    >
                                                                        <Input />
                                                                    </Form.Item>
                                                                </div>

                                                                <div className="mb-4">
                                                                    <label className="block text-dark dark:text-white/[.87] font-medium mb-2">
                                                                        Images
                                                                    </label>
                                                                    <div className="space-y-3">
                                                                        <div className="flex gap-4 mb-4">
                                                                            <Button
                                                                                onClick={() => {
                                                                                    setCurrentItineraryIndex(index);
                                                                                    setItineraryMediaDialogOpen(true);
                                                                                }}
                                                                                icon={<PictureOutlined />}
                                                                                className="bg-primary text-white hover:bg-primary-hb"
                                                                                size='large'
                                                                            >
                                                                                Select Image
                                                                            </Button>
                                                                        </div>

                                                                        {itineraryImages[`${index + 1}`] && itineraryImages[`${index + 1}`].length > 0 && (
                                                                            <div className="mt-2">
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {itineraryImages[`${index + 1}`].map((imageUrl, imgIndex) => (
                                                                                        <div key={imgIndex} className="relative">
                                                                                            <img
                                                                                                src={imageUrl}
                                                                                                alt={`Day ${index + 1} Image ${imgIndex + 1}`}
                                                                                                className="max-h-32 rounded-md border"
                                                                                            />
                                                                                            <Button
                                                                                                type="text"
                                                                                                size="small"
                                                                                                danger
                                                                                                icon={<MinusCircleOutlined />}
                                                                                                className="absolute top-1 right-1 bg-white rounded-full shadow-md"
                                                                                                onClick={() => handleRemoveItineraryImage(index, imageUrl)}
                                                                                            />
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        <Form.Item>
                                                            <Button
                                                                type="dashed"
                                                                onClick={() => {
                                                                    const currentLength = form.getFieldValue('itineraries')?.length || 0;
                                                                    add({ title: `Day ${currentLength + 1}`, description: '' });
                                                                }}
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
                                                    loading={submitLoading}
                                                    className="px-5 h-10 shadow-none bg-primary hover:bg-primary-hbr"
                                                >
                                                    {submitLoading ? 'Creating...' : 'Create Tour'}
                                                </Button>
                                            </Space>
                                        </div>
                                    </Form>
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row >
            </main >

            {/* Category Dialog */}
            < Modal
                title={
                    < div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700" >
                        <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
                            {"Add New Category"}
                        </span>
                    </div >
                }
                open={categoryDialogOpen}
                onCancel={() => setCategoryDialogOpen(false)}
                footer={
                    < div className="flex justify-end gap-2 pr-6 pb-4" >
                        <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
                        <Button
                            type="primary"
                            onClick={handleAddCategory}
                            loading={categoryLoading}
                        >
                            {categoryLoading ? 'Adding...' : 'Add Category'}
                        </Button>
                    </div >
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
            </Modal >

            {/* Tag Dialog */}
            < Modal
                title={
                    < div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700" >
                        <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
                            Add New Tag
                        </span>
                    </div >
                }
                open={tagDialogOpen}
                onCancel={() => {
                    setTagDialogOpen(false);
                    // Reset form fields when modal is closed
                    setNewTag('');
                    setTagSlug('');
                    setTagDescription('');
                    tagForm.resetFields();
                }}
                footer={
                    < div className="flex justify-end gap-2 pr-6 pb-4" >
                        <Button onClick={() => {
                            setTagDialogOpen(false);
                            setNewTag('');
                            setTagSlug('');
                            setTagDescription('');
                            tagForm.resetFields();
                        }}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            onClick={() => tagForm.submit()}
                            loading={tagLoading}
                        >
                            {tagLoading ? 'Adding...' : 'Add Tag'}
                        </Button>
                    </div >
                }
                width="95%"
                style={{ maxWidth: '500px' }}
                className="responsive-modal"
            >
                <Form
                    form={tagForm}
                    layout="vertical"
                    className='p-3'
                    onFinish={handleAddTag}
                    initialValues={{
                        name: newTag,
                        slug: tagSlug,
                        description: tagDescription
                    }}
                >
                    <Form.Item
                        label={<span className="text-dark dark:text-white/[.87] font-medium">Tag Name</span>}
                        name="name"
                        rules={[
                            { required: true, message: 'Please enter tag name!' },
                            { min: 2, message: 'Tag name must be at least 2 characters!' }
                        ]}
                    >
                        <Input
                            value={newTag}
                            onChange={(e) => {
                                setNewTag(e.target.value);
                                // Auto-generate slug from name
                                const slug = e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]+/g, '-')
                                    .replace(/(^-|-$)/g, '');
                                setTagSlug(slug);
                                tagForm.setFieldsValue({ slug: slug });
                            }}
                            placeholder="Enter tag name"
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span className="text-dark dark:text-white/[.87] font-medium">Slug</span>}
                        name="slug"
                        rules={[
                            { required: true, message: 'Please enter tag slug!' },
                            {
                                pattern: /^[a-z0-9-]+$/,
                                message: 'Slug can only contain lowercase letters, numbers, and hyphens!'
                            }
                        ]}
                        tooltip="The slug is used in the URL. It must be unique and contain only lowercase letters, numbers, and hyphens."
                    >
                        <Input
                            value={tagSlug}
                            onChange={(e) => {
                                const slug = e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9-]/g, '');
                                setTagSlug(slug);
                            }}
                            placeholder="tag-slug"
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span className="text-dark dark:text-white/[.87] font-medium">Description</span>}
                        name="description"
                        rules={[
                            { required: true, message: 'Please enter tag description!' },
                            { min: 10, message: 'Description must be at least 10 characters!' }
                        ]}
                    >
                        <Input.TextArea
                            value={tagDescription}
                            onChange={(e) => setTagDescription(e.target.value)}
                            placeholder="Enter a brief description for this tag"
                            rows={3}
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>
                </Form>
            </Modal >

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

            <Modal
                title={
                    <h3 className="text-lg font-semibold px-4 py-2">
                        Select Itinerary Image
                    </h3>
                }
                open={itineraryMediaDialogOpen}
                onCancel={() => setItineraryMediaDialogOpen(false)}
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
                                    <label htmlFor="modal-itinerary-upload" className="cursor-pointer text-center">
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
                                                        handleItineraryImageUpload(currentItineraryIndex, file).then(() => {
                                                            setItineraryMediaDialogOpen(false);
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
                                        <label htmlFor="modal-itinerary-archive-upload" className="cursor-pointer">
                                            <input
                                                id="modal-itinerary-archive-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleItineraryImageUpload(currentItineraryIndex, file);
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
                                                        onClick={() => handleItineraryMediaImageSelect(media.image)}
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
export default Protected(AddTour, ["admin", "tours", "tours+media"]);