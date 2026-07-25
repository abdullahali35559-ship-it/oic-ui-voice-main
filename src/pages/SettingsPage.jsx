import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../components/common/StatusBadge';

export const SettingsPage = ({
    users = [],
    setUsers,
    activityLog = [],
    setActivityLog
}) => {
    const [isTtsEnabled, setIsTtsEnabled] = useState(() => localStorage.getItem('voice_tts_enabled') !== 'false');
    const [toast, setToast] = useState(null);

    // Password change states
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    // Add user states
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserPassword, setNewUserPassword] = useState("");
    const [newUserRole, setNewUserRole] = useState("OIC User");

    useEffect(() => {
        const handleCommand = (e) => {
            if (e.detail && e.detail.action === 'open_add_user') {
                setShowAddUserModal(true);
            }
        };
        window.addEventListener('settings-command', handleCommand);
        return () => window.removeEventListener('settings-command', handleCommand);
    }, []);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleSaveTts = () => {
        localStorage.setItem('voice_tts_enabled', isTtsEnabled.toString());
        showToast("Voice Assistant settings saved successfully!");
    };

    const handleUpdatePassword = (e) => {
        e.preventDefault();
        if (!currentPassword) {
            showToast("Please enter your current password.");
            return;
        }

        // Validate new password rules
        const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
        const digitRegex = /[0-9]/;
        const upperRegex = /[A-Z]/;
        const lowerRegex = /[a-z]/;

        if (newPassword.length < 12) {
            showToast("New password must be at least 12 characters long.");
            return;
        }
        if (!digitRegex.test(newPassword) || !specialCharRegex.test(newPassword) || !upperRegex.test(newPassword) || !lowerRegex.test(newPassword)) {
            showToast("Password must contain uppercase, lowercase, digit, and special characters.");
            return;
        }
        if (newPassword !== confirmNewPassword) {
            showToast("Passwords do not match.");
            return;
        }

        // Add to log
        const logEntry = {
            time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ", " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            user: "admin@oic.org",
            action: "auth · password updated",
            details: "—"
        };
        setActivityLog(prev => [logEntry, ...prev]);

        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        showToast("Your password was updated successfully.");
    };

    const handleAddUser = () => {
        const email = newUserEmail.trim();
        if (!email || !email.includes('@')) {
            showToast("Please enter a valid email address.");
            return;
        }

        const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
        if (userExists) {
            showToast("User with this email already exists.");
            return;
        }

        const newU = {
            email,
            role: newUserRole,
            status: "Active",
            created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            isYou: false
        };

        setUsers(prev => [...prev, newU]);
        setShowAddUserModal(false);
        setNewUserEmail("");
        setNewUserPassword("");
        
        // Add log
        const logEntry = {
            time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ", " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            user: "admin@oic.org",
            action: "auth · user created",
            details: `user: ${email} · role: ${newUserRole}`
        };
        setActivityLog(prev => [logEntry, ...prev]);
        
        showToast(`User ${email} created successfully.`);
    };

    const handleResetPassword = (user) => {
        showToast(`Password reset link sent to ${user.email}.`);
        
        const logEntry = {
            time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ", " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            user: "admin@oic.org",
            action: "auth · user reset link sent",
            details: `target: ${user.email}`
        };
        setActivityLog(prev => [logEntry, ...prev]);
    };

    const handleToggleStatus = (user) => {
        const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
        
        setUsers(prev => prev.map(u => {
            if (u.email === user.email) {
                return { ...u, status: nextStatus };
            }
            return u;
        }));

        const logEntry = {
            time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ", " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            user: "admin@oic.org",
            action: nextStatus === 'Inactive' ? "auth · user deactivated" : "auth · user activated",
            details: `target: ${user.email}`
        };
        setActivityLog(prev => [logEntry, ...prev]);

        showToast(`User status for ${user.email} updated to ${nextStatus}.`);
    };

    const handleDeleteUser = (user) => {
        if (user.isYou) {
            showToast("You cannot delete your own admin account.");
            return;
        }
        setUsers(prev => prev.filter(u => u.email !== user.email));
        
        const logEntry = {
            time: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ", " + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            user: "admin@oic.org",
            action: "auth · user deleted",
            details: `target: ${user.email}`
        };
        setActivityLog(prev => [logEntry, ...prev]);

        showToast(`User ${user.email} deleted successfully.`);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6 relative text-sm">
            {toast && (
                <div className="fixed top-4 right-4 z-50 bg-[#1a4731] text-white px-4 py-3 rounded-xl shadow-2xl border border-white/20 text-sm font-medium animate-slideIn">
                    {toast}
                </div>
            )}

            {/* Voice Settings */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Voice Assistant Settings</h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="tts-toggle"
                            checked={isTtsEnabled} 
                            onChange={(e) => setIsTtsEnabled(e.target.checked)} 
                            className="rounded text-[#1a4731] focus:ring-[#1a4731] border-gray-300 w-4 h-4 cursor-pointer" 
                        />
                        <label htmlFor="tts-toggle" className="text-sm text-gray-700 font-medium cursor-pointer">Enable Voice Text-to-Speech Feedback (Read replies aloud)</label>
                    </div>
                    <p className="text-xs text-gray-505">API configuration has been hardcoded for security. You can toggle text-to-speech voice replies on or off above.</p>
                    <button onClick={handleSaveTts} className="px-5 py-2.5 bg-[#1a4731] text-white rounded-lg text-sm font-medium hover:bg-[#153d28] transition-colors">Save Settings</button>
                </div>
            </div>

            {/* Profile */}
            <div className="glass-card p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <div>
                        <label className="block text-xs text-gray-505 mb-1 font-semibold uppercase tracking-wider">Email</label>
                        <div className="text-sm font-medium text-gray-900">admin@oic.org</div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-505 mb-1 font-semibold uppercase tracking-wider">Role</label>
                        <div className="text-sm font-medium text-gray-900">OIC Admin</div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-505 mb-1 font-semibold uppercase tracking-wider">Member since</label>
                        <div className="text-sm font-medium text-gray-900">Jun 17, 2026</div>
                    </div>
                </div>
            </div>

            {/* Password Form */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Change password</h3>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-750 mb-2">Current password</label>
                        <input 
                            type="password" 
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            id="current-password"
                            name="current-password"
                            aria-label="current password"
                            className="w-full px-3 py-2.5 glass-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4731]" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-750 mb-2">New password</label>
                        <input 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            id="new-password"
                            name="new-password"
                            aria-label="new password"
                            className="w-full px-3 py-2.5 glass-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4731]" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-750 mb-2">Confirm new password</label>
                        <input 
                            type="password" 
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            id="confirm-password"
                            name="confirm-password"
                            aria-label="confirm new password"
                            className="w-full px-3 py-2.5 glass-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4731]" 
                        />
                    </div>
                    <p className="text-xs text-gray-550">Must be at least 12 characters and include an uppercase letter, a lowercase letter, a digit, and a special character.</p>
                    <button 
                        type="submit" 
                        id="update-password-button"
                        name="update-password"
                        aria-label="Update Password"
                        className="px-5 py-2.5 bg-[#1a4731] text-white rounded-lg text-sm font-medium hover:bg-[#153d28] transition-colors"
                    >
                        Update Password
                    </button>
                </form>
            </div>

            {/* User Management */}
            <div className="glass-card p-6 overflow-x-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User management</h3>
                <p className="text-sm text-gray-700 mb-4 font-sans">Create and review OIC accounts. (The hidden super admin is never listed or creatable.)</p>
                <button 
                    onClick={() => setShowAddUserModal(true)}
                    id="new-user-button"
                    name="new-user"
                    aria-label="New User"
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#1a4731] text-white rounded-lg text-sm font-medium hover:bg-[#153d28] mb-4 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    New user
                </button>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="glass-thead border-b border-white/20">
                            <tr className="text-xs font-semibold text-gray-550 uppercase tracking-wider">
                                <th className="px-4 py-3 whitespace-nowrap">Email</th>
                                <th className="px-4 py-3 whitespace-nowrap">Role</th>
                                <th className="px-4 py-3 whitespace-nowrap">Status</th>
                                <th className="px-4 py-3 whitespace-nowrap">Created</th>
                                <th className="px-4 py-3 whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/20">
                            {users.map((user, i) => (
                                <tr key={i} className="hover:bg-white/20 transition-colors">
                                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{user.email} {user.isYou && <span className="text-gray-700 font-normal">(you)</span>}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap font-medium">{user.role}</td>
                                    <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={user.status} /></td>
                                    <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">{user.created}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => handleResetPassword(user)}
                                                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 whitespace-nowrap font-semibold bg-gray-100 hover:bg-gray-200 px-2 py-1.5 rounded-lg transition-all"
                                            >
                                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                                Reset Password
                                            </button>
                                            {!user.isYou && (
                                                <button 
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="flex items-center gap-1.5 text-xs whitespace-nowrap font-semibold text-red-650 bg-red-50 hover:bg-red-100 px-2 py-1.5 rounded-lg transition-all"
                                                >
                                                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {showAddUserModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-slideUp text-sm text-gray-700">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-150">
                            <h3 className="font-bold text-gray-900 text-md">Add New Portal User</h3>
                            <button onClick={() => setShowAddUserModal(false)} className="text-gray-700 hover:text-gray-600 font-bold p-1">✕</button>
                        </div>
                        
                        <div className="space-y-3.5 text-left">
                            <div>
                                <label className="block font-medium text-gray-700 mb-1.5">User Email Address</label>
                                <input 
                                    type="email" 
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                    id="new-user-email"
                                    name="email"
                                    aria-label="email"
                                    placeholder="user@oic.org" 
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a4731]" 
                                />
                            </div>

                            <div>
                                <label className="block font-medium text-gray-700 mb-1.5">User Password</label>
                                <input 
                                    type="password" 
                                    value={newUserPassword}
                                    onChange={(e) => setNewUserPassword(e.target.value)}
                                    id="new-user-password"
                                    name="password"
                                    aria-label="password"
                                    placeholder="••••••••" 
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a4731]" 
                                />
                            </div>
                            
                            <div>
                                <label className="block font-medium text-gray-700 mb-1.5">Authorization Role</label>
                                <select 
                                    value={newUserRole}
                                    onChange={(e) => setNewUserRole(e.target.value)}
                                    id="new-user-role"
                                    name="role"
                                    aria-label="role"
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a4731]" 
                                >
                                    <option value="OIC User">OIC User</option>
                                    <option value="OIC Admin">OIC Admin</option>
                                    <option value="External Auditor">External Auditor</option>
                                </select>
                            </div>
                        </div>
 
                        <div className="flex gap-3 pt-4 border-t border-gray-150">
                            <button 
                                onClick={handleAddUser}
                                disabled={!newUserEmail.trim()}
                                id="create-user-button"
                                name="create-user"
                                aria-label="Create User"
                                className="flex-1 py-2.5 bg-[#1a4731] text-white rounded-lg font-medium hover:bg-[#153d28] transition-colors disabled:opacity-50"
                            >
                                Create User
                            </button>
                            <button 
                                onClick={() => setShowAddUserModal(false)}
                                id="cancel-user-button"
                                name="cancel"
                                aria-label="Cancel"
                                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-250 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
