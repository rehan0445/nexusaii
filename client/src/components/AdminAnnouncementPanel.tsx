import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Calendar,
  Tag,
  AlertTriangle,
  Users,
  MapPin,
  Building,
  Eye,
  EyeOff,
  Pin,
  Clock
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'infrastructure' | 'academic' | 'events' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetAudience: string[];
  campus: string;
  department: string | null;
  tags: string[];
  isPinned: boolean;
  isActive: boolean;
  requiresAcknowledgment: boolean;
  scheduledFor: Date | null;
  expiresAt: Date | null;
  likes: number;
  reactions: { [emoji: string]: number };
  author: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface AdminAnnouncementPanelProps {
  currentUser: {
    id: string;
    name: string;
    isAdmin: boolean;
  };
}

export function AdminAnnouncementPanel({ currentUser }: AdminAnnouncementPanelProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'infrastructure' as 'infrastructure' | 'academic' | 'events' | 'emergency',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    targetAudience: ['all'],
    campus: 'main',
    department: '',
    tags: [] as string[],
    isPinned: false,
    requiresAcknowledgment: false,
    scheduledFor: '',
    expiresAt: ''
  });
  const [tagInput, setTagInput] = useState('');

  // Fetch announcements
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/announcements');
      const data = await response.json();
      
      if (data.success) {
        const formattedAnnouncements = data.data.map((ann: any) => ({
          ...ann,
          createdAt: new Date(ann.createdAt),
          updatedAt: new Date(ann.updatedAt),
          scheduledFor: ann.scheduledFor ? new Date(ann.scheduledFor) : null,
          expiresAt: ann.expiresAt ? new Date(ann.expiresAt) : null
        }));
        setAnnouncements(formattedAnnouncements);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser.isAdmin) {
      alert('Only admins can create announcements');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        scheduledFor: formData.scheduledFor ? new Date(formData.scheduledFor).toISOString() : null,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        department: formData.department || null
      };

      const url = editingId ? `/api/v1/announcements/${editingId}` : '/api/v1/announcements';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        await fetchAnnouncements(); // Refresh the list
        handleCancel();
        alert(editingId ? 'Announcement updated successfully!' : 'Announcement created successfully!');
      } else {
        alert(data.message || 'Failed to save announcement');
      }
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('Error saving announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setIsCreating(true);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      priority: announcement.priority,
      targetAudience: announcement.targetAudience,
      campus: announcement.campus,
      department: announcement.department || '',
      tags: announcement.tags,
      isPinned: announcement.isPinned,
      requiresAcknowledgment: announcement.requiresAcknowledgment,
      scheduledFor: announcement.scheduledFor ? announcement.scheduledFor.toISOString().slice(0, 16) : '',
      expiresAt: announcement.expiresAt ? announcement.expiresAt.toISOString().slice(0, 16) : ''
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/v1/announcements/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        await fetchAnnouncements();
        alert('Announcement deleted successfully!');
      } else {
        alert(data.message || 'Failed to delete announcement');
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Error deleting announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      category: 'infrastructure',
      priority: 'medium',
      targetAudience: ['all'],
      campus: 'main',
      department: '',
      tags: [],
      isPinned: false,
      requiresAcknowledgment: false,
      scheduledFor: '',
      expiresAt: ''
    });
    setTagInput('');
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'emergency': return <AlertTriangle className="w-4 h-4" />;
      case 'academic': return <Users className="w-4 h-4" />;
      case 'events': return <Calendar className="w-4 h-4" />;
      case 'infrastructure': return <Building className="w-4 h-4" />;
      default: return <Building className="w-4 h-4" />;
    }
  };

  if (!currentUser.isAdmin) {
    return (
      <div className="bg-zinc-900 rounded-xl p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Access Denied</h3>
        <p className="text-zinc-400">Only administrators can access this panel.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Manage Announcements</h3>
        <button
          onClick={() => setIsCreating(true)}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 mb-6">
          <h4 className="text-lg font-semibold text-white mb-4">
            {editingId ? 'Edit Announcement' : 'Create New Announcement'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                placeholder="Enter announcement title..."
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Content *</label>
              <textarea
                required
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                placeholder="Enter announcement content..."
              />
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="infrastructure">Infrastructure</option>
                  <option value="academic">Academic</option>
                  <option value="events">Events</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Priority *</label>
                <select
                  required
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Campus and Department */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Campus</label>
                <select
                  value={formData.campus}
                  onChange={(e) => setFormData(prev => ({ ...prev, campus: e.target.value }))}
                  className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Campuses</option>
                  <option value="main">Main Campus</option>
                  <option value="north">North Campus</option>
                  <option value="south">South Campus</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., IT, Library, Security (optional)"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Tags</label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 p-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Add tags..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="bg-zinc-600 hover:bg-zinc-500 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded-full text-sm flex items-center space-x-1"
                    >
                      <Tag className="w-3 h-3" />
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-300 hover:text-red-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Schedule and Expiry */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Scheduled For</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledFor}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledFor: e.target.value }))}
                  className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Expires At</label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Options */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPinned: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-zinc-700 border-zinc-600 rounded focus:ring-blue-500"
                />
                <span className="text-zinc-300">Pin announcement</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.requiresAcknowledgment}
                  onChange={(e) => setFormData(prev => ({ ...prev, requiresAcknowledgment: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-zinc-700 border-zinc-600 rounded focus:ring-blue-500"
                />
                <span className="text-zinc-300">Requires acknowledgment</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{loading ? 'Saving...' : (editingId ? 'Update' : 'Create')}</span>
              </button>
              
              <button
                type="button"
                onClick={handleCancel}
                className="bg-zinc-600 hover:bg-zinc-500 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {loading && announcements.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-400">Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h4 className="text-white font-semibold mb-2">No announcements found</h4>
            <p className="text-zinc-400">Create your first announcement to get started.</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(announcement.category)}
                    <span className={`font-medium ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority.toUpperCase()}
                    </span>
                  </div>
                  {announcement.isPinned && <Pin className="w-4 h-4 text-yellow-400" />}
                  {!announcement.isActive && <EyeOff className="w-4 h-4 text-gray-400" />}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(announcement)}
                    className="text-blue-400 hover:text-blue-300 p-1"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h4 className="text-white font-semibold mb-2">{announcement.title}</h4>
              <p className="text-zinc-300 text-sm mb-3 line-clamp-2">{announcement.content}</p>

              <div className="flex items-center justify-between text-xs text-zinc-500">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>{announcement.likes} likes</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{announcement.createdAt.toLocaleDateString()}</span>
                  </span>
                  <span className="capitalize">{announcement.category}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {announcement.tags.slice(0, 2).map((tag, index) => (
                    <span key={index} className="bg-zinc-700 px-2 py-1 rounded text-xs">
                      #{tag}
                    </span>
                  ))}
                  {announcement.tags.length > 2 && (
                    <span className="text-zinc-400">+{announcement.tags.length - 2}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 