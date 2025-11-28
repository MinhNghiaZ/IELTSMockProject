import type { User } from "../types/User";
import { client } from "./authService"; // Use the authenticated client

export interface UserCreateDTO {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string | null; // Allow null for optional phone number
  role: string;
}
interface UserBasicDto {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  createdAt: string;
}
interface UserUpdateDto {
  fullName: string;
  email: string;
  currentPassword?: string; // Optional current password for verification
  password?: string;
  phoneNumber?: string;
}

export async function getAllUsers(): Promise<User[]> {
  const res = await client.get<User[]>("/Users");
  return res.data;
}

export async function deleteUser(id: string | number): Promise<void> {
  await client.delete(`/Users/${id}`);
}

// Create a new user
export async function createUser(
  newUser: UserCreateDTO
): Promise<UserBasicDto> {
  const res = await client.post<UserBasicDto>("/Users", newUser);
  return res.data;
}

// Update an existing user
export async function updateUser(
  id: string | number,
  userUpdate: UserUpdateDto
): Promise<UserBasicDto> {
  const res = await client.put<UserBasicDto>(`/Users/${id}`, userUpdate);
  return res.data;
}

// Get a single user by ID
export async function getUserById(id: string | number): Promise<User> {
  const res = await client.get<User>(`/Users/${id}`);
  return res.data;
}

//for student dashboard
export async function getTotalSubmission(id: string | number) : Promise<number> {
  const res = await client.get<number>(`/Users/gettotalsubmission?id=${id}`);
  return res.data;
}

export async function getAvrScore(id: string | number) : Promise<number> {
  const res = await client.get<number>(`/Users/getavrscore?id=${id}`);
  return res.data;
}

export async function getHighestScore(id: string | number) : Promise<number> {
  const res = await client.get<number>(`/Users/gethighestscore?id=${id}`);
  return res.data;
}

export async function getLowestScore(id: string | number) : Promise<number> {
  const res = await client.get<number>(`/Users/getlowestscore?id=${id}`);
  return res.data;
}

//for admin dashboard
export async function getTotalTestsByAdminId(id: string | number) : Promise<number> {
  const res = await client.get<number>(`Users/gettestcreatedbyadmin?id=${id}`);
  return res.data;
}

export async function getTotalSubmissionsByAdminId(id: string | number) : Promise<number> {
  const res = await client.get<number>(`Users/getsubmissionsbyadmintest?id=${id}`);
  return res.data;
}

export async function getTotalStudentsByAdminId(id: string | number) : Promise<number> {
  const res = await client.get<number>(`Users/getstudentsbyadmintest?id=${id}`);
  return res.data;
}

export async function getTotalTest() : Promise<number> {
  const res = await client.get<number>(`Users/gettotaltests`);
  return res.data;
}

export async function getTotalActiveTest() : Promise<number> {
  const res = await client.get<number>(`Users/gettotalactivetests`);
  return res.data;
}

export async function getTotalInactiveTest() : Promise<number> {
  const res = await client.get<number>(`Users/gettotalinactivetests`);
  return res.data;
}

