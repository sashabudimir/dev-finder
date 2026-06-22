import axios from 'axios';

export function getUserInfo(username: string) {
    return axios.get(`https://api.github.com/users/${username}`).then(({ data }) => data);
}