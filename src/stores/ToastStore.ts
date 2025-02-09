import {ref} from 'vue';
import {defineStore} from 'pinia';
import { DateTime } from 'luxon';


interface ToastNew {
  title?: string,
  body: string,
  // timestamp: moment.Moment,
  // key?: number,
  bodyHtml?: boolean,
  timeoutMs?: number,
  css?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark',
}

interface ToastAdded extends ToastNew {
  id: number,
  timestamp: DateTime,
}

let toastId = 0;

export const useToastStore = defineStore('ToastStore', () => {
  const toasts = ref<ToastAdded[]>([]);

  function addToast(toast: ToastNew) {
    const newToast: ToastAdded = {...toast, id: toastId++, timestamp: DateTime.now()};
    toasts.value.unshift(newToast);
  }  

  function $reset() {
    toasts.value = [];
  }

  return {
    $reset,
    addToast,
    toasts,
  };
});

