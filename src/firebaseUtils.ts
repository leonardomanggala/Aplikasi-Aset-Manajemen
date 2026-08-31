import { db } from './firebase';
import { collection, doc, setDoc, updateDoc, getDocs, getDoc, writeBatch, onSnapshot, deleteField } from 'firebase/firestore';
import { Asset, User } from './types';

export const saveAssetToFirebase = async (asset: Asset) => {
  const assetRef = doc(db, 'assets', asset.id);
  await setDoc(assetRef, asset);
};

export const deleteAssetFromFirebase = async (assetId: string) => {
  const assetRef = doc(db, 'assets', assetId);
  await setDoc(assetRef, { _deleted: true }, { merge: true }); // Soft delete
};

export const deleteAssetsFromFirebase = async (assetIds: string[]) => {
  // Firestore batch limit is 500 operations. We need to chunk it.
  const chunkSize = 400;
  for (let i = 0; i < assetIds.length; i += chunkSize) {
    const chunk = assetIds.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((assetId) => {
      const assetRef = doc(db, 'assets', assetId);
      batch.set(assetRef, { _deleted: true }, { merge: true });
    });
    await batch.commit();
  }
};

export const syncAllAssetsToFirebase = async (assets: Asset[]) => {
  const batch = writeBatch(db);
  assets.forEach((asset) => {
    const assetRef = doc(db, 'assets', asset.id);
    batch.set(assetRef, asset);
  });
  await batch.commit();
};

export const getAllAssetsFromFirebase = async (): Promise<Asset[]> => {
  const querySnapshot = await getDocs(collection(db, 'assets'));
  const assets: Asset[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data() as Asset;
    if (!(data as any)._deleted) {
      assets.push(data);
    }
  });
  return assets;
};

export const saveUserToFirebase = async (user: User) => {
  const userRef = doc(db, 'users', user.id);
  await setDoc(userRef, user);
};

export const deleteUserFromFirebase = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, { _deleted: true }, { merge: true });
};

export const syncAllUsersToFirebase = async (users: User[]) => {
  const batch = writeBatch(db);
  users.forEach((user) => {
    const userRef = doc(db, 'users', user.id);
    batch.set(userRef, user);
  });
  await batch.commit();
};

export const getAllUsersFromFirebase = async (): Promise<User[]> => {
  const querySnapshot = await getDocs(collection(db, 'users'));
  const users: User[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data() as User;
    if (!(data as any)._deleted) {
      users.push(data);
    }
  });
  return users;
};

export const syncMasterDataToFirebase = async (data: Record<string, any>) => {
  const docRef = doc(db, 'settings', 'masterData');
  try {
    await updateDoc(docRef, data);
  } catch (err: any) {
    if (err.code === 'not-found') {
      await setDoc(docRef, data, { merge: true });
    } else {
      throw err;
    }
  }
};


export const updateMasterDataAtomic = async (
  mapName: string, 
  addedOrUpdated: Record<string, string>, 
  deletedCodes: string[]
) => {
  const docRef = doc(db, 'settings', 'masterData');
  const payload: Record<string, any> = {};
  
  for (const [code, name] of Object.entries(addedOrUpdated)) {
    payload[`${mapName}.${code}`] = name;
  }
  for (const code of deletedCodes) {
    payload[`${mapName}.${code}`] = deleteField();
  }
  
  if (Object.keys(payload).length > 0) {
    try {
      await updateDoc(docRef, payload);
    } catch (err: any) {
      // Handled by init
    }
  }
};

export const getMasterDataFromFirebase = async (): Promise<Record<string, any> | null> => {
  const docRef = doc(db, 'settings', 'masterData');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
};


export const subscribeToAssets = (callback: (assets: Asset[]) => void) => {
  const q = collection(db, 'assets');
  return onSnapshot(q, (querySnapshot) => {
    const assets: Asset[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Asset;
      if (!(data as any)._deleted) {
        assets.push(data);
      }
    });
    callback(assets);
  });
};

export const subscribeToUsers = (callback: (users: User[]) => void) => {
  const q = collection(db, 'users');
  return onSnapshot(q, (querySnapshot) => {
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as User;
      if (!(data as any)._deleted) {
        users.push(data);
      }
    });
    callback(users);
  });
};

export const subscribeToMasterData = (callback: (data: Record<string, any> | null) => void) => {
  const docRef = doc(db, 'settings', 'masterData');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback(null);
    }
  });
};
