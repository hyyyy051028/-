import { openDB } from 'idb';

const dbName = 'PhotoGalleryDB';
const storeName = 'photos';
const version = 2; // 增加版本号

async function initDB() {
  return openDB(dbName, version, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (oldVersion < 1) {
        // 创建初始数据库
        const store = db.createObjectStore(storeName, { 
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('uploadDate', 'uploadDate');
      }
      
      if (oldVersion < 2) {
        // 版本2：添加order索引
        const store = transaction.objectStore(storeName);
        if (!store.indexNames.contains('order')) {
          store.createIndex('order', 'order');
        }
        
        // 为现有照片添加order字段
        store.openCursor().then(function addOrder(cursor) {
          if (!cursor) return;
          
          const photo = cursor.value;
          if (!photo.order) {
            photo.order = cursor.key;
            cursor.update(photo);
          }
          
          return cursor.continue().then(addOrder);
        });
      }
    },
  });
}

export async function addPhoto(photo) {
  const db = await initDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  
  // 获取当前最大的order值
  const allPhotos = await store.getAll();
  const maxOrder = allPhotos.reduce((max, p) => Math.max(max, p.order || 0), -1);
  
  // 添加新照片，设置order为最大值+1
  await store.add({
    ...photo,
    order: maxOrder + 1
  });
  await tx.done;
}

export async function addPhotos(photos) {
  const db = await initDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  
  // 获取当前最大的order值
  const allPhotos = await store.getAll();
  const maxOrder = allPhotos.reduce((max, p) => Math.max(max, p.order || 0), -1);
  
  // 批量添加照片，设置递增的order
  await Promise.all(
    photos.map(async (photo, index) => {
      await store.add({
        ...photo,
        order: maxOrder + index + 1
      });
    })
  );
  
  await tx.done;
}

export async function getAllPhotos() {
  const db = await initDB();
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const photos = await store.getAll();
  
  // 按order排序，如果order不存在则按uploadDate排序
  return photos.sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    return b.uploadDate.localeCompare(a.uploadDate);
  });
}

export async function updatePhotoOrder(updates) {
  const db = await initDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  
  // 批量更新照片顺序
  await Promise.all(
    updates.map(async ({ id, order }) => {
      const photo = await store.get(id);
      if (photo) {
        await store.put({ ...photo, order });
      }
    })
  );
  
  await tx.done;
}

export async function deletePhoto(id) {
  const db = await initDB();
  await db.delete(storeName, id);
}

export async function clearPhotos() {
  const db = await initDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  await store.clear();
  await tx.done;
}
