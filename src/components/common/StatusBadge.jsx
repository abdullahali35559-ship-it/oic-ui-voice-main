import React from 'react';

export const StatusBadge = ({ status }) => {
    const styles = {
        Draft: "bg-amber-50 text-amber-700 border border-amber-200",
        Reviewed: "bg-green-50 text-green-700 border border-green-200",
        Final: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        Active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        Ready: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        Failed: "bg-red-50 text-red-700 border border-red-200",
        Ok: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        "Pending Approval": "bg-amber-50 text-amber-700 border border-amber-200",
        Archived: "bg-gray-50 text-gray-600 border border-gray-200",
        "Not ingested": "bg-gray-50 text-gray-600 border border-gray-200",
        "Needs Review": "bg-amber-50 text-amber-700 border border-amber-200",
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.Draft}`}>
            {status}
        </span>
    );
};
