const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Campus data storage (in a real app, this would be in a database)
let campuses = [
  {
    id: '1',
    name: 'Main Campus',
    description: 'The primary campus location with full facilities',
    location: 'Downtown Area',
    studentCount: 15000,
    rating: 4.5,
    facilities: ['Library', 'Gym', 'Cafeteria', 'Study Rooms'],
    departments: ['Computer Science', 'Engineering', 'Business', 'Arts']
  },
  {
    id: '2',
    name: 'North Campus',
    description: 'Specialized campus for research and innovation',
    location: 'North District',
    studentCount: 8000,
    rating: 4.3,
    facilities: ['Research Labs', 'Innovation Center', 'Conference Hall'],
    departments: ['Research', 'Innovation', 'Technology']
  },
  {
    id: '3',
    name: 'South Campus',
    description: 'Campus focused on arts and humanities',
    location: 'South District',
    studentCount: 6000,
    rating: 4.2,
    facilities: ['Art Studios', 'Theater', 'Music Hall', 'Gallery'],
    departments: ['Arts', 'Humanities', 'Music', 'Theater']
  }
];

// Get all campuses
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: campuses,
      message: 'Campuses retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching campuses:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get campus by ID
router.get('/:id', async (req, res) => {
  try {
    const campusId = req.params.id;
    const campus = campuses.find(c => c.id === campusId);
    
    if (!campus) {
      return res.status(404).json({
        success: false,
        message: 'Campus not found'
      });
    }
    
    res.json({
      success: true,
      data: campus,
      message: 'Campus retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching campus:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new campus (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, location, facilities, departments } = req.body;
    
    // Validate required fields
    if (!name || !description || !location) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, and location are required'
      });
    }
    
    // Check if user is admin (you would implement proper admin check)
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const newCampus = {
      id: Date.now().toString(),
      name,
      description,
      location,
      studentCount: 0,
      rating: 0,
      facilities: facilities || [],
      departments: departments || [],
      createdAt: new Date().toISOString()
    };
    
    campuses.push(newCampus);
    
    res.status(201).json({
      success: true,
      data: newCampus,
      message: 'Campus created successfully'
    });
  } catch (error) {
    console.error('Error creating campus:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update campus (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const campusId = req.params.id;
    const { name, description, location, facilities, departments } = req.body;
    
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const campusIndex = campuses.findIndex(c => c.id === campusId);
    
    if (campusIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Campus not found'
      });
    }
    
    // Update campus data
    campuses[campusIndex] = {
      ...campuses[campusIndex],
      name: name || campuses[campusIndex].name,
      description: description || campuses[campusIndex].description,
      location: location || campuses[campusIndex].location,
      facilities: facilities || campuses[campusIndex].facilities,
      departments: departments || campuses[campusIndex].departments,
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: campuses[campusIndex],
      message: 'Campus updated successfully'
    });
  } catch (error) {
    console.error('Error updating campus:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete campus (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const campusId = req.params.id;
    
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const campusIndex = campuses.findIndex(c => c.id === campusId);
    
    if (campusIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Campus not found'
      });
    }
    
    const deletedCampus = campuses.splice(campusIndex, 1)[0];
    
    res.json({
      success: true,
      data: deletedCampus,
      message: 'Campus deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting campus:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Join campus
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const campusId = req.params.id;
    const user = req.user; // This is the authenticated user
    
    // Find the campus
    const campus = campuses.find(c => c.id === campusId);
    
    if (!campus) {
      return res.status(404).json({
        success: false,
        message: 'Campus not found'
      });
    }
    
    // In a real application, you would:
    // 1. Check if user is already a member
    // 2. Add user to campus members
    // 3. Update campus student count
    // 4. Store this in a database
    
    // For now, we'll just return success
    res.json({
      success: true,
      message: `Successfully joined ${campus.name}`,
      data: {
        campusId,
        campusName: campus.name,
        joinedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error joining campus:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Leave campus
router.post('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const campusId = req.params.id;
    const user = req.user; // This is the authenticated user
    
    // Find the campus
    const campus = campuses.find(c => c.id === campusId);
    
    if (!campus) {
      return res.status(404).json({
        success: false,
        message: 'Campus not found'
      });
    }
    
    // In a real application, you would:
    // 1. Check if user is a member
    // 2. Remove user from campus members
    // 3. Update campus student count
    // 4. Store this in a database
    
    // For now, we'll just return success
    res.json({
      success: true,
      message: `Successfully left ${campus.name}`,
      data: {
        campusId,
        campusName: campus.name,
        leftAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error leaving campus:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get campus statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const campusId = req.params.id;
    const campus = campuses.find(c => c.id === campusId);
    
    if (!campus) {
      return res.status(404).json({
        success: false,
        message: 'Campus not found'
      });
    }
    
    // In a real application, you would calculate these from database
    const stats = {
      totalStudents: campus.studentCount,
      averageRating: campus.rating,
      totalDepartments: campus.departments.length,
      totalFacilities: campus.facilities.length,
      activeUsers: Math.floor(campus.studentCount * 0.7), // Example calculation
      recentActivity: Math.floor(Math.random() * 100) // Example data
    };
    
    res.json({
      success: true,
      data: stats,
      message: 'Campus statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching campus statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 