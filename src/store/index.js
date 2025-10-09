// src/store/index.js
import { createStore } from 'vuex';
import authModule from './modules/auth'; // Import your 'auth' module
import setuModule from './modules/setup';

const store = createStore({
    modules: {
        auth: authModule,
        setup: setuModule
    }
});

export default store;
