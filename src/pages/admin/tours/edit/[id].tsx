import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Protected from '../../../../components/Protected/Protected';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../authentication/firebase';
import { Spin, Tour, message } from 'antd';

function EditTour() {
    const router = useRouter();
    const { id } = router.query;
    const [loading, setLoading] = useState(true);
    const [tour, setTour] = useState<any>(null);

    useEffect(() => {
        if (id && typeof id === 'string') {
            fetchTour(id);
        }
    }, [id]);

    const fetchTour = async (tourId: string) => {
        try {
            setLoading(true);
            const tourDoc = await getDoc(doc(db, "tours", tourId));

            if (tourDoc.exists()) {
                setTour({
                    id: tourDoc.id,
                    ...tourDoc.data()
                });
            } else {
                message.error("Tour not found");
                router.push('/admin/tours');
            }
        } catch (error) {
            console.error("Error fetching blog:", error);
            message.error("Failed to fetch blog");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spin size="large" />
            </div>
        );
    }

    if (!tour) {
        return null;
    }

    return (
        <div>
            <h1>Edit Tour: {tour.title}</h1>
            <p>This page will be implemented to edit Tour ID: {id}</p>
            <button onClick={() => router.push('/admin/tours')}>Back to Tours</button>
        </div>
    );
}

export default Protected(EditTour, ["admin"]); 