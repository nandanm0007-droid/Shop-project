import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main:           resolve(__dirname, 'index.html'),
        services:       resolve(__dirname, 'services.html'),
        gallery:        resolve(__dirname, 'gallery.html'),
        bookNow:        resolve(__dirname, 'book-now.html'),
        login:          resolve(__dirname, 'login.html'),
        register:       resolve(__dirname, 'register.html'),
        forgotPassword: resolve(__dirname, 'forgot-password.html'),
        resetPassword:  resolve(__dirname, 'reset-password.html'),
        dashboard:      resolve(__dirname, 'dashboard.html'),
        notFound:       resolve(__dirname, '404.html'),
      },
    },
  },
});
