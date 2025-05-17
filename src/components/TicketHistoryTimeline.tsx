import { Timeline, Typography, Tag, Button } from 'antd';
import { PaperClipOutlined } from '@ant-design/icons';
import { FC } from 'react';

const { Text } = Typography;

// Define types
interface TicketResponse {
    createdAt: string | Date;
    response: string;
    attachmentURL?: string;
}

interface Ticket {
    id: string;
    status: string;
    customerName?: string;
    email?: string;
    phone?: string;
    category: string;
    openMessage?: string;
    createdAt: any;
    updatedAt?: any;
    createdBy?: string;
    priority?: string;
    title?: string;
    description?: string;
    ticketId?: string;
    helpDeskID?: string;
    userDetails?: {
        name: string;
        email: string;
        phone: string;
        uid: string;
        userID: string;
    };
    responses?: {
        opened?: {
            createdAt: any;
            response?: string;
            attachmentURL?: string;
        };
        resolved?: {
            createdAt: any;
            response?: string;
            attachmentURL?: string;
        };
        reopened?: {
            createdAt: any;
            response?: string;
            attachmentURL?: string;
        };
        closed?: {
            createdAt: any;
            response?: string;
            attachmentURL?: string;
        };
    };
}

interface TicketHistoryTimelineProps {
    currentTicket: Ticket;
    formatDate: (date: Date | string) => string;
}

const TicketHistoryTimeline: FC<TicketHistoryTimelineProps> = ({ currentTicket, formatDate }) => {
    const openAttachment = (url: string) => {
        if (url) {
            window.open(url, '_blank');
        }
    };

    const renderAttachmentButton = (attachmentURL?: string) => {
        if (!attachmentURL) return null;

        return (
            <Button
                type="text"
                icon={<PaperClipOutlined />}
                className="text-blue-500 hover:text-blue-700 mt-2"
                onClick={() => openAttachment(attachmentURL)}
            >
                View Attachment
            </Button>
        );
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <p className="text-base font-medium mb-4">Ticket History</p>
            <Timeline>
                <Timeline.Item color="green">
                    <div className="flex flex-col">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                            <Text strong>Ticket Opened</Text>
                            <Tag color="green">OPENED</Tag>
                        </div>
                        <div className="text-xs text-gray-500">
                            {formatDate(currentTicket.createdAt)}
                        </div>
                        <div className="mt-2 bg-white dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                            {currentTicket.openMessage}
                        </div>
                        {renderAttachmentButton(currentTicket.responses?.opened?.attachmentURL)}
                    </div>
                </Timeline.Item>

                {currentTicket.responses?.resolved && (
                    <Timeline.Item color="blue">
                        <div className="flex flex-col">
                            <div className="flex justify-between items-center flex-wrap gap-2">
                                <Text strong>Ticket Resolved</Text>
                                <Tag color="blue">RESOLVED</Tag>
                            </div>
                            <div className="text-xs text-gray-500">
                                {formatDate(currentTicket.responses.resolved.createdAt)}
                            </div>
                            <div className="mt-2 bg-white dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                                {currentTicket.responses.resolved.response}
                            </div>
                            {renderAttachmentButton(currentTicket.responses.resolved.attachmentURL)}
                        </div>
                    </Timeline.Item>
                )}

                {currentTicket.responses?.reopened && (
                    <Timeline.Item color="yellow">
                        <div className="flex flex-col">
                            <div className="flex justify-between items-center flex-wrap gap-2">
                                <Text strong>Ticket Reopened</Text>
                                <Tag color="yellow">REOPENED</Tag>
                            </div>
                            <div className="text-xs text-gray-500">
                                {formatDate(currentTicket.responses.reopened.createdAt)}
                            </div>
                            <div className="mt-2 bg-white dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                                {currentTicket.responses.reopened.response}
                            </div>
                            {renderAttachmentButton(currentTicket.responses.reopened.attachmentURL)}
                        </div>
                    </Timeline.Item>
                )}

                {currentTicket.responses?.closed && (
                    <Timeline.Item color="red">
                        <div className="flex flex-col">
                            <div className="flex justify-between items-center flex-wrap gap-2">
                                <Text strong>Ticket Closed</Text>
                                <Tag color="red">CLOSED</Tag>
                            </div>
                            <div className="text-xs text-gray-500">
                                {formatDate(currentTicket.responses.closed.createdAt)}
                            </div>
                            <div className="mt-2 bg-white dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                                {currentTicket.responses.closed.response}
                            </div>
                            {renderAttachmentButton(currentTicket.responses.closed.attachmentURL)}
                        </div>
                    </Timeline.Item>
                )}
            </Timeline>
        </div>
    );
};

export default TicketHistoryTimeline;
