import { SortDirection } from '@/config/constants.config';
import { UserRoleName, UserStatus } from '@/models/user.model';
import UsersService from '@/services/users.service';

import { usersStore } from './users.store';

export async function getUsers(
  page?: number,
  search?: string,
  sortBy?: string,
  sortDirection?: SortDirection,
  role?: UserRoleName,
  status?: UserStatus
): Promise<void> {
  usersStore.isLoading = true;

  const { content, page: contentPage } = await UsersService.getUsers(page, search, sortBy, sortDirection, role, status);

  usersStore.isLoading = false;
  usersStore.users = content;
  usersStore.totalCount = contentPage?.totalElements || 0;
}

export async function getSelectedUser(id: number): Promise<void> {
  const response = await UsersService.getUser(id);

  usersStore.selectedUser = response!;
}

export function findUser(index: string): void {
  usersStore.selectedUser = usersStore.users[+index];
}

export function clearSelectedUser(): void {
  usersStore.selectedUser = undefined;
}

export function toggleCreateUserModal(isOpen?: boolean | React.MouseEvent): void {
  usersStore.createUserModalOpen = typeof isOpen === 'boolean' ? isOpen : !usersStore.createUserModalOpen;
}

export function toggleFilterUserModal(isOpen?: boolean | React.MouseEvent): void {
  usersStore.filterUserModalOpen = typeof isOpen === 'boolean' ? isOpen : !usersStore.filterUserModalOpen;
}

export function toggleUpdateUserModal(isOpen?: boolean | React.MouseEvent): void {
  usersStore.updateUserModalOpen = typeof isOpen === 'boolean' ? isOpen : !usersStore.updateUserModalOpen;
}

export function toggleDeleteUserModal(isOpen?: boolean | React.MouseEvent): void {
  usersStore.deleteUserModalOpen = typeof isOpen === 'boolean' ? isOpen : !usersStore.deleteUserModalOpen;
}
