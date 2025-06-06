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
    UploadOutlined,
    PlusOutlined,
    ArrowLeftOutlined,
    PictureOutlined,
    LoadingOutlined,
    FileImageOutlined,
    CloudUploadOutlined,
    MinusCircleOutlined,
    VideoCameraOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { PageHeaders } from '../../../../components/page-headers/index';
import { listAll, ref as storageRef } from "firebase/storage"
import { convertImageToWebP } from '@/components/imageConverter';
import {
    collection,
    getDocs,
    query,
    orderBy,
    serverTimestamp,
    setDoc,
    doc,
    getDoc,
    updateDoc
} from 'firebase/firestore';
import { db } from '../../../../authentication/firebase';
import { getDownloadURL, uploadBytes } from 'firebase/storage';
import Protected from '../../../../components/Protected/Protected';
import { useRouter } from 'next/router';
import moment from 'moment';
import { storage } from '@/lib/firebase-secondary';

const { Option } = Select;

function EditTour() {
    const router = useRouter();
    const { id } = router.query;
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    const [selectedTags, setSelectedTags] = useState<{ [key: string]: any }>({});
    const [imageLoading, setImageLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [editorContent, setEditorContent] = useState('');
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [categorySlug, setCategorySlug] = useState('');
    const [categoryDescription, setCategoryDescription] = useState('');
    const [tagDialogOpen, setTagDialogOpen] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [tagSlug, setTagSlug] = useState('');
    const [tagDescription, setTagDescription] = useState('');
    const [itineraryImages, setItineraryImages] = useState<{ [key: string]: string[] }>({});
    const [tourData, setTourData] = useState<any>(null);
    const [archiveImages, setArchiveImages] = useState<any[]>([]);
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [tagLoading, setTagLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('upload');
    const [archiveMediaImages, setArchiveMediaImages] = useState<any[]>([]);
    const [currentImageType, setCurrentImageType] = useState('');
    const [currentItineraryDay, setCurrentItineraryDay] = useState('');
    const [archiveOrUpload, setArchiveOrUpload] = useState<'upload' | 'archive'>('upload');
    const [dosInputs, setDosInputs] = useState<string[]>([]);
    const [dontsInputs, setDontsInputs] = useState<string[]>([]);
    const [includedMoreInputs, setIncludedMoreInputs] = useState<string[]>([]);
    const [notIncludedInputs, setNotIncludedInputs] = useState<string[]>([]);
    const [doInput, setDoInput] = useState('');
    const [dontInput, setDontInput] = useState('');
    const [includedInput, setIncludedInput] = useState('');
    const [notIncludedInput, setNotIncludedInput] = useState('');
    const [tourType, setTourType] = useState('domestic');

    // Video upload states
    const [videoLoading, setVideoLoading] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const [videoFileName, setVideoFileName] = useState('');

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

    const themeTypeOptions = [
        { value: 'east', label: 'East' },
        { value: 'west', label: 'West' },
        { value: 'north', label: 'North' },
        { value: 'south', label: 'South' },
        { value: 'centre', label: 'Centre' },
    ];

    useEffect(() => {
        if (typeof window !== "undefined" && id) {
            fetchTourData();
            fetchCategories();
            fetchTags();
            fetchMediaImages();
        }
    }, [id]);

    useEffect(() => {
        setCategorySlug(newCategory.toLowerCase().replace(/ /g, '-'));
    }, [newCategory]);

    useEffect(() => {
        setTagSlug(newTag.toLowerCase().replace(/ /g, '-'));
    }, [newTag]);

    useEffect(() => {
        if (tourData) {
            setTourType(tourData.tourType || 'domestic');

            setTimeout(() => {
                form.setFieldsValue({
                    title: tourData.title || "",
                    slug: tourData.slug || "",
                    location: tourData.location || "",
                    numberOfDays: tourData.numberofDays || tourData.numberOfDays || 0,
                    numberOfNights: tourData.numberofNights || tourData.numberOfNights || 0,
                    price: tourData.price || 0,
                    priceShow: tourData.priceShow || false,
                    tourType: tourData.tourType || "domestic",
                    themeType: tourData.themeType || "",
                    flightIncluded: tourData.flightIncluded || false,
                    isFeatured: tourData.isFeatured || false,
                    isOffered: tourData.isOffered || false,
                    isStartDate: tourData.isStartDate || false,
                    status: tourData.status || "active",
                    categoryID: tourData.categoryDetails?.categoryID || "",
                    startDate: tourData.startDate ? moment(tourData.startDate.toDate()) : null,
                    summary: tourData.description || tourData.summary || "",
                    breakfast: tourData.included?.breakfast || false,
                    lunch: tourData.included?.lunch || false,
                    dinner: tourData.included?.dinner || false,
                    hotel: tourData.included?.hotel || false,
                    flights: tourData.included?.flights || false,
                    transfers: tourData.included?.transfers || false,
                    sightseeing: tourData.included?.sightseeing || false,
                    videoURL: tourData.videoURL || "",
                });
            }, 100);
        }
    }, [tourData, form]);

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

    const handleRemoveVideo = () => {
        setVideoUrl('');
        setVideoFileName('');
        form.setFieldsValue({ videoURL: '' });
        message.success("Video removed successfully!");
    };

    const handleDoInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && doInput.trim()) {
            setDosInputs([...dosInputs, doInput.trim()]);
            setDoInput('');
        }
    };

    const handleDontInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && dontInput.trim()) {
            setDontsInputs([...dontsInputs, dontInput.trim()]);
            setDontInput('');
        }
    };

    const handleIncludedInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && includedInput.trim()) {
            setIncludedMoreInputs([...includedMoreInputs, includedInput.trim()]);
            setIncludedInput('');
        }
    };

    const handleNotIncludedInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && notIncludedInput.trim()) {
            setNotIncludedInputs([...notIncludedInputs, notIncludedInput.trim()]);
            setNotIncludedInput('');
        }
    };

    const handleDeleteDo = (itemToDelete: string) => {
        setDosInputs(dosInputs.filter(item => item !== itemToDelete));
    };

    const handleDeleteDont = (itemToDelete: string) => {
        setDontsInputs(dontsInputs.filter(item => item !== itemToDelete));
    };

    const handleDeleteIncluded = (itemToDelete: string) => {
        setIncludedMoreInputs(includedMoreInputs.filter(item => item !== itemToDelete));
    };

    const handleDeleteNotIncluded = (itemToDelete: string) => {
        setNotIncludedInputs(notIncludedInputs.filter(item => item !== itemToDelete));
    };

    const handleTourTypeChange = (value: string) => {
        setTourType(value);
        if (value === 'international') {
            form.setFieldsValue({ themeType: undefined });
        }
    };

    const fetchTourData = async () => {
        try {
            setLoading(true);
            const tourDocRef = doc(db, "tours", id as string);
            const tourSnapshot = await getDoc(tourDocRef);

            if (tourSnapshot.exists()) {
                const data = tourSnapshot.data();
                console.log("Tour data:", data);
                setTourData(data);

                form.setFieldsValue({
                    title: data.title || "",
                    slug: data.slug || "",
                    location: data.location || "",
                    numberOfDays: data.numberofDays || data.numberOfDays || 0,
                    numberOfNights: data.numberofNights || data.numberOfNights || 0,
                    price: data.price || 0,
                    priceShow: data.priceShow || false,
                    tourType: data.tourType || "domestic",
                    themeType: data.themeType || "",
                    flightIncluded: data.flightIncluded || false,
                    isFeatured: data.isFeatured || false,
                    isOffered: data.isOffered || false,
                    isStartDate: data.isStartDate || false,
                    status: data.status || "active",
                    categoryID: data.categoryDetails?.categoryID || "",
                    categoryName: data.categoryDetails?.name || "",
                    categorySlug: data.categoryDetails?.slug || "",
                    categoryDescription: data.categoryDetails?.description || "",
                    startDate: data.startDate ? moment(data.startDate.toDate()) : null,
                    summary: data.description || data.summary || "",
                    breakfast: data.included?.breakfast || false,
                    lunch: data.included?.lunch || false,
                    dinner: data.included?.dinner || false,
                    hotel: data.included?.hotel || false,
                    flights: data.included?.flights || false,
                    transfers: data.included?.transfers || false,
                    sightseeing: data.included?.sightseeing || false,
                    videoURL: data.videoURL || "",
                });

                // Set video URL if exists
                if (data.videoURL) {
                    setVideoUrl(data.videoURL);
                }

                console.log("dos data:", data.dos);
                console.log("donts data:", data.donts);
                console.log("includedMore data:", data.includedMore);
                console.log("notIncluded data:", data.notIncluded);

                if (data.dos && Array.isArray(data.dos)) {
                    setDosInputs(data.dos);
                } else if (data.dos) {
                    setDosInputs(Object.values(data.dos));
                } else {
                    setDosInputs([]);
                }

                if (data.donts && Array.isArray(data.donts)) {
                    setDontsInputs(data.donts);
                } else if (data.donts) {
                    setDontsInputs(Object.values(data.donts));
                } else {
                    setDontsInputs([]);
                }

                if (data.includedMore && Array.isArray(data.includedMore)) {
                    setIncludedMoreInputs(data.includedMore);
                } else if (data.includedMore) {
                    setIncludedMoreInputs(Object.values(data.includedMore));
                } else {
                    setIncludedMoreInputs([]);
                }

                if (data.notIncluded && Array.isArray(data.notIncluded)) {
                    setNotIncludedInputs(data.notIncluded);
                } else if (data.notIncluded) {
                    setNotIncludedInputs(Object.values(data.notIncluded));
                } else {
                    setNotIncludedInputs([]);
                }

                let itinerariesArray = [];
                if (data.itineraries && Array.isArray(data.itineraries)) {
                    itinerariesArray = data.itineraries;
                    data.itineraries.forEach((itinerary, index) => {
                        if (itinerary.imageURL) {
                            setItineraryImages(prev => ({
                                ...prev,
                                [`${index + 1}`]: Array.isArray(itinerary.imageURL) ? itinerary.imageURL : [itinerary.imageURL]
                            }));
                        }
                    });
                } else if (data.itenaries) {
                    for (let i = 1; i <= Object.keys(data.itenaries).length; i++) {
                        const dayKey = `Day${i}`;
                        if (data.itenaries[dayKey]) {
                            itinerariesArray.push({
                                title: data.itenaries[dayKey].title || `Day ${i}`,
                                description: data.itenaries[dayKey].description || ""
                            });

                            if (data.itenaries[dayKey].imageURL) {
                                setItineraryImages(prev => ({
                                    ...prev,
                                    [`${i}`]: Array.isArray(data.itenaries[dayKey].imageURL)
                                        ? data.itenaries[dayKey].imageURL
                                        : [data.itenaries[dayKey].imageURL]
                                }));
                            }
                        }
                    }
                }
                form.setFieldsValue({ itineraries: itinerariesArray });

                if (data.tags) {
                    setSelectedTags(data.tags);
                }

                if (data.imageURL) {
                    setImageUrl(data.imageURL);
                }

                if (data.description) {
                    setEditorContent(data.description);
                } else if (data.summary) {
                    setEditorContent(data.summary);
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

    const fetchMediaImages = async () => {
        try {
            const q = query(collection(db, "media"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const mediaData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setArchiveMediaImages(mediaData);
        } catch (error) {
            console.error("Error fetching media images:", error);
            message.error("Failed to fetch media images");
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

            if (currentImageType === 'featured') {
                setImageUrl(downloadURL);
            } else if (currentImageType === 'itinerary') {
                setItineraryImages(prev => {
                    const dayImages = prev[currentItineraryDay] || [];
                    return {
                        ...prev,
                        [currentItineraryDay]: [...dayImages, downloadURL]
                    };
                });
            }

            fetchMediaImages();
            message.success("Image uploaded successfully!");

            return downloadURL;
        } catch (error) {
            console.error("Error uploading image:", error);
            message.error("Failed to upload image");
        } finally {
            setImageLoading(false);
        }
    };

    const handleMediaImageSelect = (imageUrl: string) => {
        if (currentImageType === 'featured') {
            setImageUrl(imageUrl);
        } else if (currentImageType === 'itinerary') {
            setItineraryImages(prev => {
                const dayImages = prev[currentItineraryDay] || [];
                return {
                    ...prev,
                    [currentItineraryDay]: [...dayImages, imageUrl]
                };
            });
        }
        setMediaDialogOpen(false);
        message.success("Image selected successfully!");
    };

    const openMediaDialog = (type: string, day?: string) => {
        setCurrentImageType(type);
        if (day) {
            setCurrentItineraryDay(day);
        }
        setActiveTab('upload');
        setMediaDialogOpen(true);
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

    const handleAddTag = async () => {
        if (typeof window === "undefined" || newTag.trim() === "") return;

        try {
            setTagLoading(true);
            const tagId = `TID${Date.now().toString().slice(-6)}`;

            const tagsRef = collection(db, "tags");
            const docRef = await setDoc(doc(db, "tags", tagId), {
                name: newTag,
                slug: tagSlug,
                description: tagDescription,
                createdAt: serverTimestamp(),
            });

            const newTagData = {
                id: tagId,
                name: newTag,
                slug: tagSlug,
                description: tagDescription,
            };

            setTags([...tags, newTagData]);

            setSelectedTags(prev => ({
                ...prev,
                [tagId]: {
                    name: newTag,
                    slug: tagSlug,
                    description: tagDescription
                }
            }));

            setNewTag("");
            setTagSlug("");
            setTagDescription("");
            setTagDialogOpen(false);
            message.success("Tag added and selected successfully!");
        } catch (error) {
            console.error("Error adding tag:", error);
            message.error("Error adding tag. Please try again.");
        } finally {
            setTagLoading(false);
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
            setUpdateLoading(true);

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

            const processedTags: { [key: string]: any } = {};
            Object.entries(selectedTags).forEach(([tagId, tagData]) => {
                processedTags[tagId] = tagData;
            });

            const updatedTourData = {
                title: values.title,
                slug: values.slug,
                description: editorContent.replace(/<\/?[^>]+(>|$)/g, ""),
                categoryDetails: {
                    categoryID: values.categoryID || "",
                    name: values.categoryName || "",
                    slug: values.categorySlug || "",
                    description: values.categoryDescription || "",
                    createdAt: tourData.categoryDetails?.createdAt || serverTimestamp()
                },
                imageURL: imageUrl,
                videoURL: values.videoURL || videoUrl || "",
                isFeatured: values.isFeatured || false,
                isOffered: values.isOffered || false,
                isStartDate: values.isStartDate || false,
                itenaries: processedItineraries,
                location: values.location || "",
                numberofDays: values.numberOfDays || 0,
                numberofNights: values.numberOfNights || 0,
                price: values.price || 0,
                priceShow: values.priceShow || false,
                startDate: values.startDate ? values.startDate.toDate() : null,
                status: values.status || "active",
                tags: processedTags,
                tourType: values.tourType || "domestic",
                themeType: values.tourType === "domestic" ? values.themeType || "" : "", // Only save themeType for domestic tours
                flightIncluded: values.flightIncluded || false,
                // Add the new fields
                dos: dosInputs,
                donts: dontsInputs,
                includedMore: includedMoreInputs,
                notIncluded: notIncludedInputs,
                included: {
                    breakfast: values.breakfast || false,
                    lunch: values.lunch || false,
                    dinner: values.dinner || false,
                    hotel: values.hotel || false,
                    flights: values.flights || false,
                    transfers: values.transfers || false,
                    sightseeing: values.sightseeing || false,
                },
                updatedAt: serverTimestamp(),
                createdAt: tourData.createdAt || serverTimestamp(),
            };

            const tourDocRef = doc(db, "tours", id as string);
            await updateDoc(tourDocRef, updatedTourData);

            message.success("Tour updated successfully");
            router.push("/admin/tours");

        } catch (error) {
            console.error("Error updating tour:", error);
            message.error("Failed to update tour");
        } finally {
            setUpdateLoading(false);
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
                                                        <InputNumber
                                                            className="w-full"
                                                            style={{ height: 40, width: '100%' }}
                                                            min={0}
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
                                                        initialValue="domestic"
                                                    >
                                                        <Select
                                                            className="w-full"
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
                                                {tourType === 'domestic' && (
                                                    <Col span={8}>
                                                        <Form.Item
                                                            label={<span className="text-dark dark:text-white/[.87] font-medium">Theme Type</span>}
                                                            name="themeType"
                                                            rules={[
                                                                {
                                                                    required: tourType === 'domestic',
                                                                    message: 'Please select theme type'
                                                                }
                                                            ]}
                                                        >
                                                            <Select
                                                                className="w-full"
                                                                placeholder="Select theme type"
                                                                allowClear
                                                            >
                                                                <Option value="east">East</Option>
                                                                <Option value="west">West</Option>
                                                                <Option value="north">North</Option>
                                                                <Option value="south">South</Option>
                                                                <Option value="centre">Centre</Option>
                                                            </Select>
                                                        </Form.Item>
                                                    </Col>
                                                )}
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
                                                        dropdownStyle={{ borderRadius: "6px" }}
                                                        value={undefined}
                                                        onChange={(value) => {
                                                            if (typeof value === 'string') {
                                                                const selectedTag = tags.find(tag => tag.id === value);
                                                                if (selectedTag) {
                                                                    handleAddSelectedTag(value, {
                                                                        name: selectedTag.name,
                                                                        slug: selectedTag.slug,
                                                                        description: selectedTag.description
                                                                    });
                                                                }
                                                            }
                                                        }}

                                                    >
                                                        {tags
                                                            .filter(tag => !selectedTags[tag.id]) // Only show unselected tags
                                                            .map(tag => (
                                                                <Select.Option key={tag.id} value={tag.id}>
                                                                    {tag.name}
                                                                </Select.Option>
                                                            ))}
                                                    </Select>
                                                </Col>
                                            </Row>
                                        </div>

                                        <div className="mb-8">
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

                                            <Row gutter={24}>
                                                <Col span={6}>
                                                    <Form.Item label={<span className="text-dark dark:text-white/[.87] font-medium">Image</span>}>
                                                        <div className="space-y-3">
                                                            <Button
                                                                onClick={() => openMediaDialog('featured')}
                                                                icon={<UploadOutlined />}
                                                                className="bg-primary text-white hover:bg-primary-hb"
                                                                loading={imageLoading}
                                                                size='large'
                                                            >
                                                                {imageLoading ? 'Processing...' : 'Upload Image'}
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
                                                        name="videoURL"
                                                    >
                                                        <Upload
                                                            name="video"
                                                            accept="video/*"
                                                            showUploadList={false}
                                                            beforeUpload={(file) => {
                                                                const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv'];
                                                                if (!validTypes.includes(file.type)) {
                                                                    message.error('Invalid video format');
                                                                    return false;
                                                                }
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

                                                                            <Button
                                                                                onClick={() => openMediaDialog('itinerary', `${name + 1}`)}
                                                                                icon={<UploadOutlined />}
                                                                                loading={imageLoading}
                                                                                className="bg-primary text-white hover:bg-primary-hb mb-4"
                                                                            >
                                                                                {imageLoading ? 'Processing...' : 'Upload Image'}
                                                                            </Button>

                                                                            {itineraryImages[`${name + 1}`] && itineraryImages[`${name + 1}`].length > 0 && (
                                                                                <div className="mt-2">
                                                                                    <div className="flex flex-wrap gap-2">
                                                                                        {itineraryImages[`${name + 1}`].map((imageUrl, index) => (
                                                                                            <div key={index} className="relative">
                                                                                                <img
                                                                                                    src={imageUrl}
                                                                                                    alt={`Day ${name + 1} Image ${index + 1}`}
                                                                                                    className="max-h-32 w-auto rounded-md border object-cover"
                                                                                                />
                                                                                                <Button
                                                                                                    type="text"
                                                                                                    size="small"
                                                                                                    danger
                                                                                                    icon={<MinusCircleOutlined />}
                                                                                                    className="absolute top-1 right-1 bg-white rounded-full shadow-md"
                                                                                                    onClick={() => {
                                                                                                        const updatedImages = [...(itineraryImages[`${name + 1}`] || [])];
                                                                                                        updatedImages.splice(index, 1);
                                                                                                        setItineraryImages({
                                                                                                            ...itineraryImages,
                                                                                                            [`${name + 1}`]: updatedImages
                                                                                                        });
                                                                                                    }}
                                                                                                />
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}


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
                                                    loading={updateLoading}
                                                >
                                                    {updateLoading ? 'Updating...' : 'Update Tour'}
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
                        <Button onClick={() => setCategoryDialogOpen(false)} disabled={categoryLoading}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleAddCategory}
                            disabled={!newCategory.trim()}
                            loading={categoryLoading}
                        >
                            {categoryLoading ? 'Adding...' : 'Add Category'}
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
                        <Button onClick={() => setTagDialogOpen(false)} disabled={tagLoading}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleAddTag}
                            disabled={!newTag.trim()}
                            loading={tagLoading}
                        >
                            {tagLoading ? 'Adding...' : 'Add Tag'}
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
                    <Form.Item label="Slug" className="p-2">
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
    );
}

export default Protected(EditTour, ["admin", "tours", "tours+media"]);
