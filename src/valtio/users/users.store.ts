import { proxy, useSnapshot } from 'valtio';

import { UserModel } from '@/models/user.model';

interface UsersStore {
  users: UserModel[];
  selectedUser?: UserModel;
  totalCount: number;
  isLoading: boolean;
  createUserModalOpen: boolean;
  filterUserModalOpen: boolean;
  updateUserModalOpen: boolean;
  deleteUserModalOpen: boolean;
}

export const usersStore = proxy<UsersStore>({
  users: [],
  selectedUser: undefined,
  totalCount: 0,
  isLoading: false,
  createUserModalOpen: false,
  filterUserModalOpen: false,
  updateUserModalOpen: false,
  deleteUserModalOpen: false,
});

export const useUsersStore = (): UsersStore => useSnapshot(usersStore);
