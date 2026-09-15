 
 import { storageKeys } from './storage';
 const KEY = storageKeys.authToken;

 export const getStoredToken = (): string | null => {
   return localStorage.getItem(KEY);
 }

 export const setStoredToken = (token: string) => {
   localStorage.setItem(KEY, token);
 }

 export const removeStoredToken = () => {
   localStorage.removeItem(KEY);
 }