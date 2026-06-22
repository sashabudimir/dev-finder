import User from '../types/user';
import axios from 'axios';

const api = axios.create({
    baseURL: 'https://my-json-server.typicode.com/sashabudimir/dev-finder',
});

export function getUsers(): Promise<User[]> {
    return api.get<User[]>('/users').then(({ data }) => data);
}

export function getUserByLogin(username: string): Promise<User | undefined> {
    return api.get<User[]>(`/users?login=${username}`).then((res) => res.data[0]);
}

export function postUser(user: Omit<User, 'id'>): Promise<User> {
    return api.post<User>('/users', user).then(({ data }) => data);
}

export function deleteUser(id: number): Promise<any> {
    return api.delete(`/users/${id}`).then(({ data }) => data);
}