import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query/react";

import { roleApi } from "./api/roles";

import authSlice from "./authSlice";
import themeConfigSlice from "./themeConfigSlice";
import { companyApi } from "./api/company";
import { userApi } from "./api/user";
import { loginApi } from "./api/login";
import { documentApi } from "./api/document";
import { evidanceCollectionApi } from "./api/evidancecollection";
import { orderTrackingApi } from "./api/ordertracking";
import { warehouseApi } from "./api/warehouse";
import { barcodeApi } from "./api/barcode";
import { components } from "./components";

export const store = configureStore({
  reducer: {
    auth: authSlice,
    themeConfig: themeConfigSlice,
    components: components.reducer,

    [roleApi.reducerPath]: roleApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [loginApi.reducerPath]: loginApi.reducer,
    [companyApi.reducerPath]: companyApi.reducer,
    [documentApi.reducerPath]: documentApi.reducer,
    [evidanceCollectionApi.reducerPath]: evidanceCollectionApi.reducer,
    [orderTrackingApi.reducerPath]: orderTrackingApi.reducer,
    [warehouseApi.reducerPath]: warehouseApi.reducer,
    [barcodeApi.reducerPath]: barcodeApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(loginApi.middleware)
      .concat(roleApi.middleware)
      .concat(userApi.middleware)
      .concat(companyApi.middleware)
      .concat(documentApi.middleware)
      .concat(evidanceCollectionApi.middleware)
      .concat(orderTrackingApi.middleware)
      .concat(warehouseApi.middleware)
      .concat(barcodeApi.middleware)
    });

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

setupListeners(store.dispatch);

export const resetAllState = () => {
  store.dispatch(userApi.util.resetApiState());
};
