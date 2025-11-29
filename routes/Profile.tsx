import React from 'react';
import ProfileView from '../components/ProfileView';
import { useDiary } from '../DiaryLayout';

const Profile: React.FC = () => {
  const {
      session, profile, updateProfile, uploadAvatar,
      exportData, signOut, theme, onToggleTheme
  } = useDiary();

  // ProfileView expects "onSignOut", "onBack" (implied by just rendering it?)
  // Actually ProfileView didn't have onBack in the props list in the original file, it was a view switch.

  return (
    <ProfileView
        session={session}
        profile={profile}
        onUpdateProfile={updateProfile}
        onAvatarUpload={uploadAvatar}
        onExportData={exportData}
        onSignOut={signOut}
        theme={theme}
        onToggleTheme={onToggleTheme}
    />
  );
};

export default Profile;