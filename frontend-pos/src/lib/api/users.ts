import { fetchApi } from './client'

export type User = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: Date
  updatedAt: Date
  role?: "admin" | "owner" | "cashier"
  outletId?: number | null
}

export type CreateUserDto = {
  name: string
  email: string
  password: string
  role?: "admin" | "owner" | "cashier"
  outletId?: number
  isSubscribed?: boolean
}

async function getUsers(): Promise<{ users: User[]; total: number }> {
  return fetchApi('/users')
}

async function getProfile(): Promise<User> {
  return fetchApi('/users/me')
}

async function createUser(data: CreateUserDto): Promise<User> {
  return fetchApi('/users', {
    method: 'POST',
    data,
  })
}

async function updateProfile(data: { name?: string; image?: string }): Promise<User> {
  return fetchApi('/users/me', {
    method: 'PATCH',
    data,
  })
}

export const usersApi = {
  getUsers,
  getProfile,
  createUser,
  updateProfile,
}
