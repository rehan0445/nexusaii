import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';

interface JoinedGroup {
  id: string;
  name: string;
  description: string;
  joinedAt: Date;
}

interface JoinedCommunity {
  id: string;
  name: string;
  description: string;
  joinedAt: Date;
}

interface JoinedItemsContextType {
  joinedGroups: Map<string, JoinedGroup>;
  joinedCommunities: Map<string, JoinedCommunity>;
  addJoinedGroup: (groupId: string, name: string, description: string) => void;
  addJoinedCommunity: (communityId: string, name: string, description: string) => void;
  removeJoinedGroup: (groupId: string) => void;
  removeJoinedCommunity: (communityId: string) => void;
  isGroupJoined: (groupId: string) => boolean;
  isCommunityJoined: (communityId: string) => boolean;
  getJoinedGroupsData: () => Array<{ id: string; name: string; type: 'group' | 'community' }>;
}

const JoinedItemsContext = createContext<JoinedItemsContextType | undefined>(undefined);

interface JoinedItemsProviderProps {
  children: ReactNode;
}

export const JoinedItemsProvider: React.FC<JoinedItemsProviderProps> = ({ children }) => {
  const [joinedGroups, setJoinedGroups] = useState<Map<string, JoinedGroup>>(new Map());
  const [joinedCommunities, setJoinedCommunities] = useState<Map<string, JoinedCommunity>>(new Map());

  // Load joined state from localStorage on mount
  useEffect(() => {
    console.log('🔄 Loading joined state from localStorage...');
    loadJoinedState();
  }, []);

  const loadJoinedState = () => {
    try {
      const savedJoinedGroups = localStorage.getItem('joined-groups');
      const savedJoinedCommunities = localStorage.getItem('joined-communities');
      
      console.log('📦 Saved groups:', savedJoinedGroups);
      console.log('📦 Saved communities:', savedJoinedCommunities);
      console.log('🔍 Checking if localStorage is empty...');
      
      if (savedJoinedGroups) {
        const parsedGroups = JSON.parse(savedJoinedGroups);
        const groupsMap = new Map();
        parsedGroups.forEach((group: any) => {
          groupsMap.set(group.id, {
            ...group,
            joinedAt: new Date(group.joinedAt)
          });
        });
        setJoinedGroups(groupsMap);
        console.log('✅ Loaded groups:', Array.from(groupsMap.values()).map(g => g.name));
      } else {
        console.log('🆕 No saved groups found, adding sample groups...');
        // Add sample groups if none exist
        const sampleGroups = [
          {
            id: '1',
            name: 'Fitness Journey',
            description: 'Share your fitness goals and progress',
            joinedAt: new Date('2025-07-20')
          },
          {
            id: '2',
            name: 'Gaming Squad',
            description: 'Find teammates and discuss your favorite games',
            joinedAt: new Date('2025-07-20')
          },
          {
            id: '3',
            name: 'Creative Minds',
            description: 'A space for artists, writers, and creative folks',
            joinedAt: new Date('2025-07-20')
          },
          {
            id: '4',
            name: 'Anime Universe',
            description: 'Discuss all things anime - from classics to the latest releases',
            joinedAt: new Date('2025-07-20')
          },
          {
            id: '5',
            name: 'Book Club',
            description: 'Discuss your favorite books and discover new ones',
            joinedAt: new Date('2025-07-25')
          },
          {
            id: '6',
            name: 'ren04',
            description: 'ss',
            joinedAt: new Date('2025-07-29')
          },
          {
            id: '7',
            name: 'Pokémon Trainers',
            description: 'General Pokémon discussion for trainers of all ages',
            joinedAt: new Date('2025-07-30')
          }
        ];
        
        const groupsMap = new Map();
        sampleGroups.forEach(group => {
          groupsMap.set(group.id, group);
        });
        setJoinedGroups(groupsMap);
        localStorage.setItem('joined-groups', JSON.stringify(sampleGroups));
        console.log('✅ Added sample groups:', sampleGroups.map(g => g.name));
      }
      
      if (savedJoinedCommunities) {
        const parsedCommunities = JSON.parse(savedJoinedCommunities);
        const communitiesMap = new Map();
        parsedCommunities.forEach((community: any) => {
          communitiesMap.set(community.id, {
            ...community,
            joinedAt: new Date(community.joinedAt)
          });
        });
        setJoinedCommunities(communitiesMap);
        console.log('✅ Loaded communities:', Array.from(communitiesMap.values()).map(c => c.name));
      } else {
        console.log('🆕 No saved communities found, adding sample communities...');
        // Add sample communities if none exist
        const sampleCommunities = [
          {
            id: 'c1',
            name: 'Escape Room Fans',
            description: 'Connect with fellow escape room enthusiasts and share experiences',
            joinedAt: new Date('2025-07-20')
          },
          {
            id: 'c2',
            name: 'Tech Enthusiasts',
            description: 'Discuss the latest in technology and innovation',
            joinedAt: new Date('2025-07-22')
          }
        ];
        
        const communitiesMap = new Map();
        sampleCommunities.forEach(community => {
          communitiesMap.set(community.id, community);
        });
        setJoinedCommunities(communitiesMap);
        localStorage.setItem('joined-communities', JSON.stringify(sampleCommunities));
        console.log('✅ Added sample communities:', sampleCommunities.map(c => c.name));
      }
    } catch (err) {
      console.error('❌ Failed to load joined state:', err);
    }
  };

  const saveJoinedState = (groups: Map<string, JoinedGroup>, communities: Map<string, JoinedCommunity>) => {
    try {
      localStorage.setItem('joined-groups', JSON.stringify([...groups.values()]));
      localStorage.setItem('joined-communities', JSON.stringify([...communities.values()]));
    } catch (err) {
      console.error('Failed to save joined state:', err);
    }
  };

  const addJoinedGroup = (groupId: string, name: string, description: string) => {
    const newJoinedGroups = new Map(joinedGroups);
    newJoinedGroups.set(groupId, {
      id: groupId,
      name,
      description,
      joinedAt: new Date()
    });
    setJoinedGroups(newJoinedGroups);
    saveJoinedState(newJoinedGroups, joinedCommunities);
  };

  const addJoinedCommunity = (communityId: string, name: string, description: string) => {
    const newJoinedCommunities = new Map(joinedCommunities);
    newJoinedCommunities.set(communityId, {
      id: communityId,
      name,
      description,
      joinedAt: new Date()
    });
    setJoinedCommunities(newJoinedCommunities);
    saveJoinedState(joinedGroups, newJoinedCommunities);
  };

  const removeJoinedGroup = (groupId: string) => {
    const newJoinedGroups = new Map(joinedGroups);
    newJoinedGroups.delete(groupId);
    setJoinedGroups(newJoinedGroups);
    saveJoinedState(newJoinedGroups, joinedCommunities);
  };

  const removeJoinedCommunity = (communityId: string) => {
    const newJoinedCommunities = new Map(joinedCommunities);
    newJoinedCommunities.delete(communityId);
    setJoinedCommunities(newJoinedCommunities);
    saveJoinedState(joinedGroups, newJoinedCommunities);
  };

  const isGroupJoined = (groupId: string) => {
    return joinedGroups.has(groupId);
  };

  const isCommunityJoined = (communityId: string) => {
    return joinedCommunities.has(communityId);
  };

  const getJoinedGroupsData = () => {
    const data: Array<{ id: string; name: string; type: 'group' | 'community' }> = [];
    
    // Add joined groups
    joinedGroups.forEach(group => {
      data.push({
        id: group.id,
        name: group.name,
        type: 'group'
      });
    });
    
    // Add joined communities
    joinedCommunities.forEach(community => {
      data.push({
        id: community.id,
        name: community.name,
        type: 'community'
      });
    });
    
    return data;
  };

  const value: JoinedItemsContextType = useMemo(() => ({
    joinedGroups,
    joinedCommunities,
    addJoinedGroup,
    addJoinedCommunity,
    removeJoinedGroup,
    removeJoinedCommunity,
    isGroupJoined,
    isCommunityJoined,
    getJoinedGroupsData
  }), [joinedGroups, joinedCommunities, addJoinedGroup, addJoinedCommunity, removeJoinedGroup, removeJoinedCommunity, isGroupJoined, isCommunityJoined, getJoinedGroupsData]);

  return (
    <JoinedItemsContext.Provider value={value}>
      {children}
    </JoinedItemsContext.Provider>
  );
};

export const useJoinedItems = () => {
  const context = useContext(JoinedItemsContext);
  if (context === undefined) {
    throw new Error('useJoinedItems must be used within a JoinedItemsProvider');
  }
  return context;
}; 