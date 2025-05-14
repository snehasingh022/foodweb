import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Protected from '../../../../components/Protected/Protected';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../authentication/firebase';
import { Spin, Tour, message } from 'antd';

function EditCruise() {
    const router = useRouter();
    const { id } = router.query;
    const [loading, setLoading] = useState(true);
    const [cruise, setCruise] = useState<any>(null);

    useEffect(() => {
        if (id && typeof id === 'string') {
            fetchCruise(id);
        }
    }, [id]);

    const fetchCruise = async (cruiseId: string) => {
        try {
            setLoading(true);
            const cruiseDoc = await getDoc(doc(db, "cruises", cruiseId));

            if (cruiseDoc.exists()) {
                setCruise({
                    id: cruiseDoc.id,
                    ...cruiseDoc.data()
                });
            } else {
                message.error("Cruise not found");
                router.push('/admin/cruises');
            }
        } catch (error) {
            console.error("Error fetching cruise:", error);
            message.error("Failed to fetch cruise");
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

    if (!cruise) {
        return null;
    }

    return (
        <div>
            <h1>Edit Cruise: {cruise.title}</h1>
            <p>This page will be implemented to edit Cruise ID: {id}</p>
            <button onClick={() => router.push('/admin/cruises')}>Back to Cruises</button>
        </div>
    );
}

export default Protected(EditCruise, ["admin"]); 