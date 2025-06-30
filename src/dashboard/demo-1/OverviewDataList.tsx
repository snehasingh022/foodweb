import React, { useState, useEffect } from 'react';
import { Row, Col, Spin } from 'antd';
import OverviewCard from '@/components/cards/OverviewCard';
import { collection, getDocs, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../authentication/firebase';
import { useRouter } from 'next/router';

const OverviewDataList = React.memo(( column:any ) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    openBookings: 0,
    closedBookings: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    // Set up real-time listeners
    const unsubscribeAll = onSnapshot(
      query(collection(db, 'bookings'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        updateStats(snapshot.docs);
      },
      (error) => {
        console.error('Error listening to bookings:', error);
        setLoading(false);
        setInitialLoad(false);
      }
    );

    // Cleanup function to unsubscribe when component unmounts
    return () => {
      unsubscribeAll();
    };
  }, []);

  const updateStats = async (allBookingsDocs: any[]) => {
    try {
      let totalRevenue = 0;
      let openBookingsCount = 0;
      let closedBookingsCount = 0;

      allBookingsDocs.forEach(doc => {
        const data = doc.data();
        
        // Count by status
        if (data.status === 'pending' || data.status === 'processing') {
          openBookingsCount++;
        } else if (data.status === 'captured' || data.status === 'completed' || data.status === 'closed') {
          closedBookingsCount++;
        }

        // Calculate revenue (only from completed bookings)
        if (data.status === 'captured' || data.status === 'completed') {
          if (data.tourDetails?.price) {
            totalRevenue += data.tourDetails.price;
          } else if (data.cruiseDetails?.price) {
            totalRevenue += parseFloat(data.cruiseDetails.price) || 0;
          } else if (data.itineraryDetails?.totalCost) {
            totalRevenue += data.itineraryDetails.totalCost;
          }
        }
      });

      setStats({
        totalBookings: allBookingsDocs.length,
        openBookings: openBookingsCount,
        closedBookings: closedBookingsCount,
        totalRevenue: totalRevenue
      });

      // Only set loading to false on initial load
      if (initialLoad) {
        setLoading(false);
        setInitialLoad(false);
      }
    } catch (error) {
      console.error('Error updating stats:', error);
      if (initialLoad) {
        setLoading(false);
        setInitialLoad(false);
      }
    }
  };

  const handleCardClick = (type: string) => {
    router.push('/admin/bookings');
  };

  const overviewData: Array<{
    id: number;
    type: string;
    icon: string;
    label: string;
    total: string;
    suffix: string;
    prefix: string;
    status: string;
    statusRate: string;
    decimal?: number;
    decimals?: number;
    separator?: string;
    dataPeriod: string;
    statusColor: string;
    onClick: () => void;
  }> = [
    {
      id: 1,
      type: "primary",
      icon: "shopping-cart.svg",
      label: "Total Bookings",
      total: stats.totalBookings.toString(),
      suffix: "",
      prefix: "",
      status: "growth",
      statusRate: "0",
      decimal: 0,
      dataPeriod: "All time",
      statusColor: "success",
      onClick: () => handleCardClick('total')
    },
    {
      id: 2,
      type: "warning",
      icon: "briefcase.svg",
      label: "Open Bookings",
      total: stats.openBookings.toString(),
      suffix: "",
      prefix: "",
      status: "down",
      statusRate: "0",
      decimals: 0,
      separator: ",",
      dataPeriod: "Pending/Processing",
      statusColor: "warning",
      onClick: () => handleCardClick('open')
    },
    {
      id: 3,
      type: "success",
      icon: "check-circle.svg",
      label: "Closed Bookings",
      total: stats.closedBookings.toString(),
      suffix: "",
      prefix: "",
      status: "growth",
      statusRate: "0",
      decimals: 0,
      separator: ",",
      dataPeriod: "Completed",
      statusColor: "success",
      onClick: () => handleCardClick('closed')
    },
    {
      id: 4,
      type: "secondary",
      icon: "dollar-circle.svg",
      label: "Total Revenue",
      total: stats.totalRevenue.toLocaleString(),
      suffix: "",
      prefix: "₹",
      status: "growth",
      statusRate: "0",
      decimals: 0,
      separator: ",",
      dataPeriod: "All time",
      statusColor: "success",
      onClick: () => handleCardClick('revenue')
    }
  ];

  if (loading) {
    return (
      <Row gutter={25}>
        {[1, 2, 3, 4].map((item) => (
          <Col className="mb-[25px]" md={12} xs={24} key={item}>
            <div className="bg-white dark:bg-white/10 rounded-10 p-6 h-32 flex items-center justify-center">
              <Spin size="large" />
            </div>
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <Row gutter={25}>
      {overviewData.map((item: any, i: number) => {
        return (
          <Col className="mb-[25px]" md={12} xs={24} key={i}>
            <div 
              onClick={item.onClick}
              style={{ cursor: 'pointer' }}
            >
              <OverviewCard data={item} contentFirst bottomStatus />
            </div>
          </Col>
        );
      })}
    </Row>
  );
});

export default OverviewDataList;
