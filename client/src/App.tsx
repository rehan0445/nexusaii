
import React, { Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SettingsProvider } from "./contexts/SettingsContext";
import { AuthProvider } from "./contexts/AuthContext";
import { CharacterProvider } from "./contexts/CharacterContext";
import { JoinedItemsProvider } from "./contexts/JoinedItemsContext";
import { GroupChatProvider } from "./contexts/GroupChatContext";

// Core pages - loaded immediately
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthCallback from "./pages/AuthCallback";
import ReferralRedirect from "./pages/ReferralRedirect";
import WelcomeScreen from "./pages/WelcomeScreen";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ErrorBoundary from "./components/ErrorBoundary";
import BottomBar from "./components/BottomBar";
import { DesktopSidebar } from "./components/DesktopSidebar";
import { DesktopRightSidebar } from "./components/DesktopRightSidebar";
import { DesktopMainContent } from "./components/DesktopMainContent";
import { DesktopLayoutProvider } from "./contexts/DesktopLayoutContext";
import useAndroidBackHandler from "./hooks/useAndroidBackHandler";
import NexusChats from "./components/NexusChats";
import { useSwipeGesture } from "./hooks/useSwipeGesture";

// Primary features - loaded immediately for best UX
import ProfileRoot from "./pages/ProfileRoot";
import CompanionRoot from "./pages/CompanionRoot";
import DarkRoomTab from "./pages/arena/DarkRoomTab";
import DarkRoomChat from "./pages/arena/DarkRoomChat";
import HangoutTab from "./pages/arena/HangoutTab";
import HangoutChat from "./pages/HangoutChat";
import HangoutInfo from "./pages/HangoutInfo";
import GroupsTab from "./pages/arena/GroupsTab";
import GroupChats from "./pages/GroupChats";
import GroupChatPage from "./pages/GroupChatPage";
import CollegeCampus from "./pages/CollegeCampus";
import CollegeAnnouncementsWrapper from "./components/CollegeInfoWrapper";
import CollegeConfessionWrapper from "./components/CollegeConfessionWrapper";
import { PhoenixConfessionDetailWrapper } from "./components/PhoenixConfessionDetailWrapper";

// Lazy load non-critical pages for code splitting
const UserInfoForm = React.lazy(() => import("./pages/UserInfoForm"));
const SetupProfile = React.lazy(() => import("./pages/SetupProfile"));
const AiChat = React.lazy(() => import("./pages/AiChat"));
const AISettings = React.lazy(() => import("./pages/AISettings"));
const CharacterChat = React.lazy(() => import("./pages/CharacterChat"));
const CharacterProfile = React.lazy(() => import("./pages/CharacterProfile"));
const CharacterReelsFeed = React.lazy(() => import("./pages/CharacterReelsFeed"));
const CreatorCharactersPage = React.lazy(() => import("./pages/CreatorCharactersPage"));
const MyChats = React.lazy(() => import("./pages/MyChats"));
import { PhoenixInbox } from "./components/PhoenixInbox";
import { PhoenixBookmarks } from "./components/PhoenixBookmarks";
import { WriteConfession } from "./pages/WriteConfession";
const NexusConnect = React.lazy(() => import("./pages/NexusConnect"));
const Vibe = React.lazy(() => import("./pages/Vibe"));
const AboutUs = React.lazy(() => import("./pages/AboutUs"));

// Settings (main) - lazy loaded
const Settings = React.lazy(() => import("./pages/Settings"));
// Settings sub-pages - lazy loaded
const ActivityReposts = React.lazy(() => import("./pages/settings/ActivityReposts"));
const ActivityComments = React.lazy(() => import("./pages/settings/ActivityComments"));
const ActivityCharacters = React.lazy(() => import("./pages/settings/ActivityCharacters"));
const ActivityLikes = React.lazy(() => import("./pages/settings/ActivityLikes"));

// Context providers
import { TabNavigatorProvider } from "./contexts/TabNavigatorContext";
import { BadgesProvider } from "./contexts/BadgesContext";
import { HangoutProvider } from "./contexts/HangoutContext";
import { NexusChatsProvider, useNexusChats } from "./contexts/NexusChatsContext";
import { BookmarksProvider } from "./contexts/BookmarksContext";

// Campus pages - moved to immediate loading above

// Admin pages - lazy loaded
const AdminPanelPage = React.lazy(() => import("./pages/AdminPanel"));
const CoAdminPanel = React.lazy(() => import("./pages/CoAdminPanel"));
const MembersAnalytics = React.lazy(() => import("./pages/MembersAnalytics"));
const RoleDistributionPage = React.lazy(() => import("./pages/RoleDistribution"));
const RequestsPage = React.lazy(() => import("./pages/Requests"));

// Group chat pages - moved to immediate loading above

// Onboarding - lazy loaded
const IntroNexus = React.lazy(() => import("./pages/onboarding/IntroNexus"));
const IntroCompanion = React.lazy(() => import("./pages/onboarding/IntroCompanion"));
const IntroCampus = React.lazy(() => import("./pages/onboarding/IntroCampus"));
const IntroDarkRoom = React.lazy(() => import("./pages/onboarding/IntroDarkRoom"));
const IntroHangout = React.lazy(() => import("./pages/onboarding/IntroHangout"));

const AndroidBackBridge: React.FC = () => {
  useAndroidBackHandler();
  return null;
};

// Swipe gesture handler component
const SwipeGestureHandler: React.FC = () => {
  const { openChats, closeChats, isOpen } = useNexusChats();
  const location = useLocation();

  // Disable swipe on login/register/legal pages and auth callback
  const shouldDisableSwipe = location.pathname === '/login' || 
                              location.pathname === '/register' ||
                              location.pathname === '/auth/callback' ||
                              location.pathname === '/terms' ||
                              location.pathname === '/privacy' ||
                              location.pathname.startsWith('/onboarding');

  useSwipeGesture({
    onSwipeLeft: () => {
      if (!shouldDisableSwipe && !isOpen) {
        openChats();
      }
    },
    onSwipeRight: () => {
      if (isOpen) {
        closeChats();
      }
    },
    threshold: 100,
    disabled: true // Swipe gestures completely disabled
  });

  return null;
};

// Route elements as a Fragment (Routes only accepts <Route> or <React.Fragment> as direct children)
const APP_ROUTES = (
  <>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="/ref/:code" element={<ReferralRedirect />} />
    <Route path="/terms" element={<TermsAndConditions />} />
    <Route path="/privacy" element={<PrivacyPolicy />} />
    <Route path="/user-info" element={<UserInfoForm />} />
    <Route path="/setup-profile" element={<SetupProfile />} />
    <Route path="/onboarding/intro" element={<IntroNexus />} />
    <Route path="/onboarding/companion" element={<IntroCompanion />} />
    <Route path="/onboarding/campus" element={<IntroCampus />} />
    <Route path="/onboarding/darkroom" element={<IntroDarkRoom />} />
    <Route path="/onboarding/hangout" element={<IntroHangout />} />
    <Route path="/arena" element={<Navigate to="/companion" replace />} />
    <Route path="/arena/darkroom" element={<DarkRoomTab />} />
    <Route path="/arena/darkroom/:roomId" element={<DarkRoomChat />} />
    <Route path="/arena/groups" element={<GroupsTab />} />
    <Route path="/arena/hangout" element={<HangoutTab />} />
    <Route path="/arena/hangout/chat/:roomId" element={<HangoutChat />} />
    <Route path="/arena/hangout/info/:roomId" element={<HangoutInfo />} />
    <Route path="/arena/hangout/admin/:roomId" element={<AdminPanelPage />} />
    <Route path="/arena/hangout/co-admin/:roomId" element={<CoAdminPanel />} />
    <Route path="/arena/hangout/members-analytics/:roomId" element={<MembersAnalytics />} />
    <Route path="/arena/hangout/roles/:roomId" element={<RoleDistributionPage />} />
    <Route path="/arena/hangout/requests/:roomId" element={<RequestsPage />} />
    <Route path="/group-chats" element={<GroupChats />} />
    <Route path="/group-chat/:groupId" element={<GroupChatPage />} />
    <Route path="/campus" element={<Navigate to="/campus/general/confessions" replace />} />
    <Route path="/campus/:collegeId/announcements" element={<CollegeAnnouncementsWrapper />} />
    <Route path="/campus/:collegeId/confessions/:confessionId" element={<PhoenixConfessionDetailWrapper />} />
    <Route path="/campus/:collegeId/confessions" element={<CollegeConfessionWrapper />} />
    <Route path="/campus/:collegeId" element={<CollegeCampus />} />
    <Route path="/campus/*" element={<Navigate to="/campus/general/confessions" replace />} />
    <Route path="/companion" element={<CompanionRoot />} />
    <Route path="/profile" element={<ProfileRoot />} />
    <Route path="/bookmarks" element={<PhoenixBookmarks />} />
    <Route path="/about-us" element={<AboutUs />} />
    <Route path="/settings" element={<Settings />} />
    <Route path="/" element={<WelcomeScreen />} />
    <Route path="/ai" element={<Navigate to="/companion" replace />} />
    <Route path="/create-buddy" element={<AISettings />} />
    <Route path="/chat/:characterId" element={<CharacterChat />} />
    <Route path="/character/:characterId" element={<CharacterProfile />} />
    <Route path="/reels" element={<CharacterReelsFeed />} />
    <Route path="/reels/:initialIndex" element={<CharacterReelsFeed />} />
    <Route path="/creator/:creatorName" element={<CreatorCharactersPage />} />
    <Route path="/my-chats" element={<PhoenixInbox />} />
    <Route path="/write-confession" element={<WriteConfession />} />
    <Route path="/vibe" element={<Vibe />} />
    <Route path="/vibe/chat/:groupId" element={<GroupChatPage />} />
    <Route path="/group-chat/:groupId" element={<GroupChatPage />} />
    <Route path="/settings/activity/reposts" element={<ActivityReposts />} />
    <Route path="/settings/activity/comments" element={<ActivityComments />} />
    <Route path="/settings/activity/characters" element={<ActivityCharacters />} />
    <Route path="/settings/activity/likes" element={<ActivityLikes />} />
    <Route path="/connect" element={<NexusConnect />} />
    <Route path="/nexus-connect" element={<NexusConnect />} />
  </>
);

function App() {
  const location = useLocation();
  const hideBottomBar = React.useMemo(() => {
    const p = location.pathname;
    return p === '/' || p === '/login' || p === '/register' || p === '/auth/callback' || p === '/terms' || p === '/privacy' || p.startsWith('/onboarding');
  }, [location.pathname]);
  return (
    <SettingsProvider>
      <AuthProvider>
        <JoinedItemsProvider>
            {/* <ChatProvider> */}
            <CharacterProvider>
              <BookmarksProvider>
              <ErrorBoundary>
              <BadgesProvider>
              <HangoutProvider>
              <GroupChatProvider>
                <NexusChatsProvider>
                  <TabNavigatorProvider>
                  <AndroidBackBridge />
                  <SwipeGestureHandler />
                  <NexusChats />
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                  {hideBottomBar ? (
                    <Routes>{APP_ROUTES}</Routes>
                  ) : (
                    <>
                      {/* Desktop: 3-column layout - only at lg (1024px+) */}
                      <DesktopLayoutProvider>
                        <DesktopSidebar />
                        <DesktopRightSidebar />
                        <DesktopMainContent>
                          <Routes>{APP_ROUTES}</Routes>
                        </DesktopMainContent>
                      </DesktopLayoutProvider>
                      <div className="lg:hidden">
                        <BottomBar />
                      </div>
                    </>
                  )}
                  </Suspense>
                  </TabNavigatorProvider>
                </NexusChatsProvider>
              </GroupChatProvider>
              </HangoutProvider>
              </BadgesProvider>
              </ErrorBoundary>
              </BookmarksProvider>
            </CharacterProvider>
            {/* </ChatProvider> */}
        </JoinedItemsProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
