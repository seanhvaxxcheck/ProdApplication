// Offline storage utilities for PWA functionality

interface OfflineAction {
  id: string;
  type: 'add' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

class OfflineStorage {
  private dbName = 'MyGlassCaseOffline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('inventory')) {
          const inventoryStore = db.createObjectStore('inventory', { keyPath: 'id' });
          inventoryStore.createIndex('user_id', 'user_id', { unique: false });
        }

        if (!db.objectStoreNames.contains('wishlist')) {
          const wishlistStore = db.createObjectStore('wishlist', { keyPath: 'id' });
          wishlistStore.createIndex('user_id', 'user_id', { unique: false });
        }

        if (!db.objectStoreNames.contains('pendingActions')) {
          db.createObjectStore('pendingActions', { keyPath: 'id' });
        }
      };
    });
  }

  async saveInventoryItem(item: any): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['inventory'], 'readwrite');
    const store = transaction.objectStore('inventory');
    await store.put(item);
  }

  async getInventoryItems(userId: string): Promise<any[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['inventory'], 'readonly');
    const store = transaction.objectStore('inventory');
    const index = store.index('user_id');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(userId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async savePendingAction(action: OfflineAction): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['pendingActions'], 'readwrite');
    const store = transaction.objectStore('pendingActions');
    await store.put(action);
  }

  async getPendingActions(): Promise<OfflineAction[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['pendingActions'], 'readonly');
    const store = transaction.objectStore('pendingActions');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removePendingAction(actionId: string): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['pendingActions'], 'readwrite');
    const store = transaction.objectStore('pendingActions');
    await store.delete(actionId);
  }

  async clearAllData(): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['inventory', 'wishlist', 'pendingActions'], 'readwrite');
    
    await Promise.all([
      transaction.objectStore('inventory').clear(),
      transaction.objectStore('wishlist').clear(),
      transaction.objectStore('pendingActions').clear(),
    ]);
  }
}

export const offlineStorage = new OfflineStorage();