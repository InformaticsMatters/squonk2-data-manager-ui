import { useContext } from 'react';

import { UserProfileContext } from '../context/userProfile';

export const useUserProfile = () => {
  const { profile, loading } = useContext(UserProfileContext);

  return { profile, profileLoading: loading };
};
