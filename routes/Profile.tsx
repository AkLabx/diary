import React from 'react';
import ProfileView from '../components/ProfileView';
import { useDiary } from '../DiaryLayout';

const Profile: React.FC = () => {
  const {
      session, profile, updateProfile, uploadAvatar,
      exportData, signOut, deleteAccount, theme, onToggleTheme
  } = useDiary();

  return (
    <ProfileView
        session={session}
        profile={profile}
        onUpdateProfile={updateProfile}
        onAvatarUpload={uploadAvatar}
        onExportData={exportData}
        onSignOut={signOut}
        onDeleteAccount={deleteAccount}
        theme={theme}
        onToggleTheme={onToggleTheme}
    />
  );
};

export default Profile;