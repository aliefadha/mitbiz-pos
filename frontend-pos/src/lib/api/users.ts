import { fetchApi } from './client'

export type User = {
  id: number
  nama: string
  email: string
}

async function getUsers(): Promise<User[]> {
  return fetchApi('/auth/users')
}

async function getUser(id: number): Promise<User> {
  return fetchApi(`/auth/users/${id}`)
}

export const useUsers = () => {
  return { getUsers, getUser }
}
