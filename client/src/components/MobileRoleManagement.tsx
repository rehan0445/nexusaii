import React, { useState } from 'react';
import { X, Crown, Shield, Users, Trash2, Plus, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface CustomRole {
  id: string;
  name: string;
  permissions: string[];
  color: string;
}

interface GroupMember {
  id: string;
  username: string;
  role: string;
  customTitle?: string;
}

interface MobileRoleManagementProps {
  isOpen: boolean;
  onClose: () => void;
  customRoles: CustomRole[];
  members: GroupMember[];
  onCreateRole: (role: Omit<CustomRole, 'id'>) => void;
  onDeleteRole: (roleId: string) => void;
  onAssignTitle: (memberId: string, title: string) => void;
}

const MobileRoleManagement: React.FC<MobileRoleManagementProps> = ({
  isOpen,
  onClose,
  customRoles,
  members,
  onCreateRole,
  onDeleteRole,
  onAssignTitle
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'assign' | 'existing'>('create');
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [expandedPermissions, setExpandedPermissions] = useState(false);
  const [customTitles, setCustomTitles] = useState<Record<string, string>>({});

  const permissions = ['Manage Messages', 'Ban Users', 'Approve Requests', 'Create Announcements'];
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const handleCreateRole = () => {
    if (roleName.trim()) {
      onCreateRole({
        name: roleName.trim(),
        permissions: selectedPermissions,
        color: selectedColor
      });
      setRoleName('');
      setSelectedPermissions([]);
      setSelectedColor('#3B82F6');
    }
  };

  const handlePermissionToggle = (permission: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleAssignTitle = (memberId: string) => {
    const title = customTitles[memberId];
    if (title?.trim()) {
      onAssignTitle(memberId, title.trim());
      setCustomTitles(prev => ({ ...prev, [memberId]: '' }));
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-red-400" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-400" />;
      default:
        return <Users className="w-4 h-4 text-zinc-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-zinc-900 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-t-2xl sm:rounded-b-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">Role Management</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800">
          {[
            { key: 'create', label: 'Create', icon: Plus },
            { key: 'assign', label: 'Assign', icon: Crown },
            { key: 'existing', label: 'Roles', icon: Shield }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/10'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Create Role Tab */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Role Name</label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g., Moderator, Recruiter"
                  className="w-full px-4 py-3 bg-zinc-800 text-white rounded-xl border border-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <button
                  onClick={() => setExpandedPermissions(!expandedPermissions)}
                  className="w-full flex items-center justify-between p-4 bg-zinc-800 rounded-xl border border-zinc-700"
                >
                  <span className="text-sm font-medium text-zinc-300">
                    Permissions ({selectedPermissions.length} selected)
                  </span>
                  {expandedPermissions ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
                </button>
                
                {expandedPermissions && (
                  <div className="mt-2 p-4 bg-zinc-800 rounded-xl border border-zinc-700 space-y-3">
                    {permissions.map((permission) => (
                      <label key={permission} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission)}
                          onChange={() => handlePermissionToggle(permission)}
                          className="w-5 h-5 rounded border-zinc-600 bg-zinc-700 text-blue-500 focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-sm text-zinc-300">{permission}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">Color</label>
                <div className="grid grid-cols-6 gap-3">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-12 h-12 rounded-full border-2 transition-all ${
                        selectedColor === color
                          ? 'border-white scale-110 shadow-lg'
                          : 'border-zinc-600 hover:border-zinc-400'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {selectedColor === color && (
                        <Check className="w-6 h-6 text-white mx-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateRole}
                disabled={!roleName.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-xl transition-colors"
              >
                Create Role
              </button>
            </div>
          )}

          {/* Assign Titles Tab */}
          {activeTab === 'assign' && (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="p-4 bg-zinc-800 rounded-xl border border-zinc-700">
                  <div className="flex items-center space-x-3 mb-3">
                    {getRoleIcon(member.role)}
                    <div className="flex-1">
                      <div className="text-white font-medium">{member.username}</div>
                      <div className="text-xs text-zinc-400 capitalize">{member.role}</div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={customTitles[member.id] || ''}
                      onChange={(e) => setCustomTitles(prev => ({ ...prev, [member.id]: e.target.value }))}
                      placeholder="Custom title"
                      className="flex-1 px-3 py-2 bg-zinc-700 text-white text-sm rounded-lg border border-zinc-600 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleAssignTitle(member.id)}
                      disabled={!customTitles[member.id]?.trim()}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Assign
                    </button>
                  </div>
                  
                  {member.customTitle && (
                    <div className="mt-2 text-xs text-blue-400">
                      Current: {member.customTitle}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Existing Roles Tab */}
          {activeTab === 'existing' && (
            <div className="space-y-3">
              {customRoles.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-400">No custom roles created yet</p>
                  <p className="text-xs text-zinc-500 mt-1">Create your first role to get started</p>
                </div>
              ) : (
                customRoles.map((role) => (
                  <div key={role.id} className="p-4 bg-zinc-800 rounded-xl border border-zinc-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: role.color }}
                        />
                        <span className="text-white font-medium" style={{ color: role.color }}>
                          {role.name}
                        </span>
                      </div>
                      <button
                        onClick={() => onDeleteRole(role.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs text-zinc-400">
                        <span className="font-medium">Permissions:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.map((permission) => (
                          <span
                            key={permission}
                            className="px-2 py-1 bg-zinc-700 text-zinc-300 text-xs rounded-md"
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileRoleManagement;
