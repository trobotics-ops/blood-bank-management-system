import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  AlertTriangle,
  FileText,
  Calendar,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiGet, apiPatch } from '../../services/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatRelativeTime, cn } from '../../lib/utils';

const NOTIFICATION_ICONS = {
  general: Bell,
  expiry_alert: AlertTriangle,
  request_update: FileText,
  camp_reminder: Calendar,
  low_stock: Package,
};

const NOTIFICATION_ICON_COLORS = {
  general: 'text-blue-500 bg-blue-50',
  expiry_alert: 'text-red-500 bg-red-50',
  request_update: 'text-purple-500 bg-purple-50',
  camp_reminder: 'text-green-500 bg-green-50',
  low_stock: 'text-orange-500 bg-orange-50',
};

function getNotificationIcon(type) {
  return NOTIFICATION_ICONS[type] || Bell;
}

function getNotificationIconColor(type) {
  return NOTIFICATION_ICON_COLORS[type] || 'text-blue-500 bg-blue-50';
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet('/api/notifications');
      setNotifications(data);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await apiPatch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAllRead(true);
      await apiPatch('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAllRead(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filteredNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading notifications..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted text-sm mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'You're all caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markingAllRead}
            className="flex items-center gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            {markingAllRead ? 'Marking...' : 'Mark all as read'}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-1.5">
            <Bell className="h-4 w-4" />
            All
            {notifications.length > 0 && (
              <span className="ml-1 text-xs text-muted">({notifications.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" className="flex items-center gap-1.5">
            <BellOff className="h-4 w-4" />
            Unread
            {unreadCount > 0 && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-1.5 py-0.5">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredNotifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={activeTab === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
              description={
                activeTab === 'unread'
                  ? "You've read all your notifications."
                  : "You don't have any notifications yet."
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                const iconColor = getNotificationIconColor(notification.type);

                return (
                  <Card
                    key={notification.id}
                    className={cn(
                      'transition-colors hover:bg-accent/50',
                      !notification.isRead && 'border-l-4 border-l-primary bg-primary/5'
                    )}
                  >
                    <CardContent className="flex items-start gap-4 p-4">
                      {/* Icon */}
                      <div
                        className={cn(
                          'flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full',
                          iconColor
                        )}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p
                              className={cn(
                                'text-sm',
                                !notification.isRead
                                  ? 'font-semibold text-foreground'
                                  : 'font-medium text-foreground'
                              )}
                            >
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted mt-1.5">
                              {formatRelativeTime(notification.createdAt)}
                            </p>
                          </div>

                          {/* Unread indicator + action */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.isRead && (
                              <>
                                <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="h-8 w-8 p-0"
                                  title="Mark as read"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
