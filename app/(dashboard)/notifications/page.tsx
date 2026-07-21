"use client";

import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { EnterprisePageHeader } from "../../../src/components/layout/EnterprisePageHeader";
import { useAuth } from "../../../src/hooks/useAuth";
import Link from "next/link";

export default function NotificationsPage() {
  const { user } = useAuth();
  const notifications = useQuery(
    api.notifications.listUserNotifications,
    user?._id ? { userId: user._id as any } : "skip"
  ) || [];

  const markReadMut = useMutation(api.notifications.markNotificationRead);
  const markAllReadMut = useMutation(api.notifications.markAllRead);

  const handleMarkRead = async (id: string) => {
    try {
      await markReadMut({ notificationId: id as any });
    } catch (e) {
      console.log("Mark read error:", e);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await markAllReadMut({ userId: user._id as any });
    } catch (e) {
      console.log("Mark all read error:", e);
    }
  };

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <div>
      <EnterprisePageHeader
        title="Real-Time System Notifications Center"
        subtitle="Stay updated on submission approvals, manager reviews, system alerts, and security notifications"
        breadcrumbs={[{ label: "Notifications" }]}
        actions={
          unreadCount > 0 && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={handleMarkAllRead}
            >
              <i className="bi bi-check2-all me-1"></i> MARK ALL AS READ
            </button>
          )
        }
      />

      <div className="card card-erp mb-4">
        <div className="card-header py-2 d-flex justify-content-between align-items-center">
          <span><i className="bi bi-bell me-2"></i>YOUR NOTIFICATIONS ({notifications.length} Total)</span>
          {unreadCount > 0 && (
            <span className="badge bg-danger rounded-0">{unreadCount} UNREAD</span>
          )}
        </div>

        <div className="card-body p-0">
          <div className="list-group list-group-flush rounded-0">
            {notifications.length > 0 ? (
              notifications.map((n: any) => (
                <div
                  key={n._id}
                  className={`list-group-item p-3 ${!n.isRead ? "bg-light border-start border-3 border-danger" : ""}`}
                >
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h6 className="fw-bold text-dark mb-0">
                      {!n.isRead && <span className="badge bg-danger me-2">NEW</span>}
                      {n.title}
                    </h6>
                    <small className="text-muted">{new Date(n.createdAt).toLocaleString()}</small>
                  </div>
                  <p className="small text-muted mb-2">{n.message}</p>
                  <div className="d-flex justify-content-between align-items-center">
                    {n.link ? (
                      <Link href={n.link} className="btn btn-erp-primary btn-sm py-0 px-2 text-decoration-none">
                        View Related Module
                      </Link>
                    ) : (
                      <span></span>
                    )}

                    {!n.isRead && (
                      <button
                        type="button"
                        className="btn btn-link btn-sm text-secondary p-0 text-decoration-none"
                        onClick={() => handleMarkRead(n._id)}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted py-5">
                <i className="bi bi-bell-slash fs-2 text-secondary d-block mb-2"></i>
                No notification alerts found for your account.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
